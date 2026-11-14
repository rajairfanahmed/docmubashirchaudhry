import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const AdminUsersQuerySchema = PaginationParamsSchema.extend({
  q: z.string().trim().max(120).optional(),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['active', 'blocked', 'deleted', 'all']).optional(),
  sort: z.enum(['newest', 'oldest', 'name', 'email']).optional()
});

/**
 * GET /api/admin/users (API-22)
 * Paginated admin user directory with search and status filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = AdminUsersQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    q: request.nextUrl.searchParams.get('q') ?? request.nextUrl.searchParams.get('search') ?? undefined,
    search: request.nextUrl.searchParams.get('search') ?? undefined,
    status: request.nextUrl.searchParams.get('status') ?? undefined,
    sort: request.nextUrl.searchParams.get('sort') ?? undefined
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, q, status, sort } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('profiles').select('*', { count: 'exact' });

    if (q) {
      const sanitized = q.replace(/[%_,()]/g, ' ').trim();
      if (sanitized) {
        query = query.or(`email.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`);
      }
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'name') {
      query = query.order('display_name', { ascending: true });
    } else if (sort === 'email') {
      query = query.order('email', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, count, error } = await query.range(from, to);
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

      if (!attemptsRes.error && attemptsRes.data) {
        for (const a of attemptsRes.data as Array<{ user_id: string; percentage: number }>) {
          const cur = attemptMap.get(a.user_id) ?? { count: 0, pctSum: 0 };
          cur.count += 1;
          cur.pctSum += Number(a.percentage ?? 0);
          attemptMap.set(a.user_id, cur);
        }
      }

      if (!downloadsRes.error && downloadsRes.data) {
        for (const d of downloadsRes.data as Array<{ user_id: string }>) {
          downloadMap.set(d.user_id, (downloadMap.get(d.user_id) ?? 0) + 1);
        }
      }
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: profiles.map((p) => {
            const stats = attemptMap.get(p.id);
            const totalQuizzesAttempted = stats?.count ?? 0;
            const averageScorePercentage =
              totalQuizzesAttempted > 0
                ? Math.round(((stats?.pctSum ?? 0) / totalQuizzesAttempted) * 100) / 100
                : 0;
            return {
              id: p.id,
              clerkUserId: p.clerk_user_id ?? p.id,
              email: p.email,
              displayName: p.display_name,
              authProvider: p.auth_provider,
              status: p.status ?? 'active',
              blockedReason: p.blocked_reason ?? null,
              role: p.role ?? (p.is_admin ? 'admin' : 'user'),
              isAdmin: Boolean(p.is_admin),
              totalQuizzesAttempted,
              averageScorePercentage,
              totalPdfDownloads: downloadMap.get(p.id) ?? 0,
              createdAt: p.created_at,
              lastActiveAt: p.last_active_at ?? p.created_at,
              lastSeenAt: p.last_seen_at ?? null
            };
          }),
          meta: {
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
    return handleRouteError(error, 'GET /api/admin/users');
  }
}
