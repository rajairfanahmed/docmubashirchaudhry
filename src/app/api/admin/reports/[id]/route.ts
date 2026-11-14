import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const UpdateReportSchema = z.object({
  status: z.enum(['new', 'looked_at', 'fixed', 'not_an_issue']),
  adminNote: z.string().trim().max(500).optional()
});

/**
 * PATCH /api/admin/reports/{id} (API-32)
 * Updates status and administrative resolution note for a question report.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, UpdateReportSchema);
    if ('response' in parsed) return parsed.response;

    const { id } = await context.params;
    const reportId = decodeURIComponent(id).trim();
    const admin = createSupabaseAdminClient();

    const now = new Date().toISOString();
    const isResolved = parsed.data.status === 'fixed' || parsed.data.status === 'not_an_issue';

    const { data: updated, error } = await admin
      .from('question_reports')
      .update({
        status: parsed.data.status,
        admin_note: parsed.data.adminNote ?? null,
        resolved_at: isResolved ? now : null
      })
      .eq('id', reportId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return apiErrorResponse({
        status: 404,
        code: 'REPORT_NOT_FOUND',
        message: 'The requested question report was not found.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            id: updated.id,
            status: updated.status,
            adminNote: updated.admin_note,
            resolvedAt: updated.resolved_at
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/admin/reports/[id]');
  }
}
