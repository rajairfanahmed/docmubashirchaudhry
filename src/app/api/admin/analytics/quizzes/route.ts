import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizAttemptRow, QuizQuestionRow, QuizRow } from '@/lib/supabase/database.types';
import { aggregateQuizAnalytics } from '@/lib/v3/analytics';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();

    const [quizzesRes, attemptsRes, questionsRes] = await Promise.all([
      admin
        .from('quizzes')
        .select('id, slug, title, type, subject, exam_tag, is_published')
        .order('created_at', { ascending: false })
        .limit(1000),
      admin
        .from('quiz_attempts')
        .select('quiz_id, percentage, passed, answers')
        .order('created_at', { ascending: false })
        .limit(10000),
      admin
        .from('quiz_questions')
        .select('id, quiz_id, text_en, text_ur, subject, exam_tag')
        .limit(5000)
    ]);

    if (quizzesRes.error) throw quizzesRes.error;
    if (attemptsRes.error) throw attemptsRes.error;
    if (questionsRes.error) throw questionsRes.error;

    const aggregated = aggregateQuizAnalytics({
      quizzes: (quizzesRes.data ?? []) as Array<
        Pick<QuizRow, 'id' | 'slug' | 'title' | 'type' | 'subject' | 'exam_tag' | 'is_published'>
      >,
      attempts: (attemptsRes.data ?? []) as Array<
        Pick<QuizAttemptRow, 'quiz_id' | 'percentage' | 'passed' | 'answers'>
      >,
      questions: (questionsRes.data ?? []) as Array<
        Pick<QuizQuestionRow, 'id' | 'quiz_id' | 'text_en' | 'text_ur' | 'subject' | 'exam_tag'>
      >
    });

    return auth.applyAuthCookies(
      NextResponse.json(aggregated, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/analytics/quizzes');
  }
}

