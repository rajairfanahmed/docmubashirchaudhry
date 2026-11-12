import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, syncUserProfile } from '@/lib/supabase/server';
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

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      options: {
        emailRedirectTo,
        data: parsed.data.displayName ? { full_name: parsed.data.displayName } : undefined
      }
    });

    if (error) {
      return apiErrorResponse({
        status: error.status && error.status >= 400 && error.status < 500 ? error.status : 400,
        code: 'SIGNUP_FAILED',
        message: error.message
      });
    }

    let profile = null;
    if (data.session && data.user) {
      profile = await syncUserProfile(data.user);
    }

    const email = (data.user?.email ?? parsed.data.email).toLowerCase();
    const requiresEmailVerification = !data.session;

    return applyAuthCookies(
      NextResponse.json(
        {
          ok: true,
          requiresEmailVerification,
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

