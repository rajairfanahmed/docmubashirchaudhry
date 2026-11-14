import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { buildThirtyDayVisitSeries } from '@/lib/v3/analytics';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/overview (API-20)
 * Canonical endpoint for platform KPI overview and activity statistics.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const now = new Date();
    const startOfTodayIso = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersCountRes,
      activeTodayRes,
      visitsTodayRes,
      visits7dRes,
      visits30dRes,
      visitsTotalRes,
      attemptsTodayRes,
      attemptsTotalRes,
      downloadsTodayRes,
      downloadsTotalRes,
      quizzesCountRes,
      pdfsCountRes,
      questionsCountRes,
      visitTimestampsRes,
      recentUsersRes,
      recentAttemptsRes
    ] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', startOfTodayIso),
      admin
        .from('site_visits')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfTodayIso),
      admin
        .from('site_visits')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoIso),
      admin
        .from('site_visits')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoIso),
      admin.from('site_visits').select('id', { count: 'exact', head: true }),
      admin
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfTodayIso),
      admin.from('quiz_attempts').select('id', { count: 'exact', head: true }),
      admin
        .from('pdf_access_log')
        .select('id', { count: 'exact', head: true })
        .gte('downloaded_at', startOfTodayIso),
      admin.from('pdf_access_log').select('id', { count: 'exact', head: true }),
      admin.from('quizzes').select('id', { count: 'exact', head: true }).eq('is_published', true),
      admin.from('pdf_resources').select('id', { count: 'exact', head: true }).eq('is_published', true),
      admin.from('quiz_questions').select('id', { count: 'exact', head: true }),
      admin
        .from('site_visits')
        .select('created_at')
        .gte('created_at', thirtyDaysAgoIso)
        .limit(20000),
      admin
        .from('profiles')
        .select('id, email, display_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('quiz_attempts')
        .select('id, user_id, quiz_id, score, percentage, passed, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const dailyVisitSeries = buildThirtyDayVisitSeries(
      ((visitTimestampsRes.data ?? []) as Array<{ created_at: string }>).map(
        (row) => row.created_at
      ),
      now
    );

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            totals: {
              users: usersCountRes.count ?? 0,
              activeUsersToday: activeTodayRes.count ?? 0,
              attempts: attemptsTotalRes.count ?? 0,
              attemptsToday: attemptsTodayRes.count ?? 0,
              downloads: downloadsTotalRes.count ?? 0,
              downloadsToday: downloadsTodayRes.count ?? 0,
              publishedQuizzes: quizzesCountRes.count ?? 0,
              publishedPdfs: pdfsCountRes.count ?? 0,
              totalQuestions: questionsCountRes.count ?? 0
            },
            visits: {
              today: visitsTodayRes.count ?? 0,
              last7Days: visits7dRes.count ?? 0,
              last30Days: visits30dRes.count ?? 0,
              total: visitsTotalRes.count ?? 0
            },
            charts: {
              dailyVisits: dailyVisitSeries
            },
            recent: {
              users: recentUsersRes.data ?? [],
              attempts: recentAttemptsRes.data ?? []
            },
            checkedAt: now.toISOString()
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/overview');
  }
}
