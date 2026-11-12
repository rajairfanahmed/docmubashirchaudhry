import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, resolveAuthProvider, syncUserProfile } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/env';
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

    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password
    });

    if (error || !data.user) {
      return apiErrorResponse({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: error?.message ?? 'Invalid email or password.'
      });
    }

    const profile = await syncUserProfile(data.user);
    const email = (data.user.email ?? parsed.data.email).toLowerCase();

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
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/login');
  }
}

