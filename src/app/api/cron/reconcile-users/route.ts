import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }
  const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const customHeader = request.headers.get('x-cron-secret')?.trim();
  return authHeader === cronSecret || customHeader === cronSecret;
}

/**
 * GET /api/cron/reconcile-users (API-33)
 * Reconciles Clerk user accounts against Supabase public.profiles.
 * Safety net: Guarantees missing profiles from delayed/dropped webhooks are synchronized.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const clerk = await clerkClient();
    const clerkUsersResponse = await clerk.users.getUserList({ limit: 100 });
    const clerkUsers = clerkUsersResponse.data ?? [];

    let reconciledCount = 0;

    for (const u of clerkUsers) {
      const primaryEmail =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        '';
      const email = primaryEmail.trim().toLowerCase();
      if (!email) continue;

      const displayName =
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.username ||
        email.split('@')[0];

      const isAdmin = isAdminEmail(email);

      const { data: existing } = await admin
        .from('profiles')
        .select('id, email, status')
        .or(`clerk_user_id.eq.${u.id},id.eq.${u.id}`)
        .maybeSingle();

      if (!existing) {
        await admin.from('profiles').insert({
          clerk_user_id: u.id,
          id: u.id,
          email,
          display_name: displayName,
          role: isAdmin ? 'admin' : 'user',
          is_admin: isAdmin,
          status: 'active',
          created_at: new Date(u.createdAt).toISOString(),
          last_active_at: new Date().toISOString()
        });
        reconciledCount += 1;
      }
    }

    return NextResponse.json(
      {
        data: {
          clerkUsersChecked: clerkUsers.length,
          newProfilesReconciled: reconciledCount,
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/reconcile-users');
  }
}
