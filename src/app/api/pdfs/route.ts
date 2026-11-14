import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseSecretSupabaseConfig } from '@/lib/env';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const PdfListQuerySchema = PaginationParamsSchema.extend({
  subject: z.string().trim().min(1).max(120).optional(),
  examTag: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(['newest', 'popular']).default('newest')
});

function nonEmpty(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  return value && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = PdfListQuerySchema.safeParse({
    page: nonEmpty(request, 'page'),
    pageSize: nonEmpty(request, 'pageSize'),
    subject: nonEmpty(request, 'subject'),
    examTag: nonEmpty(request, 'examTag'),
    search: nonEmpty(request, 'search'),
    sort: nonEmpty(request, 'sort')
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  if (!parseSecretSupabaseConfig()) {
    return NextResponse.json(
      {
        items: [],
        pagination: {
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        configured: false
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const { page, pageSize, subject, examTag, search, sort } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
      .from('pdf_resources')
      .select(
        'id, slug, title, description, subject, exam_tag, file_bytes, download_count, created_at',
        { count: 'exact' }
      )
      .eq('is_published', true);

    if (subject) {
      query = query.eq('subject', subject);
    }
    if (examTag) {
      query = query.eq('exam_tag', examTag);
    }
    if (search) {
      const sanitized = search.replace(/[%_,()]/g, ' ').trim();
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    query =
      sort === 'popular'
        ? query.order('download_count', { ascending: false }).order('created_at', { ascending: false })
        : query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);
    if (error) {
      console.error('[GET /api/pdfs] query error:', error);
      throw error;
    }

    const rows = (data ?? []) as any[];
    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json(
      {
        items: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          subject: row.subject,
          examTag: row.exam_tag,
          tags: row.tags ?? [],
          fileSize: row.file_bytes ?? row.file_size ?? 0,
          downloadCount: row.download_count ?? 0,
          createdAt: row.created_at,
          requiresAuth: true
        })),
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
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/pdfs');
  }
}

