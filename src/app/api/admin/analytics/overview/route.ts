import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { buildThirtyDayVisitSeries } from '@/lib/v3/analytics';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

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
      downloadsTotalRes,
      visitTimestampsRes
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
      admin.from('pdf_access_log').select('id', { count: 'exact', head: true }),
      admin
        .from('site_visits')
        .select('created_at')
        .gte('created_at', thirtyDaysAgoIso)
        .limit(50000)
    ]);

    for (const res of [
      usersCountRes,
      activeTodayRes,
      visitsTodayRes,
      visits7dRes,
      visits30dRes,
      visitsTotalRes,
      attemptsTodayRes,
      attemptsTotalRes,
      downloadsTotalRes,
      visitTimestampsRes
    ]) {
      if (res.error) throw res.error;
    }

    const dailyVisitSeries = buildThirtyDayVisitSeries(
      ((visitTimestampsRes.data ?? []) as Array<{ created_at: string }>).map(
        (row) => row.created_at
      ),
      now
    );

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          totalRegisteredUsers: usersCountRes.count ?? 0,
          activeUsersToday: activeTodayRes.count ?? 0,
          quizzesAttemptedToday: attemptsTodayRes.count ?? 0,
          totalQuizAttempts: attemptsTotalRes.count ?? 0,
          totalPdfDownloads: downloadsTotalRes.count ?? 0,
          siteVisits: {
            today: visitsTodayRes.count ?? 0,
            last7Days: visits7dRes.count ?? 0,
            last30Days: visits30dRes.count ?? 0,
            total: visitsTotalRes.count ?? 0
          },
          dailyVisitSeries,
          generatedAt: now.toISOString()
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/analytics/overview');
  }
}

