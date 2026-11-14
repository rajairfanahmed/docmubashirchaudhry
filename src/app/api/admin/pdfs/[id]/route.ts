import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { deletePdfObject } from '@/lib/r2/client';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, isUuid, parseJsonWithSchema } from '@/lib/v3/http';
import { UpdatePdfResourceSchema } from '@/lib/v3/schemas';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const { id } = await context.params;
    if (!isUuid(id)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_PDF_ID',
        message: 'PDF id must be a valid UUID.'
      });
    }

    const parsed = await parseJsonWithSchema(request, UpdatePdfResourceSchema);
    if ('response' in parsed) return parsed.response;

    const patch: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.description !== undefined) patch.description = parsed.data.description;
    if (parsed.data.subject !== undefined) patch.subject = parsed.data.subject;
    if (parsed.data.examTag !== undefined) patch.exam_tag = parsed.data.examTag;
    if (parsed.data.isPublished !== undefined) patch.is_published = parsed.data.isPublished;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('pdf_resources')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle<PdfResourceRow>();

    if (error) throw error;
    if (!data) {
      return apiErrorResponse({
        status: 404,
        code: 'PDF_NOT_FOUND',
        message: 'PDF resource not found.'
      });
    }

    const item = {
      ...data,
      file_size: (data as any).file_bytes ?? (data as any).file_size ?? 0,
      tags: (data as any).tags ?? []
    };

    return auth.applyAuthCookies(
      NextResponse.json(
        { item },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/admin/pdfs/[id]');
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const { id } = await context.params;
    if (!isUuid(id)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_PDF_ID',
        message: 'PDF id must be a valid UUID.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data: existing, error: fetchError } = await admin
      .from('pdf_resources')
      .select('id, file_key')
      .eq('id', id)
      .maybeSingle<Pick<PdfResourceRow, 'id' | 'file_key'>>();

    if (fetchError) throw fetchError;
    if (!existing) {
      return apiErrorResponse({
        status: 404,
        code: 'PDF_NOT_FOUND',
        message: 'PDF resource not found.'
      });
    }

    const { error: deleteDbError } = await admin
      .from('pdf_resources')
      .delete()
      .eq('id', id);
    if (deleteDbError) throw deleteDbError;

    await deletePdfObject({ fileKey: existing.file_key });

    return auth.applyAuthCookies(
      NextResponse.json(
        { deleted: true, id: existing.id },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/pdfs/[id]');
  }
}

