import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/env';
import { syncClerkUserProfile } from '@/lib/supabase/admin';

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
    }
  }

  return new Response('ok', { status: 200 });
}
