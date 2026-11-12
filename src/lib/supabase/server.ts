import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  isAdminEmail,
  parsePublicSupabaseConfig,
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

export interface SupabaseAuthProviderSettings {
  emailEnabled: boolean;
  googleEnabled: boolean;
  mailerAutoconfirm: boolean;
  signupDisabled: boolean;
}

const AUTH_SETTINGS_CACHE_TTL_MS = 30_000;
let cachedAuthSettings: {
  url: string;
  value: SupabaseAuthProviderSettings;
  expiresAtMs: number;
} | null = null;

export function clearAuthSettingsCacheForTests(): void {
  cachedAuthSettings = null;
}

/**
 * Fetches enabled auth providers from Supabase public /auth/v1/settings (short TTL cached)
 * so OAuth routes and UI never redirect users into raw Supabase 400 provider-disabled errors.
 */
export async function fetchSupabaseAuthSettings(
  options?: { bypassCache?: boolean }
): Promise<SupabaseAuthProviderSettings | null> {
  const publicConfig = parsePublicSupabaseConfig();
  if (!publicConfig) return null;

  const now = Date.now();
  if (
    !options?.bypassCache &&
    cachedAuthSettings &&
    cachedAuthSettings.url === publicConfig.url &&
    cachedAuthSettings.expiresAtMs > now
  ) {
    return cachedAuthSettings.value;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_500);

  try {
    const res = await fetch(`${publicConfig.url}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: publicConfig.publishableKey,
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });

    if (!res.ok) return null;

    const payload = (await res.json().catch(() => null)) as {
      external?: Record<string, unknown>;
      disable_signup?: boolean;
      mailer_autoconfirm?: boolean;
    } | null;

    if (!payload || typeof payload !== 'object') return null;

    const value: SupabaseAuthProviderSettings = {
      emailEnabled: payload.external?.email !== false,
      googleEnabled: payload.external?.google === true,
      mailerAutoconfirm: payload.mailer_autoconfirm === true,
      signupDisabled: payload.disable_signup === true
    };

    cachedAuthSettings = {
      url: publicConfig.url,
      value,
      expiresAtMs: now + AUTH_SETTINGS_CACHE_TTL_MS
    };

    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type SupabaseAuthErrorContext =
  | 'signup'
  | 'login'
  | 'resend'
  | 'recovery'
  | 'update_password'
  | 'oauth';

export interface MappedSupabaseAuthError {
  status: number;
  code: string;
  message: string;
}

const AUTH_ERROR_DEFAULTS: Record<SupabaseAuthErrorContext, MappedSupabaseAuthError> = {
  signup: {
    status: 400,
    code: 'SIGNUP_FAILED',
    message: 'Unable to create your account right now. Please try again.'
  },
  login: {
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Incorrect email or password. Please check your credentials and try again.'
  },
  resend: {
    status: 400,
    code: 'RESEND_FAILED',
    message: 'Unable to resend verification email right now. Please try again shortly.'
  },
  recovery: {
    status: 400,
    code: 'RECOVERY_FAILED',
    message: 'Unable to send a password reset email right now. Please try again shortly.'
  },
  update_password: {
    status: 400,
    code: 'PASSWORD_UPDATE_FAILED',
    message: 'Unable to update your password right now. Please request a new reset link.'
  },
  oauth: {
    status: 400,
    code: 'OAUTH_INIT_FAILED',
    message: 'Unable to initialize Google sign-in right now.'
  }
};

export function mapSupabaseAuthError(
  error: { message?: string; code?: string; status?: number } | null | undefined,
  context: SupabaseAuthErrorContext
): MappedSupabaseAuthError {
  const rawMessage = (error?.message ?? '').trim();
  const normalizedMsg = rawMessage.toLowerCase();
  const rawCode = (error?.code ?? '').trim().toLowerCase();

  if (
    rawCode === 'user_already_exists' ||
    rawCode === 'email_exists' ||
    normalizedMsg.includes('already registered') ||
    normalizedMsg.includes('already exists') ||
    normalizedMsg.includes('already been registered')
  ) {
    return {
      status: 409,
      code: 'ACCOUNT_ALREADY_EXISTS',
      message: 'An account with this email is already created. Please sign in instead.'
    };
  }

  if (rawCode === 'email_not_confirmed' || normalizedMsg.includes('email not confirmed')) {
    return {
      status: 403,
      code: 'EMAIL_NOT_CONFIRMED',
      message:
        'Your account exists, but your email is not verified yet. Open the confirmation link in your inbox or resend a verification email below.'
    };
  }

  if (rawCode === 'invalid_credentials' || normalizedMsg.includes('invalid login credentials')) {
    return {
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect email or password. Double-check your details or create an account.'
    };
  }

  if (
    rawCode === 'over_email_send_rate_limit' ||
    rawCode === 'over_request_rate_limit' ||
    error?.status === 429 ||
    normalizedMsg.includes('rate limit') ||
    normalizedMsg.includes('too many requests') ||
    normalizedMsg.includes('for security purposes')
  ) {
    return {
      status: 429,
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication requests in a short time. Please wait a minute and try again.'
    };
  }

  if (
    rawCode === 'weak_password' ||
    normalizedMsg.includes('password should be') ||
    normalizedMsg.includes('weak password')
  ) {
    return {
      status: 400,
      code: 'WEAK_PASSWORD',
      message: 'Password is too weak. Use at least 8 characters with letters and numbers.'
    };
  }

  if (
    rawCode === 'same_password' ||
    normalizedMsg.includes('should be different from the old password')
  ) {
    return {
      status: 400,
      code: 'SAME_PASSWORD',
      message: 'Choose a new password that is different from your current password.'
    };
  }

  if (
    rawCode === 'validation_failed' &&
    (normalizedMsg.includes('provider is not enabled') || normalizedMsg.includes('unsupported provider'))
  ) {
    return {
      status: 400,
      code: 'PROVIDER_DISABLED',
      message: 'Google Sign-In is not enabled yet. Use email and password below.'
    };
  }

  if (rawCode === 'email_address_invalid' || normalizedMsg.includes('unable to validate email')) {
    return {
      status: 400,
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.'
    };
  }

  if (rawCode === 'signup_disabled' || normalizedMsg.includes('signups not allowed')) {
    return {
      status: 403,
      code: 'SIGNUP_DISABLED',
      message: 'New account registrations are currently paused.'
    };
  }

  if (rawCode === 'user_banned' || normalizedMsg.includes('user is banned')) {
    return {
      status: 403,
      code: 'ACCOUNT_DISABLED',
      message: 'This account is currently disabled.'
    };
  }

  const fallback = AUTH_ERROR_DEFAULTS[context];
  return {
    status: error?.status && error.status >= 400 && error.status < 500 ? error.status : fallback.status,
    code: fallback.code,
    message: rawMessage || fallback.message
  };
}

