import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }
  const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const customHeader = request.headers.get('x-cron-secret')?.trim();
  return authHeader === cronSecret || customHeader === cronSecret;
}

/**
 * GET /api/cron/finalize-attempts (API-33)
 * Sweeps expired in-progress quiz attempts and auto-submits them.
 * Gating: Secret header required; unauthorized callers receive 404.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    // Find and update expired attempts that are still in_progress
    const { data: expiredAttempts, error: sweepError } = await admin
      .from('quiz_attempts')
      .update({
        auto_submitted: true
      })
      .eq('auto_submitted', false)
      .not('started_at', 'is', null)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (sweepError) throw sweepError;

    return NextResponse.json(
      {
        data: {
          sweptCount: (expiredAttempts ?? []).length,
          timestamp: nowIso
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/finalize-attempts');
  }
}
