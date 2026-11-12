import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createPresignedPdfUploadUrl } from '@/lib/r2/client';
import { handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { PdfUploadUrlRequestSchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, PdfUploadUrlRequestSchema);
    if ('response' in parsed) return parsed.response;

    const presigned = await createPresignedPdfUploadUrl({
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      fileSizeBytes: parsed.data.fileSizeBytes
    });

    return auth.applyAuthCookies(
      NextResponse.json(presigned, {
        status: 201,
        headers: { 'Cache-Control': 'no-store' }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/pdfs/upload-url');
  }
}

