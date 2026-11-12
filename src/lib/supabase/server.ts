import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  isAdminEmail,
  requirePublicSupabaseConfig,
  requireSecretSupabaseConfig
} from '@/lib/env';
import type { AuthProviderType, ProfileRow } from './database.types';

export interface PendingCookieWrite {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface ServerSupabaseContext {
  supabase: SupabaseClient;
  applyAuthCookies: <T extends NextResponse>(response: T) => T;
}

const isProduction = process.env.NODE_ENV === 'production';

export function buildSecureAuthCookieOptions(options?: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: options?.sameSite ?? 'lax',
    secure: isProduction,
    path: options?.path ?? '/'
  };
}

export async function createSupabaseServerClient(): Promise<ServerSupabaseContext> {
  const { url, publishableKey } = requirePublicSupabaseConfig();
  const cookieStore = await cookies();
  const pendingCookies: PendingCookieWrite[] = [];
  const pendingHeaders = new Map<string, string>();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: buildSecureAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            pendingHeaders.set(key, value);
          }
        }
        for (const item of cookiesToSet) {
          const hardenedOptions = buildSecureAuthCookieOptions(item.options);
          pendingCookies.push({
            name: item.name,
            value: item.value,
            options: hardenedOptions
          });
          try {
            cookieStore.set(item.name, item.value, hardenedOptions);
          } catch {
            // Safe no-op when invoked from a Server Component instead of a Route Handler.
          }
        }
      }
    }
  });

  const applyAuthCookies = <T extends NextResponse>(response: T): T => {
    for (const [key, value] of pendingHeaders.entries()) {
      response.headers.set(key, value);
    }
    for (const item of pendingCookies) {
      response.cookies.set(item.name, item.value, item.options);
    }
    return response;
  };

  return { supabase, applyAuthCookies };
}

export function createSupabaseAdminClient(): SupabaseClient {
  const { url, secretKey } = requireSecretSupabaseConfig();
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function resolveAuthProvider(user: User): AuthProviderType {
  const raw =
    typeof user.app_metadata?.provider === 'string'
      ? user.app_metadata.provider.toLowerCase()
      : '';
  if (raw === 'google') return 'google';
  if (raw === 'email') return 'email';
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];
  if (providers.includes('google')) return 'google';
  if (providers.includes('email')) return 'email';
  return 'unknown';
}

export async function syncUserProfile(user: User): Promise<ProfileRow | null> {
  const email = (user.email ?? '').trim().toLowerCase();
  if (!email) return null;

  const admin = createSupabaseAdminClient();
  const displayNameRaw =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.display_name ??
    email.split('@')[0];
  const displayName =
    typeof displayNameRaw === 'string' && displayNameRaw.trim()
      ? displayNameRaw.trim().slice(0, 120)
      : null;

  const nowIso = new Date().toISOString();
  const payload = {
    id: user.id,
    email,
    auth_provider: resolveAuthProvider(user),
    display_name: displayName,
    last_active_at: nowIso,
    is_admin: isAdminEmail(email)
  };

  const { data, error } = await admin
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

