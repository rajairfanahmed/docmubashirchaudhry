import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

const PruneRequestSchema = z
  .object({
    visitRetentionDays: z.number().int().min(7).max(3650).default(180),
    pdfLogRetentionDays: z.number().int().min(30).max(3650).default(365)
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, PruneRequestSchema);
    if ('response' in parsed) return parsed.response;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('prune_v3_analytics_logs', {
      visit_retention_days: parsed.data.visitRetentionDays,
      pdf_log_retention_days: parsed.data.pdfLogRetentionDays
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          pruned: true,
          deletedVisits: Number(row?.deleted_visits ?? 0),
          deletedPdfLogs: Number(row?.deleted_pdf_logs ?? 0),
          visitRetentionDays: parsed.data.visitRetentionDays,
          pdfLogRetentionDays: parsed.data.pdfLogRetentionDays
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/analytics/prune');
  }
}

