import { NextResponse } from 'next/server';
import { getContentRepository } from '@/lib/data';
import { getServerManifest } from '@/lib/data/server-manifest';
import { getV3RuntimeReadiness } from '@/lib/env';
import { SITE_NAME, SITE_URL } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const manifest = getServerManifest();
  const repo = getContentRepository();
  const snapshot = repo.getSnapshot();

  return NextResponse.json(
    {
      status: 'ok',
      service: SITE_NAME,
      siteUrl: SITE_URL,
      datasetVersion: manifest.datasetVersion,
      generatedAt: manifest.generatedAt,
      counts: {
        countries: snapshot.countries.filter((c) => c.status === 'published').length,
        questions: snapshot.questions.filter((q) => q.status === 'published').length,
        pdfResources: snapshot.pdfResources.filter((p) => p.status === 'published').length,
        exams: snapshot.exams.length,
        recruitmentPosts: snapshot.recruitmentPosts.length
      },
      v3: getV3RuntimeReadiness(),
      runtime: {
        node: process.version,
        vercelEnv: process.env.VERCEL_ENV ?? 'local'
      }
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}

