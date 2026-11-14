import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContentRepository } from '@/lib/data';
import { getLiveDatabaseQuestions } from '@/lib/data/live-questions';

export const dynamic = 'force-dynamic';

const OptionalPositiveIntSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  const parsed = Number(val);
  return parsed;
}, z.number().int().min(1).optional());

const PageSizeSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  const parsed = Number(val);
  return parsed;
}, z.number().int().min(1).max(100).optional());

const QuestionsQuerySchema = z.object({
  page: OptionalPositiveIntSchema.default(1),
  pageSize: PageSizeSchema.default(20),
  examId: z.string().trim().min(1).optional(),
  subjectId: z.string().trim().min(1).optional(),
  postId: z.string().trim().min(1).optional(),
  topicIds: z
    .string()
    .trim()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : undefined
    ),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  onlyVerified: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
});

function nonEmptyParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  if (value === null || value.trim() === '') return undefined;
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawTopicIds = nonEmptyParam(request, 'topicIds') ?? nonEmptyParam(request, 'topicId');

  const parsed = QuestionsQuerySchema.safeParse({
    page: nonEmptyParam(request, 'page'),
    pageSize: nonEmptyParam(request, 'pageSize'),
    examId: nonEmptyParam(request, 'examId'),
    subjectId: nonEmptyParam(request, 'subjectId'),
    postId: nonEmptyParam(request, 'postId'),
    topicIds: rawTopicIds,
    difficulty: nonEmptyParam(request, 'difficulty'),
    onlyVerified: nonEmptyParam(request, 'onlyVerified')
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters for /api/questions',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const repo = getContentRepository();
  const [exams, subjects, topics] = await Promise.all([
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics()
  ]);
  const posts = (await Promise.all(exams.map((exam) => repo.getRecruitmentPosts(exam.slug)))).flat();
  const liveQuestions = await getLiveDatabaseQuestions(topics, subjects, posts);

  if (liveQuestions.length > 0) {
    const { page, pageSize, examId, subjectId, postId, topicIds, difficulty, onlyVerified } =
      parsed.data;

    const subjectTopicSet = subjectId
      ? new Set(topics.filter((t) => t.subjectId === subjectId).map((t) => t.id))
      : null;

    const filtered = liveQuestions.filter((q) => {
      if (examId) {
        const cleanExam = examId.replace(/^exam-/, '').toLowerCase();
        const matchesExam = q.postIds.some(
          (p) => p === examId || p.toLowerCase().includes(cleanExam)
        );
        if (!matchesExam) return false;
      }
      if (subjectTopicSet && !q.topicIds.some((tid) => subjectTopicSet.has(tid))) {
        return false;
      }
      if (postId && !q.postIds.includes(postId)) {
        return false;
      }
      if (topicIds && topicIds.length > 0 && !q.topicIds.some((tid) => topicIds.includes(tid))) {
        return false;
      }
      if (difficulty && q.difficulty !== difficulty) {
        return false;
      }
      if (onlyVerified && q.verification.status !== 'verified') {
        return false;
      }
      return true;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return NextResponse.json(
      {
        items,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  const result = await repo.getQuestionsPaginated({
    ...parsed.data,
    includeDrafts: false
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
    }
  });
}

