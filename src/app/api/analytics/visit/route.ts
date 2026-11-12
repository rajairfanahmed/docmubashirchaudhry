import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';
import { VisitLogSchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rate = checkRateLimit({
    key: `analytics:visit:${extractClientIp(request)}`,
    limit: 120,
    windowMs: 5 * 60 * 1000
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate);
  }

  try {
    const parsed = await parseJsonWithSchema(request, VisitLogSchema, 8 * 1024);
    if ('response' in parsed) return parsed.response;

    if (
      parsed.data.path.startsWith('/api/') ||
      parsed.data.path.startsWith('/_next/')
    ) {
      return NextResponse.json(
        { recorded: false },
        { status: 202, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!parseSecretSupabaseConfig()) {
      return NextResponse.json(
        { recorded: false },
        { status: 202, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const session = await getOptionalSessionUser();
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('site_visits').insert({
      path: parsed.data.path,
      user_id: session?.user?.id ?? null
    });
    if (error) throw error;

    const response = NextResponse.json(
      { recorded: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
    return session ? session.applyAuthCookies(response) : response;
  } catch (error) {
    return handleRouteError(error, 'POST /api/analytics/visit');
  }
}

