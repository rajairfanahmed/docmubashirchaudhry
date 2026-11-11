import React from 'react';
import type { Metadata } from 'next';
import { Info } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { ProvenanceBox } from '@/components/ui/ProvenanceBox';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const repo = getContentRepository();
  const [fpscExam, pdfs, questions] = await Promise.all([
    repo.getExam('fpsc'),
    repo.getPdfResources({ examSlug: 'fpsc', includeDrafts: false }),
    repo.getQuestions({ examId: 'exam-fpsc', includeDrafts: false })
  ]);

  const isPopulated = fpscExam?.status === 'published' || pdfs.length > 0 || questions.length > 0;

  return buildPageMetadata({
    title: 'FPSC Preparation Hub | Federal Public Service Commission',
    description:
      'Federal Public Service Commission (FPSC) official portal status and shared one-paper MCQ preparation resources.',
    path: '/fpsc',
    index: isPopulated
  });
}

export default async function FpscHubPage() {
  const repo = getContentRepository();
  const [fpscExam, pdfs, questions] = await Promise.all([
    repo.getExam('fpsc'),
    repo.getPdfResources({ examSlug: 'fpsc', includeDrafts: false }),
    repo.getQuestions({ examId: 'exam-fpsc', includeDrafts: false })
  ]);
  const sources = fpscExam ? await repo.getSources(fpscExam.verification.sourceIds) : [];

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="fpsc-hub-heading">
        <div className="space-y-5">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: 'FPSC' }
            ]}
            currentPath="/fpsc"
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-amber-50 text-amber-900 border border-amber-200">
                FEDERAL RECRUITMENT &middot; {fpscExam?.status === 'draft' ? 'COMING SOON' : 'ACTIVE'}
              </span>
              <div className="flex items-center gap-3.5">
                <CommissionBrandBadge examCodeOrSlug="fpsc" size="lg" />
                <h1 id="fpsc-hub-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                  {fpscExam?.title ?? 'Federal Public Service Commission (FPSC)'}
                </h1>
              </div>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                {fpscExam?.summary ?? 'Federal general recruitment hub and official commission citations.'}
              </p>
            </div>

            {fpscExam && (
              <div className="lg:max-w-sm w-full">
                <ProvenanceBox
                  title="Official Commission Source"
                  officialUrl={fpscExam.officialPortalUrl ?? 'https://www.fpsc.gov.pk/'}
                  officialLabel="fpsc.gov.pk"
                  verification={fpscExam.verification}
                  sources={sources}
                />
              </div>
            )}
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="fpsc-status-heading">
        <div className="space-y-6">
          <h2 id="fpsc-status-heading" className="sr-only">
            FPSC Content Status
          </h2>
          <EmptyStateCard
            icon={Info}
            title={`FPSC Dedicated Content Status (${questions.length} FPSC MCQs · ${pdfs.length} FPSC PDFs)`}
            description="No FPSC-specific recruitment posts or downloadable booklets are published yet. You can practice published World Geography drills and browse our verified PDF Library right now."
            primaryAction={{ label: 'Open MCQ Subject Selector', href: '/mcq' }}
            secondaryAction={{ label: 'Open Full PDF Library', href: '/library' }}
          />
        </div>
      </SectionBand>
    </>
  );
}
