import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { AdminNotificationRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const NotificationsQuerySchema = PaginationParamsSchema.extend({
  unreadOnly: z.enum(['true', 'false']).optional(),
  type: z.enum(['new_user', 'quiz_joined', 'all']).optional()
});

/**
 * GET /api/admin/notifications (API-29)
 * Fetches notification bell feed for admin console.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = NotificationsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    unreadOnly: request.nextUrl.searchParams.get('unread') ?? request.nextUrl.searchParams.get('unreadOnly') ?? undefined,
    type: request.nextUrl.searchParams.get('type') ?? undefined
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, unreadOnly, type } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('admin_notifications').select('*', { count: 'exact' });

    if (unreadOnly === 'true') {
      query = query.is('read_at', null);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const [listRes, unreadCountRes] = await Promise.all([
      query.order('created_at', { ascending: false }).range(from, to),
      admin
        .from('admin_notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
    ]);

    if (listRes.error) throw listRes.error;

    const items = (listRes.data ?? []) as AdminNotificationRow[];
    const total = listRes.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: items.map((item) => ({
            id: item.id,
            type: item.type,
            userId: item.user_id,
            quizId: item.quiz_id,
            title: item.title,
            message: item.message,
            isRead: Boolean(item.read_at),
            readAt: item.read_at,
            createdAt: item.created_at
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages,
            unreadCount: unreadCountRes.count ?? 0
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/notifications');
  }
}
