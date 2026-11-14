import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfAccessLogRow, PdfResourceRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = PaginationParamsSchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAuthenticatedUser({ syncProfile: false });
    const admin = createSupabaseAdminClient();
    const { page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await admin
      .from('pdf_access_log')
      .select('id, pdf_id, downloaded_at', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .order('downloaded_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const logs = (data ?? []) as Array<Pick<PdfAccessLogRow, 'id' | 'pdf_id' | 'downloaded_at'>>;
    const pdfIds = Array.from(new Set(logs.map((l) => l.pdf_id)));

    const pdfMap = new Map<
      string,
      Pick<PdfResourceRow, 'id' | 'slug' | 'title' | 'subject' | 'exam_tag'> & { file_bytes?: number; file_size?: number }
    >();
    if (pdfIds.length > 0) {
      const { data: pdfs, error: pError } = await admin
        .from('pdf_resources')
        .select('id, slug, title, subject, exam_tag, file_bytes')
        .in('id', pdfIds);
      if (pError) throw pError;
      for (const p of (pdfs ?? []) as Array<
        Pick<PdfResourceRow, 'id' | 'slug' | 'title' | 'subject' | 'exam_tag'> & { file_bytes?: number; file_size?: number }
      >) {
        pdfMap.set(p.id, p);
      }
    }

    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          items: logs.map((log) => {
            const pdf = pdfMap.get(log.pdf_id);
            return {
              id: log.id,
              pdfId: log.pdf_id,
              slug: pdf?.slug ?? null,
              title: pdf?.title ?? 'Study PDF',
              subject: pdf?.subject ?? null,
              examTag: pdf?.exam_tag ?? null,
              fileSize: pdf?.file_bytes ?? pdf?.file_size ?? null,
              downloadedAt: log.downloaded_at
            };
          }),
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/me/downloads');
  }
}

