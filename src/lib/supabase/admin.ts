import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseSecretSupabaseConfig, requireSecretSupabaseConfig } from '@/lib/env';

/**
 * Creates a privileged Supabase database client for server-side operations.
 * Supabase is used strictly as a PostgreSQL database; authentication is managed by Clerk.
 */
export function createAdminClient(): SupabaseClient {
  const { url, secretKey } = requireSecretSupabaseConfig();
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function getOptionalAdminClient(): SupabaseClient | null {
  const config = parseSecretSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Mirrors a Clerk user record into the Supabase public.profiles table.
 * Keyed by clerk_user_id as primary key.
 */
export async function syncClerkUserProfile({
  clerkUserId,
  email,
  displayName,
  role = 'user'
}: {
  clerkUserId: string;
  email: string;
  displayName?: string | null;
  role?: 'user' | 'admin';
}) {
  const client = getOptionalAdminClient();
  if (!client) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || normalizedEmail.split('@')[0];
  const now = new Date().toISOString();

  try {
    const { data, error } = await client
      .from('profiles')
      .upsert(
        {
          clerk_user_id: clerkUserId,
          id: clerkUserId,
          email: normalizedEmail,
          display_name: name,
          role,
          is_admin: role === 'admin',
          created_at: now
        },
        { onConflict: 'clerk_user_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      // Fallback if profiles table is keyed by id
      await client
        .from('profiles')
        .upsert(
          {
            id: clerkUserId,
            email: normalizedEmail,
            display_name: name,
            is_admin: role === 'admin',
            created_at: now
          },
          { onConflict: 'id' }
        );
    }
    return data;
  } catch (err) {
    console.warn('Supabase profiles sync warning:', err);
    return null;
  }
}

