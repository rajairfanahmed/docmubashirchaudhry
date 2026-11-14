import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { AdminActivityLogRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const ActivityLogQuerySchema = PaginationParamsSchema.extend({
  adminId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

/**
 * GET /api/admin/activity (API-30)
 * Paginated administrative audit log.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = ActivityLogQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    adminId: request.nextUrl.searchParams.get('adminId') ?? undefined,
    action: request.nextUrl.searchParams.get('action') ?? undefined,
    from: request.nextUrl.searchParams.get('from') ?? undefined,
    to: request.nextUrl.searchParams.get('to') ?? undefined
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, adminId, action, from: fromDate, to: toDate } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('admin_activity_log').select('*', { count: 'exact' });

    if (adminId) query = query.eq('admin_id', adminId);
    if (action) query = query.eq('action', action);
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (data ?? []) as AdminActivityLogRow[];
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: items.map((item) => ({
            id: item.id,
            adminId: item.admin_id,
            adminEmail: item.admin_email,
            action: item.action,
            entityType: item.entity_type,
            entityId: item.entity_id,
            details: item.details,
            createdAt: item.created_at
          })),
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
    return handleRouteError(error, 'GET /api/admin/activity');
  }
}
