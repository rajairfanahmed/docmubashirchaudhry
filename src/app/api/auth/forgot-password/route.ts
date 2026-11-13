import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, mapSupabaseAuthError } from '@/lib/supabase/server';
import { parseClerkConfig, parsePublicSupabaseConfig } from '@/lib/env';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { ForgotPasswordBodySchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:forgot:${extractClientIp(request)}`,
    limit: 5,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, ForgotPasswordBodySchema);
    if ('response' in parsed) return parsed.response;

    const email = parsed.data.email.toLowerCase().trim();

    if (parseClerkConfig()) {
      return NextResponse.json(
        {
          ok: true,
          message:
            'If an account exists for that email address, a password reset code has been sent.'
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (parsePublicSupabaseConfig()) {
      const { supabase, applyAuthCookies } = await createSupabaseServerClient();
      const origin = resolveRequestOrigin(request);
      const nextPath = sanitizeNextPath(parsed.data.next);
      const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}&flow=recovery`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        return apiErrorResponse(mapSupabaseAuthError(error, 'recovery'));
      }

      return applyAuthCookies(
        NextResponse.json(
          {
            ok: true,
            message:
              'If an account exists for that email address, a password reset link has been sent.'
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
    return handleRouteError(error, 'POST /api/auth/forgot-password');
  }
}
