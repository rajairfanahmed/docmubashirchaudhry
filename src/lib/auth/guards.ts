import type { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminEmail, parseClerkConfig } from '@/lib/env';
import { resolveSiteUrl } from '@/lib/seo/metadata';
import type { ProfileRow } from '@/lib/supabase/database.types';
import { syncClerkUserProfile } from '@/lib/supabase/admin';

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

export interface AuthenticatedContext {
  user: { id: string };
  email: string;
  displayName: string | null;
  authProvider: 'google' | 'email' | 'unknown';
  isAdmin: boolean;
  profile: ProfileRow | null;
  applyAuthCookies: <T extends NextResponse>(response: T) => T;
}

export async function getOptionalSessionUser(): Promise<{
  user: { id: string } | null;
  email: string | null;
  displayName: string | null;
  authProvider: 'google' | 'email' | 'unknown' | null;
  isAdmin: boolean;
  applyAuthCookies: <T extends NextResponse>(response: T) => T;
} | null> {
  const clerkConfig = parseClerkConfig();
  if (!clerkConfig) {
    return null;
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        user: null,
        email: null,
        displayName: null,
        authProvider: null,
        isAdmin: false,
        applyAuthCookies: <T extends NextResponse>(res: T) => res
      };
    }

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser?.emailAddresses[0]?.emailAddress ??
      '';
    const email = primaryEmail.trim().toLowerCase() || null;
    const displayName =
      clerkUser?.fullName?.trim() ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
      (email ? email.split('@')[0] : null);

    const isGoogle = clerkUser?.externalAccounts?.some(
      (acc) => acc.provider?.toLowerCase().includes('google')
    );
    const authProvider: 'google' | 'email' | 'unknown' = isGoogle
      ? 'google'
      : email
      ? 'email'
      : 'unknown';

    return {
      user: { id: userId },
      email,
      displayName: displayName || null,
      authProvider,
      isAdmin:
        (clerkUser?.publicMetadata as { role?: string } | undefined)?.role === 'admin' ||
        isAdminEmail(email),
      applyAuthCookies: <T extends NextResponse>(res: T) => res
    };
  } catch {
    return {
      user: null,
      email: null,
      displayName: null,
      authProvider: null,
      isAdmin: false,
      applyAuthCookies: <T extends NextResponse>(res: T) => res
    };
  }
}

export async function requireAuthenticatedUser(options?: {
  syncProfile?: boolean;
}): Promise<AuthenticatedContext> {
  let userId: string | null = null;
  try {
    const authState = await auth();
    userId = authState.userId;
  } catch {
    userId = null;
  }

  if (!userId) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'Sign in required to perform this action.'
    );
  }

  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    '';
  const email = primaryEmail.trim().toLowerCase();
  if (!email) {
    throw new ApiError(
      401,
      'EMAIL_REQUIRED',
      'Authenticated account must have a verified email address.'
    );
  }

  const displayName =
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
    (email ? email.split('@')[0] : null);

  const isGoogle = clerkUser?.externalAccounts?.some(
    (acc) => acc.provider?.toLowerCase().includes('google')
  );
  const authProvider: 'google' | 'email' | 'unknown' = isGoogle ? 'google' : 'email';
  const isAdmin = isAdminEmail(email);

  if (options?.syncProfile !== false) {
    void syncClerkUserProfile({
      clerkUserId: userId,
      email,
      displayName,
      role: isAdmin ? 'admin' : 'user'
    }).catch(() => {});
  }

  return {
    user: { id: userId },
    email,
    displayName: displayName || null,
    authProvider,
    isAdmin,
    profile: null,
    applyAuthCookies: <T extends NextResponse>(res: T) => res
  };
}

export async function requireAdminUser(): Promise<AuthenticatedContext> {
  const auth = await requireAuthenticatedUser({ syncProfile: false });
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

function isLoopbackHost(host: string): boolean {
  const bare = host.replace(/^\[(.*)\]$/, '$1').split(':')[0]?.toLowerCase() ?? '';
  return bare === 'localhost' || bare === '127.0.0.1' || bare === '::1';
}

/**
 * Resolves the public origin for auth redirects and email links.
 * Never returns localhost or loopback addresses in any environment; falls back
 * cleanly to the configured official domain (`https://docmubashirchaudhry.vercel.app`).
 */
export function resolveRequestOrigin(request: NextRequest): string {
  const canonicalOrigin = resolveSiteUrl();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();

  if (
    forwardedHost &&
    /^[a-z0-9.-]+(?::\d+)?$/i.test(forwardedHost) &&
    !isLoopbackHost(forwardedHost)
  ) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (hostHeader && /^[a-z0-9.-]+(?::\d+)?$/i.test(hostHeader) && !isLoopbackHost(hostHeader)) {
    return `https://${hostHeader}`;
  }

  try {
    const reqUrl = new URL(request.url);
    if (!isLoopbackHost(reqUrl.hostname)) {
      return reqUrl.origin;
    }
  } catch {
    // Fall through to official canonical origin
  }

  return canonicalOrigin;
}
