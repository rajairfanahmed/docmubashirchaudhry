import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, mapSupabaseAuthError } from '@/lib/supabase/server';
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

    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    const origin = resolveRequestOrigin(request);
    const nextPath = sanitizeNextPath(parsed.data.next);
    const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}&flow=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email.toLowerCase(), {
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
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/forgot-password');
  }
}

