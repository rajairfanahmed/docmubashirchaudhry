import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { isAdminEmail } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'blocked']),
  reason: z.string().trim().max(300).optional()
});

/**
 * PATCH /api/admin/users/{id}/status (API-24)
 * Blocks or unblocks a user.
 * Safeguard: Cannot block an administrator account (409 CANNOT_BLOCK_ADMIN).
 * Writes every block/unblock action to admin_activity_log.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, UpdateUserStatusSchema);
    if ('response' in parsed) return parsed.response;

    const { id } = await context.params;
    const userId = decodeURIComponent(id).trim();
    const admin = createSupabaseAdminClient();

    // 1. Fetch user to verify existence and check admin protection
    const { data: user, error: userError } = await admin
      .from('profiles')
      .select('*')
      .or(`clerk_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle<ProfileRow>();

    if (userError) throw userError;
    if (!user) {
      return apiErrorResponse({
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'The target user was not found.'
      });
    }

    // 2. Safeguard: Cannot block an administrator (DEC-020 / API-24)
    if (parsed.data.status === 'blocked' && (isAdminEmail(user.email) || user.is_admin)) {
      return apiErrorResponse({
        status: 409,
        code: 'CANNOT_BLOCK_ADMIN',
        message: 'Administrator accounts cannot be blocked or suspended.'
      });
    }

    const newStatus = parsed.data.status;
    const blockedReason = newStatus === 'blocked' ? (parsed.data.reason || 'Blocked by administrator') : null;

    // 3. Update status in database
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        status: newStatus,
        blocked_reason: blockedReason,
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // 4. Record in admin_activity_log (DATA-11)
    await admin.from('admin_activity_log').insert({
      admin_id: auth.user.id,
      admin_email: auth.email,
      action: newStatus === 'blocked' ? 'user.block' : 'user.unblock',
      entity_type: 'user',
      entity_id: user.id,
      details: {
        targetEmail: user.email,
        targetName: user.display_name,
        reason: blockedReason
      }
    });

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            id: user.id,
            status: newStatus,
            blockedReason
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/admin/users/[id]/status');
  }
}
