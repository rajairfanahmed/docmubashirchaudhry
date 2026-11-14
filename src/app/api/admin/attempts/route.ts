import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizAttemptRow, ProfileRow, QuizRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const AdminAttemptsQuerySchema = PaginationParamsSchema.extend({
  quizId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['all', 'passed', 'failed']).optional()
});

/**
 * GET /api/admin/attempts (API-25)
 * Platform-wide quiz attempt query with filters for analytics and review.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = AdminAttemptsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    quizId: request.nextUrl.searchParams.get('quizId') ?? undefined,
    userId: request.nextUrl.searchParams.get('userId') ?? undefined,
    from: request.nextUrl.searchParams.get('from') ?? undefined,
    to: request.nextUrl.searchParams.get('to') ?? undefined,
    status: request.nextUrl.searchParams.get('status') ?? undefined
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, quizId, userId, from: fromDate, to: toDate, status } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
      .from('quiz_attempts')
      .select('id, user_id, quiz_id, score, max_score, percentage, passed, correct_count, incorrect_count, unanswered_count, time_taken_seconds, auto_submitted, created_at', {
        count: 'exact'
      });

    if (quizId) query = query.eq('quiz_id', quizId);
    if (userId) query = query.eq('user_id', userId);
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);
    if (status === 'passed') query = query.eq('passed', true);
    if (status === 'failed') query = query.eq('passed', false);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as Array<Omit<QuizAttemptRow, 'answers' | 'started_at'>>;

    // Resolve users and quizzes
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const quizIds = Array.from(new Set(rows.map((r) => r.quiz_id)));

    const userMap = new Map<string, { email: string; name: string | null }>();
    const quizMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: users } = await admin
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);
      if (users) {
        for (const u of users as Array<Pick<ProfileRow, 'id' | 'email' | 'display_name'>>) {
          userMap.set(u.id, { email: u.email, name: u.display_name });
        }
      }
    }

    if (quizIds.length > 0) {
      const { data: quizzes } = await admin.from('quizzes').select('id, title').in('id', quizIds);
      if (quizzes) {
        for (const q of quizzes as Array<Pick<QuizRow, 'id' | 'title'>>) {
          quizMap.set(q.id, q.title);
        }
      }
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: rows.map((r) => {
            const u = userMap.get(r.user_id);
            return {
              id: r.id,
              userId: r.user_id,
              userEmail: u?.email ?? 'Unknown User',
              userName: u?.name ?? null,
              quizId: r.quiz_id,
              quizTitle: quizMap.get(r.quiz_id) ?? 'Quiz',
              score: Number(r.score),
              maxScore: Number(r.max_score),
              percentage: Number(r.percentage),
              passed: r.passed,
              correctCount: r.correct_count,
              incorrectCount: r.incorrect_count,
              unansweredCount: r.unanswered_count,
              timeTakenSeconds: r.time_taken_seconds,
              autoSubmitted: r.auto_submitted,
              createdAt: r.created_at
            };
          }),
          meta: {
            page,
            pageSize,
            total,
            totalPages
          },
          pagination: {
            page,
            pageSize,
            total,
            totalPages
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/attempts');
  }
}
