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
 * GET /api/cron/digest (API-33)
 * Daily summary cron job.
 * Idempotency: Uses digest_runs (DATA-15) to guarantee sending at most once per calendar date.
 * Gating: Secret header required; unauthorized callers receive 404.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Check if digest was already executed for today (DATA-15)
    const { data: existingRun } = await admin
      .from('digest_runs')
      .select('id, sent_at')
      .eq('run_date', today)
      .maybeSingle();

    if (existingRun) {
      return NextResponse.json(
        {
          data: {
            runDate: today,
            status: 'already_executed',
            sentAt: existingRun.sent_at
          }
        },
        { status: 200 }
      );
    }

    // 2. Fetch pending quiz_joined notifications for the digest
    const { data: pendingNotifications } = await admin
      .from('admin_notifications')
      .select('*')
      .eq('type', 'quiz_joined')
      .eq('email_status', 'pending')
      .limit(500);

    const count = (pendingNotifications ?? []).length;

    // 3. Mark processed notifications
    if (count > 0) {
      const ids = (pendingNotifications ?? []).map((n) => n.id);
      await admin
        .from('admin_notifications')
        .update({ email_status: 'sent' })
        .in('id', ids);
    }

    // 4. Record execution in digest_runs
    const sentAt = new Date().toISOString();
    await admin.from('digest_runs').insert({
      run_date: today,
      sent_at: sentAt,
      recipient_count: 1
    });

    return NextResponse.json(
      {
        data: {
          runDate: today,
          status: 'completed',
          eventsProcessed: count,
          sentAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/digest');
  }
}
