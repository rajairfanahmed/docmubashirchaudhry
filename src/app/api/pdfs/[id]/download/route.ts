import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { createPresignedPdfDownloadUrl } from '@/lib/r2/client';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, isUuid } from '@/lib/v3/http';
import { checkRateLimit, extractClientIp, rateLimitExceededResponse } from '@/lib/v3/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ syncProfile: true });
    const rate = checkRateLimit({
      key: `pdf:download:${auth.user.id}:${extractClientIp(request)}`,
      limit: 30,
      windowMs: 15 * 60 * 1000
    });
    if (!rate.allowed) {
      return rateLimitExceededResponse(rate);
    }

    const { id } = await context.params;
    const rawIdOrSlug = decodeURIComponent(id).trim();
    if (!rawIdOrSlug) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_PDF_ID',
        message: 'PDF identifier is required.'
      });
    }

    const admin = createSupabaseAdminClient();
    const lookupColumn = isUuid(rawIdOrSlug) ? 'id' : 'slug';
    const { data: pdf, error: pdfError } = await admin
      .from('pdf_resources')
      .select('id, slug, title, file_key, file_bytes, is_published')
      .eq(lookupColumn, rawIdOrSlug)
      .maybeSingle<
        Pick<PdfResourceRow, 'id' | 'slug' | 'title' | 'file_key' | 'is_published'> & {
          file_bytes?: number;
          file_size?: number;
        }
      >();

    if (pdfError) throw pdfError;

    if (!pdf || (!pdf.is_published && !auth.isAdmin)) {
      return apiErrorResponse({
        status: 404,
        code: 'PDF_NOT_FOUND',
        message: 'Requested PDF booklet was not found.'
      });
    }

    const signed = await createPresignedPdfDownloadUrl({
      fileKey: pdf.file_key,
      downloadName: pdf.title || pdf.slug
    });

    const { error: logError } = await admin.from('pdf_access_log').insert({
      user_id: auth.user.id,
      pdf_id: pdf.id
    });
    if (logError) throw logError;

    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'json') {
      return auth.applyAuthCookies(
        NextResponse.json(
          {
            pdfId: pdf.id,
            title: pdf.title,
            fileSize: pdf.file_bytes ?? pdf.file_size ?? 0,
            downloadUrl: signed.downloadUrl,
            expiresInSeconds: signed.expiresInSeconds,
            expiresAt: signed.expiresAt
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'private, no-store'
            }
          }
        )
      );
    }

    return auth.applyAuthCookies(
      NextResponse.redirect(signed.downloadUrl, {
        status: 302,
        headers: {
          'Cache-Control': 'private, no-store'
        }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/pdfs/[id]/download');
  }
}

