import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const MarkReadSchema = z.union([
  z.object({
    all: z.literal(true)
  }),
  z.object({
    ids: z.array(z.string().uuid()).min(1)
  })
]);

/**
 * POST /api/admin/notifications/read (API-29)
 * Marks notifications as read by admin (either by explicit list of IDs or all).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, MarkReadSchema);
    if ('response' in parsed) return parsed.response;

    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    if ('all' in parsed.data && parsed.data.all) {
      const { error } = await admin
        .from('admin_notifications')
        .update({ read_at: now })
        .is('read_at', null);

      if (error) throw error;
    } else if ('ids' in parsed.data && Array.isArray(parsed.data.ids)) {
      const { error } = await admin
        .from('admin_notifications')
        .update({ read_at: now })
        .in('id', parsed.data.ids);

      if (error) throw error;
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            ok: true,
            markedAt: now
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/notifications/read');
  }
}
