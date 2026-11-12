import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { isAdminEmail, parsePublicSupabaseConfig } from '@/lib/env';
import {
  createSupabaseServerClient,
  resolveAuthProvider,
  syncUserProfile,
  type ServerSupabaseContext
} from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/database.types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface AuthenticatedContext extends ServerSupabaseContext {
  user: User;
  email: string;
  isAdmin: boolean;
  profile: ProfileRow | null;
}

export async function getOptionalSessionUser(): Promise<{
  user: User | null;
  email: string | null;
  displayName: string | null;
  authProvider: 'google' | 'email' | 'unknown' | null;
  isAdmin: boolean;
  applyAuthCookies: ServerSupabaseContext['applyAuthCookies'];
} | null> {
  if (!parsePublicSupabaseConfig()) {
    return null;
  }

  const ctx = await createSupabaseServerClient();
  const { data, error } = await ctx.supabase.auth.getUser();
  if (error || !data.user) {
    return {
      user: null,
      email: null,
      displayName: null,
      authProvider: null,
      isAdmin: false,
      applyAuthCookies: ctx.applyAuthCookies
    };
  }

  const user = data.user;
  const email = (user.email ?? '').trim().toLowerCase() || null;
  const rawName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.display_name ??
    (email ? email.split('@')[0] : null);

  return {
    user,
    email,
    displayName: typeof rawName === 'string' && rawName.trim() ? rawName.trim() : null,
    authProvider: resolveAuthProvider(user),
    isAdmin: isAdminEmail(email),
    applyAuthCookies: ctx.applyAuthCookies
  };
}

export async function requireAuthenticatedUser(options?: {
  syncProfile?: boolean;
}): Promise<AuthenticatedContext> {
  const ctx = await createSupabaseServerClient();
  const { data, error } = await ctx.supabase.auth.getUser();

  if (error || !data.user) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Sign in required to perform this action.'
    );
  }

  const email = (data.user.email ?? '').trim().toLowerCase();
  if (!email) {
    throw new ApiError(
      401,
      'EMAIL_REQUIRED',
      'Authenticated account must have a verified email address.'
    );
  }

  let profile: ProfileRow | null = null;
  if (options?.syncProfile !== false) {
    profile = await syncUserProfile(data.user);
  }

  return {
    ...ctx,
    user: data.user,
    email,
    isAdmin: isAdminEmail(email),
    profile
  };
}

export async function requireAdminUser(): Promise<AuthenticatedContext> {
  const auth = await requireAuthenticatedUser({ syncProfile: true });
  if (!auth.isAdmin) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Forbidden: owner administrator access required.'
    );
  }
  return auth;
}

export function sanitizeNextPath(raw?: string | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    /[\r\n\0]/.test(trimmed)
  ) {
    return '/';
  }
  return trimmed;
}

export function resolveRequestOrigin(request: NextRequest): string {
  const isLocal = process.env.NODE_ENV !== 'production';
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';

  if (!isLocal && forwardedHost && /^[a-z0-9.-]+(?::\d+)?$/i.test(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}

