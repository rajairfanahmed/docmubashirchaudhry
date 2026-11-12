import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:oauth:${extractClientIp(request)}`,
    limit: 30,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const provider = (request.nextUrl.searchParams.get('provider') ?? 'google').toLowerCase();
    if (provider !== 'google') {
      return apiErrorResponse({
        status: 400,
        code: 'UNSUPPORTED_PROVIDER',
        message: 'Only Google OAuth is supported.'
      });
    }

    const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
    const origin = resolveRequestOrigin(request);
    const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error || !data.url) {
      return apiErrorResponse({
        status: 500,
        code: 'OAUTH_INIT_FAILED',
        message: error?.message ?? 'Unable to initialize Google sign-in.'
      });
    }

    return applyAuthCookies(
      NextResponse.redirect(data.url, {
        status: 302,
        headers: { 'Cache-Control': 'no-store' }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/auth/oauth');
  }
}

