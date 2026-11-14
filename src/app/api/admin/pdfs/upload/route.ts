import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { requireR2Config } from '@/lib/env';
import { uploadPdfObjectDirect } from '@/lib/r2/client';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'A valid PDF file is required.' } },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Only application/pdf files are permitted.' } },
        { status: 400 }
      );
    }

    const title = String(formData.get('title') || '').trim();
    const slug = String(formData.get('slug') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const examTag = String(formData.get('examTag') || '').trim();
    const sha256 = String(formData.get('sha256') || '').trim();
    const isPublished = formData.get('isPublished') === 'true';
    const tagsCsv = String(formData.get('tags') || '');
    const tags = tagsCsv
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!title || !slug || !subject || !examTag || !sha256) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title, slug, subject, examTag, and sha256 are required fields.'
          }
        },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload directly to Cloudflare R2
    let fileKey: string;
    try {
      const uploadResult = await uploadPdfObjectDirect({
        filename: file.name,
        body: fileBuffer
      });
      fileKey = uploadResult.fileKey;
    } catch (r2Error: any) {
      const httpStatus = r2Error?.$metadata?.httpStatusCode;
      if (httpStatus === 401 || r2Error?.name === 'Unauthorized') {
        return NextResponse.json(
          {
            error: {
              code: 'R2_UNAUTHORIZED',
              message:
                'Cloudflare R2 storage credentials are unauthorized (HTTP 401). Please check CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_ACCOUNT_ID.'
            }
          },
          { status: 401 }
        );
      }
      throw r2Error;
    }

    // Register PDF metadata in Supabase
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('pdf_resources')
      .insert({
        slug,
        title,
        description,
        subject,
        exam_tag: examTag,
        tags,
        file_key: fileKey,
        file_size: fileBuffer.length,
        sha256,
        watermark_confirmed: true,
        is_published: isPublished
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            error: {
              code: 'DUPLICATE_SLUG',
              message: `A PDF with the slug "${slug}" already exists.`
            }
          },
          { status: 409 }
        );
      }
      throw error;
    }

    // Record audit log
    await admin.from('activity_audit_logs').insert({
      actor_id: auth.user.id,
      actor_email: auth.email,
      action: 'pdf.upload_direct',
      entity_type: 'pdf_resource',
      entity_id: (data as PdfResourceRow).id,
      metadata: { slug, title, fileKey, fileSize: fileBuffer.length }
    });

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: data as PdfResourceRow },
        { status: 201, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/pdfs/upload');
  }
}
