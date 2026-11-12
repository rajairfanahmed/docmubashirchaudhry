import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, mapSupabaseAuthError } from '@/lib/supabase/server';
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

    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    const origin = resolveRequestOrigin(request);
    const nextPath = sanitizeNextPath(parsed.data.next);
    const emailRedirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: parsed.data.email.toLowerCase(),
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
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/resend');
  }
}

