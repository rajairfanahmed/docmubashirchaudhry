import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import {
  createSupabaseServerClient,
  mapSupabaseAuthError,
  resolveAuthProvider,
  syncUserProfile
} from '@/lib/supabase/server';
import { isAdminEmail, parseClerkConfig, parsePublicSupabaseConfig } from '@/lib/env';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { LoginBodySchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:login:${extractClientIp(request)}`,
    limit: 15,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, LoginBodySchema);
    if ('response' in parsed) return parsed.response;

    const email = parsed.data.email.toLowerCase().trim();
    const clerkConfig = parseClerkConfig();

    if (clerkConfig?.secretKey) {
      try {
        const clerk = await clerkClient();
        const users = await clerk.users.getUserList({ emailAddress: [email] });
        const targetUser = users.data?.[0];

        if (!targetUser) {
          return apiErrorResponse({
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login credentials. Please check your email and password.'
          });
        }

        const verify = await clerk.users.verifyPassword({
          userId: targetUser.id,
          password: parsed.data.password
        });

        if (!verify.verified) {
          return apiErrorResponse({
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login credentials. Please check your email and password.'
          });
        }

        const displayName =
          targetUser.fullName?.trim() ||
          [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ').trim() ||
          email.split('@')[0];

        const isGoogle = targetUser.externalAccounts?.some((acc) =>
          acc.provider?.toLowerCase().includes('google')
        );

        return NextResponse.json(
          {
            ok: true,
            user: {
              id: targetUser.id,
              email,
              displayName,
              authProvider: isGoogle ? 'google' : 'email',
              isAdmin: isAdminEmail(email)
            }
          },
          { status: 200, headers: { 'Cache-Control': 'no-store' } }
        );
      } catch (clerkErr) {
        return apiErrorResponse({
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login credentials. Please check your email and password.'
        });
      }
    }

    if (parsePublicSupabaseConfig()) {
      const { supabase, applyAuthCookies } = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password
      });

      if (error || !data.user) {
        return apiErrorResponse(mapSupabaseAuthError(error, 'login'));
      }

      const profile = await syncUserProfile(data.user);

      return applyAuthCookies(
        NextResponse.json(
          {
            ok: true,
            user: {
              id: data.user.id,
              email,
              displayName: profile?.display_name ?? null,
              authProvider: resolveAuthProvider(data.user),
              isAdmin: isAdminEmail(email)
            }
          },
          {
            status: 200,
            headers: { 'Cache-Control': 'no-store' }
          }
        )
      );
    }

    return apiErrorResponse({
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      message: 'Authentication service is not configured.'
    });
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/login');
  }
}
