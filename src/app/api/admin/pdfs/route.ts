import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { headPdfObject } from '@/lib/r2/client';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema, validationErrorResponse } from '@/lib/v3/http';
import { CreatePdfResourceSchema, PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsedQuery = PaginationParamsSchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined
  });
  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize } = parsedQuery.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await admin
      .from('pdf_resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as PdfResourceRow[];
    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          items: rows,
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
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/pdfs');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, CreatePdfResourceSchema);
    if ('response' in parsed) return parsed.response;

    const objectMeta = await headPdfObject({ fileKey: parsed.data.fileKey });
    if (!objectMeta.exists) {
      return apiErrorResponse({
        status: 400,
        code: 'R2_OBJECT_NOT_FOUND',
        message: 'Uploaded PDF was not found in the private R2 bucket. Upload the file before saving metadata.'
      });
    }
    if (
      objectMeta.contentType &&
      !objectMeta.contentType.toLowerCase().includes('application/pdf')
    ) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_FILE_TYPE',
        message: 'Uploaded object Content-Type must be application/pdf.'
      });
    }

    const admin = createSupabaseAdminClient();
    const verifiedSize =
      objectMeta.contentLength && objectMeta.contentLength > 0
        ? objectMeta.contentLength
        : parsed.data.fileSize;

    const { data, error } = await admin
      .from('pdf_resources')
      .insert({
        slug: parsed.data.slug,
        title: parsed.data.title,
        description: parsed.data.description,
        subject: parsed.data.subject,
        exam_tag: parsed.data.examTag,
        tags: parsed.data.tags,
        file_key: parsed.data.fileKey,
        file_size: verifiedSize,
        sha256: parsed.data.sha256 ?? null,
        watermark_confirmed: parsed.data.watermarkConfirmed,
        is_published: parsed.data.isPublished,
        uploaded_by: auth.user.id
      })
      .select('*')
      .single<PdfResourceRow>();

    if (error) throw error;

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: data },
        {
          status: 201,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/pdfs');
  }
}
