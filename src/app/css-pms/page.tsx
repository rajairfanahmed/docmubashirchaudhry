import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, ExternalLink, Info } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const repo = getContentRepository();
  const pdfs = await repo.getPdfResources({ includeDrafts: false });
  const cssPdfs = pdfs.filter((pdf) => pdf.slug.includes('css') || pdf.slug.includes('pms'));

  return buildPageMetadata({
    title: 'CSS & PMS Preparation Hub | Federal & Provincial Screening',
    description:
      'CSS and PMS hub status with links to published World Geography drills, shared screening MCQs, and downloadable PDF booklets.',
    path: '/css-pms',
    index: cssPdfs.length > 0
  });
}

export default async function CssPmsHubPage() {
  const repo = getContentRepository();
  const [subjects, questions, pdfs] = await Promise.all([
    repo.getSubjects(),
    repo.getQuestions({ includeDrafts: false }),
    repo.getPdfResources({ includeDrafts: false })
  ]);

  const cssPdfs = pdfs.filter((pdf) => pdf.slug.includes('css') || pdf.slug.includes('pms'));

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="css-pms-heading">
        <div className="space-y-5">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: 'CSS & PMS' }
            ]}
            currentPath="/css-pms"
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-slate-100 text-slate-800 border border-slate-300">
                FEDERAL &amp; PROVINCIAL CIVIL SERVICES
              </span>
              <div className="flex items-center gap-3.5">
                <CommissionBrandBadge examCodeOrSlug="css-pms" size="lg" />
                <h1 id="css-pms-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                  CSS &amp; PMS Examination Hub
                </h1>
              </div>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                Hub status for FPSC CSS (Central Superior Services) and provincial PMS preparation with links to live shared modules.
              </p>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 space-y-1.5 elevation-1 text-xs">
              <div className="font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)]">
                Official Exam Authorities
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.fpsc.gov.pk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                >
                  <span>fpsc.gov.pk (CSS)</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                <a
                  href="https://www.ppsc.gop.pk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                >
                  <span>ppsc.gop.pk (PMS)</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="css-status-heading">
        <div className="space-y-6">
          <h2 id="css-status-heading" className="sr-only">
            CSS &amp; PMS Resource Status
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
                <BookOpen className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
                <span>Shared Subject Taxonomy ({subjects.length} Subjects · {questions.length} MCQs)</span>
              </div>
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Practice published objective screening MCQs or test sovereign capitals, currencies, and languages inside World Geography.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/mcq"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                >
                  <span>Browse MCQ Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/geography"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                >
                  <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>World Geography Workbench</span>
                </Link>
              </div>
            </div>

            <EmptyStateCard
              icon={Info}
              title={`CSS & PMS PDFs Status (${cssPdfs.length} Dedicated Booklets)`}
              description="No dedicated CSS or PMS PDF booklets are published yet. Browse published booklets in our open PDF library."
              primaryAction={{ label: 'Browse Shared PDF Library', href: '/library' }}
            />
          </div>
        </div>
      </SectionBand>
    </>
  );
}
