import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { parsePublicSupabaseConfig } from '@/lib/env';
import { createSupabaseServerClient, fetchSupabaseAuthSettings } from '@/lib/supabase/server';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';

function buildOAuthFallbackRedirect(
  origin: string,
  nextPath: string,
  authErrorCode: string
): NextResponse {
  const url = new URL(nextPath, origin);
  url.searchParams.set('auth', 'required');
  url.searchParams.set('next', nextPath);
  url.searchParams.set('authError', authErrorCode);

  return NextResponse.redirect(url.toString(), {
    status: 302,
    headers: { 'Cache-Control': 'no-store' }
  });
}

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

    if (!parsePublicSupabaseConfig()) {
      return buildOAuthFallbackRedirect(origin, nextPath, 'backend_not_configured');
    }

    const authSettings = await fetchSupabaseAuthSettings();
    if (authSettings && !authSettings.googleEnabled) {
      return buildOAuthFallbackRedirect(origin, nextPath, 'google_provider_disabled');
    }

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
      const msg = (error?.message ?? '').toLowerCase();
      const errorCode =
        msg.includes('provider is not enabled') || msg.includes('unsupported provider')
          ? 'google_provider_disabled'
          : 'Unable to initialize Google sign-in right now. Please sign in with email instead.';
      return buildOAuthFallbackRedirect(origin, nextPath, errorCode);
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

