import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import {
  createSupabaseServerClient,
  mapSupabaseAuthError,
  syncUserProfile
} from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/env';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { SignupBodySchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:signup:${extractClientIp(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, SignupBodySchema);
    if ('response' in parsed) return parsed.response;

    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    const origin = resolveRequestOrigin(request);
    const nextPath = sanitizeNextPath(parsed.data.next);
    const emailRedirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const normalizedEmail = parsed.data.email.toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: parsed.data.password,
      options: {
        emailRedirectTo,
        data: parsed.data.displayName ? { full_name: parsed.data.displayName } : undefined
      }
    });

    if (error) {
      return apiErrorResponse(mapSupabaseAuthError(error, 'signup'));
    }

    // Supabase returns an obfuscated user with empty identities array (and no error)
    // when an email is already registered, to prevent silent email enumeration.
    const hasEmptyIdentities =
      Boolean(data.user) &&
      Array.isArray(data.user?.identities) &&
      data.user.identities.length === 0;

    if (hasEmptyIdentities) {
      return apiErrorResponse({
        status: 409,
        code: 'ACCOUNT_ALREADY_EXISTS',
        message: 'An account with this email is already created. Please sign in instead.'
      });
    }

    let profile = null;
    if (data.session && data.user) {
      profile = await syncUserProfile(data.user);
    }

    const email = (data.user?.email ?? normalizedEmail).toLowerCase();
    const requiresEmailVerification = !data.session;

    return applyAuthCookies(
      NextResponse.json(
        {
          ok: true,
          requiresEmailVerification,
          message: requiresEmailVerification
            ? 'Account created. Please confirm the verification link sent to your email.'
            : 'Account created and signed in.',
          user: data.user
            ? {
                id: data.user.id,
                email,
                displayName: profile?.display_name ?? parsed.data.displayName ?? null,
                authProvider: 'email' as const,
                isAdmin: data.session ? isAdminEmail(email) : false
              }
            : null
        },
        {
          status: requiresEmailVerification ? 202 : 201,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/signup');
  }
}

