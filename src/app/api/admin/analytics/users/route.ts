import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const UsersQuerySchema = PaginationParamsSchema.extend({
  search: z.string().trim().min(1).max(120).optional()
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchRaw = request.nextUrl.searchParams.get('search');
  const parsed = UsersQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    search: searchRaw && searchRaw.trim() ? searchRaw.trim() : undefined
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, search } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('profiles').select('*', { count: 'exact' });
    if (search) {
      const sanitized = search.replace(/[%_,()]/g, ' ').trim();
      if (sanitized) {
        query = query.or(`email.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`);
      }
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const profiles = (data ?? []) as ProfileRow[];
    const userIds = profiles.map((p) => p.id);

    const attemptMap = new Map<string, { count: number; pctSum: number }>();
    const downloadMap = new Map<string, number>();

    if (userIds.length > 0) {
      const [attemptsRes, downloadsRes] = await Promise.all([
        admin
          .from('quiz_attempts')
          .select('user_id, percentage')
          .in('user_id', userIds)
          .limit(10000),
        admin
          .from('pdf_access_log')
          .select('user_id')
          .in('user_id', userIds)
          .limit(10000)
      ]);
      if (attemptsRes.error) throw attemptsRes.error;
      if (downloadsRes.error) throw downloadsRes.error;

      for (const a of (attemptsRes.data ?? []) as Array<{
        user_id: string;
        percentage: number;
      }>) {
        const cur = attemptMap.get(a.user_id) ?? { count: 0, pctSum: 0 };
        cur.count += 1;
        cur.pctSum += Number(a.percentage ?? 0);
        attemptMap.set(a.user_id, cur);
      }

      for (const d of (downloadsRes.data ?? []) as Array<{ user_id: string }>) {
        downloadMap.set(d.user_id, (downloadMap.get(d.user_id) ?? 0) + 1);
      }
    }

    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          items: profiles.map((p) => {
            const stats = attemptMap.get(p.id);
            const totalQuizzesAttempted = stats?.count ?? 0;
            const averageScorePercentage =
              totalQuizzesAttempted > 0
                ? Math.round(((stats?.pctSum ?? 0) / totalQuizzesAttempted) * 100) / 100
                : 0;
            return {
              id: p.id,
              email: p.email,
              displayName: p.display_name,
              authProvider: p.auth_provider,
              joinedAt: p.created_at,
              lastActiveAt: p.last_active_at,
              isAdmin: p.is_admin,
              totalQuizzesAttempted,
              averageScorePercentage,
              totalPdfDownloads: downloadMap.get(p.id) ?? 0
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
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/analytics/users');
  }
}

