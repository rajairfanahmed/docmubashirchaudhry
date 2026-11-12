import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { PdfAccessLogRow, PdfResourceRow, ProfileRow } from '@/lib/supabase/database.types';
import { aggregatePdfAnalytics } from '@/lib/v3/analytics';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();

    const [pdfsRes, logsRes, profilesRes] = await Promise.all([
      admin
        .from('pdf_resources')
        .select('id, slug, title, subject, exam_tag, file_size, download_count, is_published')
        .order('download_count', { ascending: false })
        .limit(1000),
      admin
        .from('pdf_access_log')
        .select('user_id, pdf_id, downloaded_at')
        .order('downloaded_at', { ascending: false })
        .limit(10000),
      admin.from('profiles').select('id, email, display_name').limit(5000)
    ]);

    if (pdfsRes.error) throw pdfsRes.error;
    if (logsRes.error) throw logsRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const aggregated = aggregatePdfAnalytics({
      pdfs: (pdfsRes.data ?? []) as Array<
        Pick<
          PdfResourceRow,
          | 'id'
          | 'slug'
          | 'title'
          | 'subject'
          | 'exam_tag'
          | 'file_size'
          | 'download_count'
          | 'is_published'
        >
      >,
      logs: (logsRes.data ?? []) as Array<
        Pick<PdfAccessLogRow, 'user_id' | 'pdf_id' | 'downloaded_at'>
      >,
      profiles: (profilesRes.data ?? []) as Array<
        Pick<ProfileRow, 'id' | 'email' | 'display_name'>
      >
    });

    return auth.applyAuthCookies(
      NextResponse.json(aggregated, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/analytics/pdfs');
  }
}

