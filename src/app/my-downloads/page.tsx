import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DownloadsHistoryClient } from '@/components/account/DownloadsHistoryClient';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'My PDF Downloads',
  description: 'Personal student log of watermarked PDF booklets you have accessed.',
  path: '/my-downloads',
  index: false,
  follow: false
});

export default function MyDownloadsPage() {
  return (
    <div className="flex flex-col">
      <SectionBand
        surface="hero"
        density="compact"
        className="py-8"
      >
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: 'My PDF Downloads' }]} currentPath="/my-downloads" />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
                Private Access Log
              </span>
              <h1 id="my-downloads-heading" className="type-page-title text-[var(--color-ink)]">
                My PDF Downloads
              </h1>
              <p className="type-supporting text-[var(--color-ink-secondary)] max-w-2xl">
                Keep track of solved watermarked PDFs you downloaded through temporary signed
                links. Fresh expiring download links can always be requested from the PDF Library.
              </p>
            </div>

            <Link
              href="/library"
              className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold shrink-0"
            >
              <span>Browse PDF Library</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="ground" className="py-8 sm:py-10">
        <DownloadsHistoryClient />
      </SectionBand>
    </div>
  );
}
