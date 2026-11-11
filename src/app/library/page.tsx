import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { PdfFilterToolbar } from '@/components/library/PdfFilterToolbar';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Open PDF Library | Solved MCQ Booklets & Study Guides',
  description:
    'Free, zero-login educational PDF booklets with verified metadata, page counts, file sizes, SHA-256 checksums, and direct downloads.',
  path: '/library'
});

const EXAM_FILTERS = [
  { slug: 'all', label: 'All Exams', href: '/library' },
  { slug: 'ppsc', label: 'PPSC', href: '/library/ppsc' },
  { slug: 'fpsc', label: 'FPSC', href: '/library/fpsc' },
  { slug: 'css-pms', label: 'CSS / PMS', href: '/library/css-pms' },
  { slug: 'nts', label: 'NTS', href: '/library/nts' }
];

export default async function PdfLibraryPage() {
  const repo = getContentRepository();
  const [pdfs, exams, subjects, topics] = await Promise.all([
    repo.getPdfResources({ includeDrafts: false }),
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics()
  ]);

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="library-heading">
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Library' }]} currentPath="/library" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-amber-50 text-amber-900 border border-amber-200">
                <FileText className="w-3 h-3 mr-1" aria-hidden="true" />
                OPEN-ACCESS STUDY REPOSITORY
              </span>
              <h1 id="library-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                PDF Study Booklets Library
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                Download solved MCQ compilations and verified study guides directly. Free, no ads, and no login required.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {EXAM_FILTERS.map((ef) => (
                <Link
                  key={ef.slug}
                  href={ef.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    ef.slug === 'all'
                      ? 'bg-[var(--dmc-brand-forest)] text-white border-[var(--dmc-brand-forest)]'
                      : 'bg-[var(--dmc-surface-card)] text-[var(--dmc-ink-primary)] border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)]'
                  }`}
                >
                  {ef.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="library-grid-heading">
        <div id="library-filter-slot" className="space-y-5">
          <h2 id="library-grid-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
            Available PDF Resources
          </h2>
          <PdfFilterToolbar
            resources={pdfs}
            exams={exams}
            subjects={subjects}
            topics={topics}
          />
        </div>
      </SectionBand>
    </>
  );
}
