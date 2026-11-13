import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import {
  createSupabaseServerClient,
  mapSupabaseAuthError,
  syncUserProfile
} from '@/lib/supabase/server';
import { isAdminEmail, parseClerkConfig, parsePublicSupabaseConfig } from '@/lib/env';
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

    const email = parsed.data.email.toLowerCase().trim();
    const clerkConfig = parseClerkConfig();

    if (clerkConfig?.secretKey) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.createUser({
          emailAddress: [email],
          password: parsed.data.password,
          firstName: parsed.data.displayName?.trim() || undefined
        });

        const displayName =
          user.fullName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          parsed.data.displayName?.trim() ||
          email.split('@')[0];

        return NextResponse.json(
          {
            ok: true,
            requiresEmailVerification: false,
            user: {
              id: user.id,
              email,
              displayName,
              authProvider: 'email',
              isAdmin: isAdminEmail(email)
            }
          },
          { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
      } catch (err: unknown) {
        const clerkErr = err as {
          status?: number;
          errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
        };

        const code = clerkErr.errors?.[0]?.code;
        if (code === 'form_identifier_exists') {
          return apiErrorResponse({
            status: 409,
            code: 'ACCOUNT_ALREADY_EXISTS',
            message: 'An account with this email is already created. Please sign in instead.'
          });
        }

        if (code === 'form_password_pwned') {
          return apiErrorResponse({
            status: 422,
            code: 'PASSWORD_PWNED',
            message:
              'This password has been flagged in public security breaches. Please choose a different, secure password.'
          });
        }

        return apiErrorResponse({
          status: clerkErr.status || 400,
          code: code || 'SIGNUP_FAILED',
          message:
            clerkErr.errors?.[0]?.longMessage ||
            clerkErr.errors?.[0]?.message ||
            'Unable to create account right now.'
        });
      }
    }

    if (parsePublicSupabaseConfig()) {
      const { supabase, applyAuthCookies } = await createSupabaseServerClient();
      const origin = resolveRequestOrigin(request);
      const nextPath = sanitizeNextPath(parsed.data.next);
      const emailRedirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: parsed.data.password,
        options: {
          emailRedirectTo,
          data: parsed.data.displayName ? { full_name: parsed.data.displayName } : undefined
        }
      });

      if (error) {
        return apiErrorResponse(mapSupabaseAuthError(error, 'signup'));
      }

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

      const isAutoconfirmed = Boolean(data.session && data.user);
      let profile = null;
      if (isAutoconfirmed && data.user) {
        profile = await syncUserProfile(data.user);
      }

      return applyAuthCookies(
        NextResponse.json(
          {
            ok: true,
            requiresEmailVerification: !isAutoconfirmed,
            user: isAutoconfirmed && data.user
              ? {
                  id: data.user.id,
                  email,
                  displayName: profile?.display_name ?? parsed.data.displayName ?? null,
                  authProvider: 'email',
                  isAdmin: isAdminEmail(email)
                }
              : null
          },
          { status: 200, headers: { 'Cache-Control': 'no-store' } }
        )
      );
    }

    return apiErrorResponse({
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      message: 'Authentication service is not configured.'
    });
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/signup');
  }
}
