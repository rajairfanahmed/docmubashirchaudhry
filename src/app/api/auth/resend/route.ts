import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, mapSupabaseAuthError } from '@/lib/supabase/server';
import { parseClerkConfig, parsePublicSupabaseConfig } from '@/lib/env';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { ResendVerificationBodySchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:resend:${extractClientIp(request)}`,
    limit: 5,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, ResendVerificationBodySchema);
    if ('response' in parsed) return parsed.response;

    const email = parsed.data.email.toLowerCase().trim();

    if (parseClerkConfig()) {
      return NextResponse.json(
        {
          ok: true,
          message: 'Verification code sent. Check your inbox.'
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (parsePublicSupabaseConfig()) {
      const { supabase, applyAuthCookies } = await createSupabaseServerClient();
      const origin = resolveRequestOrigin(request);
      const nextPath = sanitizeNextPath(parsed.data.next);
      const emailRedirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo
        }
      });

      if (error) {
        return apiErrorResponse(mapSupabaseAuthError(error, 'resend'));
      }

      return applyAuthCookies(
        NextResponse.json(
          {
            ok: true,
            message:
              'Confirmation email sent. Check your inbox and spam folder, and open the link in this browser.'
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
    return handleRouteError(error, 'POST /api/auth/resend');
  }
}
