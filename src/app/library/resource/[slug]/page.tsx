import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { PdfDetailPanel } from '@/components/library/PdfDetailPanel';
import { StickyMobileDownloadBar } from '@/components/library/StickyMobileDownloadBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { formatBytes } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildPdfDigitalDocumentSchema } from '@/lib/seo/structured-data';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const pdfs = await repo.getPdfResources({ includeDrafts: true });
  return pdfs.map((pdf) => ({ slug: pdf.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const repo = getContentRepository();
  const pdf = await repo.getPdfResource(slug);

  if (!pdf) {
    return buildPageMetadata({
      title: 'PDF Resource Not Found',
      description: 'Requested PDF study booklet was not found.',
      path: `/library/resource/${slug}`,
      index: false
    });
  }

  const sizeLabel = formatBytes(pdf.fileSizeBytes);
  return buildPageMetadata({
    title: `${pdf.title} (${sizeLabel}) Free PDF Download`,
    description: pdf.summary,
    path: `/library/resource/${pdf.slug}`,
    index: pdf.status !== 'draft',
    type: 'article'
  });
}

export default async function PdfResourceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getContentRepository();
  const pdf = await repo.getPdfResource(slug);

  if (!pdf) {
    notFound();
  }

  const [relatedItems, sources] = await Promise.all([
    repo.getRelated({ type: 'pdf', id: pdf.id }),
    repo.getSources(pdf.verification.sourceIds)
  ]);

  return (
    <>
      <JsonLd
        data={buildPdfDigitalDocumentSchema({
          pdf,
          formatBytesLabel: formatBytes(pdf.fileSizeBytes),
          sources
        })}
      />
      <SectionBand surface="ground" density="compact" labelledBy="resource-detail-heading">
        <Breadcrumbs
          items={[
            { label: 'Library', href: '/library' },
            { label: pdf.title }
          ]}
          currentPath={`/library/resource/${pdf.slug}`}
        />
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="resource-detail-heading">
        <div className="pb-24 md:pb-12">
          <PdfDetailPanel pdf={pdf} sources={sources} relatedItems={relatedItems} />
        </div>
      </SectionBand>

      <StickyMobileDownloadBar
        title={pdf.title}
        filePath={pdf.filePath}
        fileSizeBytes={pdf.fileSizeBytes}
        pageCount={pdf.pageCount}
      />
    </>
  );
}
