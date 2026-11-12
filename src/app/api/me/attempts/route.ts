import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizAttemptRow, QuizRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = PaginationParamsSchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAuthenticatedUser({ syncProfile: false });
    const admin = createSupabaseAdminClient();
    const { page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await admin
      .from('quiz_attempts')
      .select(
        'id, quiz_id, score, max_score, percentage, passed, correct_count, incorrect_count, unanswered_count, time_taken_seconds, auto_submitted, created_at',
        { count: 'exact' }
      )
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as Array<
      Omit<QuizAttemptRow, 'user_id' | 'answers' | 'started_at'>
    >;

    const quizIds = Array.from(new Set(rows.map((r) => r.quiz_id)));
    const quizMap = new Map<string, Pick<QuizRow, 'id' | 'slug' | 'title' | 'type' | 'subject' | 'exam_tag'>>();
    if (quizIds.length > 0) {
      const { data: quizzes, error: qError } = await admin
        .from('quizzes')
        .select('id, slug, title, type, subject, exam_tag')
        .in('id', quizIds);
      if (qError) throw qError;
      for (const q of (quizzes ?? []) as Array<
        Pick<QuizRow, 'id' | 'slug' | 'title' | 'type' | 'subject' | 'exam_tag'>
      >) {
        quizMap.set(q.id, q);
      }
    }

    // Fetch user's summary aggregates across all attempts
    const { data: allScores, error: statsError } = await admin
      .from('quiz_attempts')
      .select('percentage, passed')
      .eq('user_id', auth.user.id);
    if (statsError) throw statsError;

    const scoreList = (allScores ?? []) as Array<{ percentage: number; passed: boolean }>;
    const totalAttempts = scoreList.length;
    const averagePercentage =
      totalAttempts > 0
        ? Math.round(
            (scoreList.reduce((sum, s) => sum + Number(s.percentage), 0) / totalAttempts) * 100
          ) / 100
        : 0;
    const bestPercentage =
      totalAttempts > 0
        ? Math.max(...scoreList.map((s) => Number(s.percentage)))
        : 0;
    const passedCount = scoreList.filter((s) => s.passed).length;

    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          summary: {
            totalAttempts,
            averagePercentage,
            bestPercentage,
            passedCount
          },
          items: rows.map((row) => {
            const quiz = quizMap.get(row.quiz_id);
            return {
              id: row.id,
              quizId: row.quiz_id,
              quizSlug: quiz?.slug ?? null,
              quizTitle: quiz?.title ?? 'Quiz',
              quizType: quiz?.type ?? null,
              subject: quiz?.subject ?? null,
              examTag: quiz?.exam_tag ?? null,
              score: Number(row.score),
              maxScore: Number(row.max_score),
              percentage: Number(row.percentage),
              passed: row.passed,
              correctCount: row.correct_count,
              incorrectCount: row.incorrect_count,
              unansweredCount: row.unanswered_count,
              timeTakenSeconds: row.time_taken_seconds,
              autoSubmitted: row.auto_submitted,
              createdAt: row.created_at
            };
          }),
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
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/me/attempts');
  }
}

