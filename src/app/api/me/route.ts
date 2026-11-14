import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { getOptionalAdminClient } from '@/lib/supabase/admin';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters')
});

const DeleteAccountSchema = z.object({
  confirm: z.literal('DELETE')
});

/**
 * GET /api/me (API-02)
 * Returns current authenticated user profile.
 * Even if blocked, returns 200 with status: "blocked" so client UI can inform the user.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ allowBlocked: true, syncProfile: false });
    const admin = getOptionalAdminClient();

    let profileStatus: 'active' | 'blocked' | 'deleted' = 'active';
    let createdAt = new Date().toISOString();
    let displayName = auth.displayName;
    let avatarUrl: string | null = null;

    if (admin) {
      const { data } = await admin
        .from('profiles')
        .select('*')
        .or(`clerk_user_id.eq.${auth.user.id},id.eq.${auth.user.id}`)
        .maybeSingle<ProfileRow>();

      if (data) {
        if (data.status) profileStatus = data.status;
        if (data.created_at) createdAt = data.created_at;
        if (data.display_name) displayName = data.display_name;
      }
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            id: auth.user.id,
            name: displayName,
            email: auth.email,
            avatarUrl,
            provider: auth.authProvider,
            status: profileStatus,
            isAdmin: auth.isAdmin,
            createdAt
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/me');
  }
}

/**
 * PATCH /api/me (API-03)
 * Updates user display name in Clerk and Supabase.
 * Blocked accounts are rejected with 403 ACCOUNT_BLOCKED.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ allowBlocked: false, syncProfile: false });
    const parsed = await parseJsonWithSchema(request, UpdateProfileSchema);
    if ('response' in parsed) return parsed.response;

    const newName = parsed.data.name.trim();
    const parts = newName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? newName;
    const lastName = parts.slice(1).join(' ') || undefined;

    // 1. Sync to Clerk identity
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUser(auth.user.id, {
        firstName,
        lastName
      });
    } catch (clerkErr) {
      console.warn('Failed to update Clerk user name:', clerkErr);
    }

    // 2. Sync to Supabase profiles
    const admin = getOptionalAdminClient();
    if (admin) {
      await admin
        .from('profiles')
        .update({
          display_name: newName,
          last_active_at: new Date().toISOString()
        })
        .or(`clerk_user_id.eq.${auth.user.id},id.eq.${auth.user.id}`);
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            id: auth.user.id,
            name: newName,
            email: auth.email,
            provider: auth.authProvider,
            status: 'active',
            isAdmin: auth.isAdmin
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/me');
  }
}

/**
 * DELETE /api/me (API-04)
 * Deletes user account in Clerk and anonymizes personal data in Supabase.
 * Blocked accounts cannot self-delete until unblocked.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ allowBlocked: false, syncProfile: false });
    const parsed = await parseJsonWithSchema(request, DeleteAccountSchema);
    if ('response' in parsed) return parsed.response;

    // 1. Delete Clerk account
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(auth.user.id);
    } catch (clerkErr) {
      console.warn('Failed to delete Clerk user:', clerkErr);
    }

    // 2. Anonymize profile in Supabase to preserve historical attempt records
    const admin = getOptionalAdminClient();
    if (admin) {
      await admin
        .from('profiles')
        .update({
          email: `deleted-${auth.user.id.slice(0, 8)}@anon.local`,
          display_name: 'Deleted user',
          status: 'deleted',
          last_active_at: new Date().toISOString()
        })
        .or(`clerk_user_id.eq.${auth.user.id},id.eq.${auth.user.id}`);
    }

    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/me');
  }
}
