import React from 'react';
import type { Metadata } from 'next';
import { ExternalLink, Info } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const repo = getContentRepository();
  const pdfs = await repo.getPdfResources({ includeDrafts: false });
  const ntsPdfs = pdfs.filter((pdf) => pdf.slug.includes('nts'));

  return buildPageMetadata({
    title: 'NTS Examination Preparation Hub',
    description:
      'National Testing Service (NTS) portal status and cross-links to published MCQ and World Geography practice modules.',
    path: '/nts',
    index: ntsPdfs.length > 0
  });
}

export default async function NtsHubPage() {
  const repo = getContentRepository();
  const [pdfs, questions] = await Promise.all([
    repo.getPdfResources({ includeDrafts: false }),
    repo.getQuestions({ includeDrafts: false })
  ]);

  const ntsPdfs = pdfs.filter((pdf) => pdf.slug.includes('nts'));

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="nts-hub-heading">
        <div className="space-y-5">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: 'NTS' }
            ]}
            currentPath="/nts"
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-slate-100 text-slate-800 border border-slate-300">
                APTITUDE &amp; SCREENING TESTS
              </span>
              <div className="flex items-center gap-3.5">
                <CommissionBrandBadge examCodeOrSlug="nts" size="lg" />
                <h1 id="nts-hub-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                  National Testing Service (NTS) Hub
                </h1>
              </div>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                Independent educational hub for NTS screening resources with direct access to shared objective practice modules.
              </p>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:min-w-[240px] space-y-1.5 elevation-1 text-xs">
              <div className="font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)]">
                Official Testing Body
              </div>
              <a
                href="https://www.nts.org.pk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <span>nts.org.pk</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <div className="text-[11px] text-[var(--dmc-ink-muted)]">
                Independent Educational Reference
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="nts-status-heading">
        <div className="space-y-6">
          <h2 id="nts-status-heading" className="sr-only">
            NTS Content Status
          </h2>
          <EmptyStateCard
            icon={Info}
            title={`NTS Dedicated Content Status (${ntsPdfs.length} NTS PDFs)`}
            description={`No dedicated NTS booklets are published yet. All ${questions.length} verified General Knowledge MCQs and full World Geography profiles remain free to study.`}
            primaryAction={{ label: 'Open MCQ Subject Selector', href: '/mcq' }}
            secondaryAction={{ label: 'Browse PDF Library', href: '/library' }}
          />
        </div>
      </SectionBand>
    </>
  );
}
