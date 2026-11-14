import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuestionReportRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const ReportsQuerySchema = PaginationParamsSchema.extend({
  status: z.enum(['new', 'looked_at', 'fixed', 'not_an_issue', 'all']).optional()
});

/**
 * GET /api/admin/reports (API-32)
 * Lists question error reports submitted by users.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = ReportsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined,
    status: request.nextUrl.searchParams.get('status') ?? undefined
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, status } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('question_reports').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (data ?? []) as QuestionReportRow[];
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: items.map((r) => ({
            id: r.id,
            questionId: r.question_id,
            reportedBy: r.reported_by,
            reporterEmail: r.reporter_email,
            message: r.message,
            status: r.status,
            adminNote: r.admin_note,
            resolvedAt: r.resolved_at,
            createdAt: r.created_at
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/reports');
  }
}
