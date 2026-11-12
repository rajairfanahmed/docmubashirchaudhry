import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { mapSupabaseAuthError } from '@/lib/supabase/server';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { UpdatePasswordBodySchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `auth:update-password:${extractClientIp(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, UpdatePasswordBodySchema);
    if ('response' in parsed) return parsed.response;

    const auth = await requireAuthenticatedUser({ syncProfile: false });
    const { error } = await auth.supabase.auth.updateUser({
      password: parsed.data.password
    });

    if (error) {
      return apiErrorResponse(mapSupabaseAuthError(error, 'update_password'));
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          ok: true,
          message: 'Your password has been updated cleanly.'
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/update-password');
  }
}

