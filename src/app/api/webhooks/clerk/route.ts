import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/env';
import { getOptionalAdminClient, syncClerkUserProfile } from '@/lib/supabase/admin';

export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not configured.');
    return new Response('Webhook secret missing', { status: 500 });
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.text();

  let event: {
    type: string;
    data: {
      id: string;
      email_addresses?: Array<{ email_address: string; id: string }>;
      primary_email_address_id?: string;
      first_name?: string | null;
      last_name?: string | null;
      username?: string | null;
      public_metadata?: Record<string, unknown>;
    };
  };

  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    }) as unknown as typeof event;
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return new Response('Invalid webhook signature', { status: 400 });
  }

  // Idempotency: Deduplicate events via webhook_events (DATA-14)
  const client = getOptionalAdminClient();
  if (client && svixId) {
    try {
      const { data: existingEvent } = await client
        .from('webhook_events')
        .select('id')
        .eq('id', svixId)
        .maybeSingle();

      if (existingEvent) {
        return new Response(JSON.stringify({ data: { ok: true, deduplicated: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await client.from('webhook_events').insert({
        id: svixId,
        provider: 'clerk',
        received_at: new Date().toISOString()
      });
    } catch {
      // Non-blocking deduplication fallback
    }
  }

  if (event.type === 'user.created' || event.type === 'user.updated') {
    const user = event.data;
    const primaryId = user.primary_email_address_id;
    const emailObj =
      user.email_addresses?.find((e) => e.id === primaryId) ??
      user.email_addresses?.[0];
    const email = (emailObj?.email_address ?? '').toLowerCase().trim();

    if (email) {
      const role: 'admin' | 'user' = isAdminEmail(email) ? 'admin' : 'user';

      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: { role }
        });
      } catch (metaErr) {
        console.warn('Failed to update Clerk publicMetadata in webhook:', metaErr);
      }

      const displayName =
        [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
        user.username ||
        email.split('@')[0];

      await syncClerkUserProfile({
        clerkUserId: user.id,
        email,
        displayName,
        role
      });

      // On new user creation, create an admin notification (DATA-10)
      if (event.type === 'user.created' && client) {
        try {
          await client.from('admin_notifications').insert({
            type: 'new_user',
            user_id: user.id,
            title: 'New User Registered',
            message: `${displayName} (${email}) has created an account.`,
            email_status: 'pending'
          });
        } catch {
          // Non-blocking notification insert
        }
      }
    }
  } else if (event.type === 'user.deleted') {
    if (client && event.data.id) {
      try {
        // Anonymize rather than hard-delete so historical attempts remain intact (DEC-024)
        await client
          .from('profiles')
          .update({
            email: `deleted-${event.data.id.slice(0, 8)}@anon.local`,
            display_name: 'Deleted user',
            status: 'deleted',
            last_active_at: new Date().toISOString()
          })
          .or(`clerk_user_id.eq.${event.data.id},id.eq.${event.data.id}`);
      } catch {
        // Non-blocking profile deletion fallback
      }
    }
  }

  return new Response(JSON.stringify({ data: { ok: true } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
