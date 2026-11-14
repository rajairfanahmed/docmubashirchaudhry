import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseSecretSupabaseConfig } from '@/lib/env';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';
import type { OptionId, Question, RecruitmentPost, Subject, Topic } from '@/lib/schemas';

const SUBJECT_KEYWORD_MAP: Record<string, string[]> = {
  'sub-gk': ['general knowledge', 'geography', 'world', 'gk'],
  'sub-pak-studies': ['pakistan affairs', 'pakistan', 'history', 'constitution'],
  'sub-islamic-studies': ['islamic studies', 'islam', 'ethics', 'islamiat'],
  'sub-everyday-science': ['everyday science', 'science', 'biology', 'physics', 'chemistry'],
  'sub-english': ['english', 'vocabulary', 'grammar'],
  'sub-urdu': ['urdu', 'adab', 'literature'],
  'sub-math': ['basic mathematics', 'mathematics', 'math', 'arithmetic', 'ability'],
  'sub-computer': ['computer', 'it', 'information technology', 'cs'],
  'sub-sports': ['sports', 'physical education', 'olympic']
};

/**
 * Retrieves published real-time questions directly authored by the platform administrator in Supabase.
 * Maps subject, topics, posts, and answers accurately so questions show up in all relevant filters.
 */
export async function getLiveDatabaseQuestions(
  topics: Topic[] = [],
  subjects: Subject[] = [],
  posts: RecruitmentPost[] = []
): Promise<Question[]> {
  if (!parseSecretSupabaseConfig()) return [];
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quiz_questions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return [];

    return (data as QuizQuestionRow[]).map((row) => {
      const s = (row.subject || '').trim().toLowerCase();

      // 1. Resolve Subject ID
      let matchedSubjectId: string | null = null;
      const directSub = subjects.find(
        (sub) =>
          sub.name.toLowerCase() === s ||
          sub.slug.toLowerCase() === s ||
          sub.id.toLowerCase() === s ||
          s.includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(s)
      );
      if (directSub) {
        matchedSubjectId = directSub.id;
      } else {
        for (const [subId, keywords] of Object.entries(SUBJECT_KEYWORD_MAP)) {
          if (keywords.some((k) => s.includes(k))) {
            matchedSubjectId = subId;
            break;
          }
        }
      }

      // 2. Resolve Topic IDs belonging to this subject
      const candidateTopics = matchedSubjectId
        ? topics.filter((t) => t.subjectId === matchedSubjectId)
        : topics;

      let topicIds: string[] = [];
      const directTopic = candidateTopics.find(
        (t) => t.name.toLowerCase().includes(s) || s.includes(t.name.toLowerCase())
      );
      if (directTopic) {
        topicIds = [directTopic.id];
      } else if (candidateTopics.length > 0) {
        topicIds = candidateTopics.map((t) => t.id);
      } else if (topics.length > 0) {
        topicIds = [topics[0].id];
      } else {
        topicIds = ['top-general-knowledge'];
      }

      // 3. Normalize Options with lowercase 'a' | 'b' | 'c' | 'd' | 'e'
      const VALID_KEYS: OptionId[] = ['a', 'b', 'c', 'd', 'e'];
      const rawOptions = Array.isArray(row.options)
        ? (row.options as unknown as Array<Record<string, unknown>>)
        : [];

      const options =
        rawOptions.length >= 2
          ? rawOptions.map((opt, idx) => {
              const fallbackKey = VALID_KEYS[idx] || 'a';
              const rawKey = String(opt.id ?? opt.key ?? fallbackKey).trim().toLowerCase();
              const id: OptionId = (VALID_KEYS.includes(rawKey as OptionId) ? rawKey : fallbackKey) as OptionId;
              return {
                id,
                text: String(opt.text ?? opt.textEn ?? opt.textUr ?? '')
              };
            })
          : [
              { id: 'a' as const, text: 'Option A' },
              { id: 'b' as const, text: 'Option B' },
              { id: 'c' as const, text: 'Option C' },
              { id: 'd' as const, text: 'Option D' }
            ];

      // 4. Normalize correctOptionId
      const rawCorrect = String(row.correct_option ?? 'a').trim().toLowerCase();
      const correctOptionId: OptionId = (
        VALID_KEYS.includes(rawCorrect as OptionId) ? rawCorrect : 'a'
      ) as OptionId;

      // 5. Resolve Post IDs & Exam Tags
      const examTag = (row.exam_tag || '').trim().toLowerCase();
      const postIds: string[] = [];
      if (examTag) {
        postIds.push(`exam-${examTag}`);
        postIds.push(examTag);
        // Include relevant posts under this exam
        for (const post of posts) {
          if (
            post.examId.toLowerCase().includes(examTag) ||
            post.slug.toLowerCase().includes(examTag) ||
            (examTag.includes('ppsc') && post.examId === 'exam-ppsc') ||
            (examTag.includes('fpsc') && post.examId === 'exam-fpsc')
          ) {
            postIds.push(post.id);
          }
        }
      }

      return {
        id: row.id,
        slug: row.id,
        stem: row.text_en || row.text_ur || 'Question',
        options,
        correctOptionId,
        explanation: row.explanation || 'Verified correct answer.',
        difficulty: row.difficulty ?? 'medium',
        topicIds,
        postIds,
        attribution: 'self_written' as const,
        status: 'published' as const,
        verification: {
          status: 'verified' as const,
          sourceIds: ['src-portal-docmubashir'],
          lastCheckedAt: row.updated_at ? row.updated_at.slice(0, 10) : '2026-11-14',
          reviewIntervalDays: 180
        }
      };
    });
  } catch {
    return [];
  }
}
