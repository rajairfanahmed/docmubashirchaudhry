import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ProfileRow, QuizAttemptRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  const clean = str.replace(/"/g, '""');
  // Formula injection prevention: prefix dangerous characters with single quote
  if (/^[=+\-@\t\r]/.test(clean)) {
    return `"'${clean}"`;
  }
  if (/[",\n\r]/.test(clean)) {
    return `"${clean}"`;
  }
  return clean;
}

function buildCsvString(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * GET /api/admin/exports/{type} (API-31)
 * Exports users, attempts, or scores to CSV with CSV-formula injection protection.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
): Promise<Response> {
  try {
    const auth = await requireAdminUser();
    const { type } = await context.params;
    const exportType = type.toLowerCase().trim();
    const admin = createSupabaseAdminClient();
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (exportType === 'users') {
      const { data, error } = await admin
        .from('profiles')
        .select('id, email, display_name, auth_provider, status, role, is_admin, created_at, last_active_at')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      const profiles = (data ?? []) as ProfileRow[];

      const headers = [
        'ID',
        'Email',
        'Display Name',
        'Auth Provider',
        'Status',
        'Role',
        'Is Admin',
        'Created At',
        'Last Active At'
      ];

      const rows = profiles.map((p) => [
        p.id,
        p.email,
        p.display_name ?? '',
        p.auth_provider,
        p.status ?? 'active',
        p.role ?? (p.is_admin ? 'admin' : 'user'),
        p.is_admin ? 'Yes' : 'No',
        p.created_at,
        p.last_active_at ?? ''
      ]);

      const csv = buildCsvString(headers, rows);

      // Log export action (DATA-11)
      await admin.from('admin_activity_log').insert({
        admin_id: auth.user.id,
        admin_email: auth.email,
        action: 'export.users',
        entity_type: 'export',
        details: { count: profiles.length }
      });

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="docmubashir-users-${timestampStr}.csv"`,
          'Cache-Control': 'no-store'
        }
      });
    }

    if (exportType === 'attempts' || exportType === 'scores') {
      const { data, error } = await admin
        .from('quiz_attempts')
        .select('id, user_id, quiz_id, score, max_score, percentage, passed, correct_count, incorrect_count, unanswered_count, time_taken_seconds, auto_submitted, created_at')
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      const attempts = (data ?? []) as QuizAttemptRow[];

      const headers = [
        'Attempt ID',
        'User ID',
        'Quiz ID',
        'Score',
        'Max Score',
        'Percentage',
        'Passed',
        'Correct Count',
        'Incorrect Count',
        'Unanswered Count',
        'Time Taken (s)',
        'Auto Submitted',
        'Created At'
      ];

      const rows = attempts.map((a) => [
        a.id,
        a.user_id,
        a.quiz_id,
        String(a.score),
        String(a.max_score),
        String(a.percentage),
        a.passed ? 'PASS' : 'FAIL',
        String(a.correct_count),
        String(a.incorrect_count),
        String(a.unanswered_count),
        String(a.time_taken_seconds),
        a.auto_submitted ? 'Yes' : 'No',
        a.created_at
      ]);

      const csv = buildCsvString(headers, rows);

      await admin.from('admin_activity_log').insert({
        admin_id: auth.user.id,
        admin_email: auth.email,
        action: `export.${exportType}`,
        entity_type: 'export',
        details: { count: attempts.length }
      });

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="docmubashir-${exportType}-${timestampStr}.csv"`,
          'Cache-Control': 'no-store'
        }
      });
    }

    return apiErrorResponse({
      status: 422,
      code: 'INVALID_EXPORT_TYPE',
      message: "Export type must be one of 'users', 'attempts', or 'scores'."
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/exports/[type]');
  }
}
