import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { PdfFilterToolbar } from '@/components/library/PdfFilterToolbar';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageSchema } from '@/lib/seo/structured-data';

const SCOPED_EXAM_META: Record<string, { label: string; description: string }> = {
  ppsc: {
    label: 'PPSC Booklets',
    description: 'Download SHA-256 verified solved MCQ PDF booklets aligned to Punjab Public Service Commission syllabi.'
  },
  fpsc: {
    label: 'FPSC Booklets',
    description: 'Federal Public Service Commission general recruitment screening booklets and verified solved papers.'
  },
  'css-pms': {
    label: 'CSS & PMS Booklets',
    description: 'Central Superior Services (MPT / Compulsory) and Provincial Management Service downloadable study guides.'
  },
  nts: {
    label: 'NTS Booklets',
    description: 'National Testing Service (NAT / GAT General) quantitative, verbal, and screening MCQ compilations.'
  }
};

export async function generateStaticParams() {
  const repo = getContentRepository();
  const exams = await repo.getExams();
  const slugs = new Set([...Object.keys(SCOPED_EXAM_META), ...exams.map((e) => e.slug)]);
  return Array.from(slugs).map((exam) => ({ exam }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ exam: string }>;
}): Promise<Metadata> {
  const { exam } = await params;
  const repo = getContentRepository();
  const [meta, examRecord, pdfs] = [
    SCOPED_EXAM_META[exam],
    await repo.getExam(exam),
    await repo.getPdfResources({ examSlug: exam, includeDrafts: false })
  ];

  if (!meta && !examRecord) {
    return buildPageMetadata({
      title: 'Library Section Not Found',
      description: 'Requested exam PDF library section was not found.',
      path: `/library/${exam}`,
      index: false
    });
  }

  const label = meta?.label ?? `${examRecord?.bodyCode ?? exam.toUpperCase()} Booklets`;
  const description = meta?.description ?? examRecord?.summary ?? '';

  return buildPageMetadata({
    title: `${label} Free PDF Library`,
    description,
    path: `/library/${exam}`,
    index: pdfs.length > 0
  });
}

export default async function ScopedLibraryPage({
  params
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const repo = getContentRepository();
  const examRecord = await repo.getExam(exam);
  const meta = SCOPED_EXAM_META[exam];

  if (!meta && !examRecord) {
    notFound();
  }

  const label = meta?.label ?? `${examRecord?.bodyCode ?? exam.toUpperCase()} Booklets`;
  const description = meta?.description ?? examRecord?.summary ?? '';
  const [pdfs, exams, subjects, topics] = await Promise.all([
    repo.getPdfResources({ examSlug: exam, includeDrafts: false }),
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics()
  ]);

  return (
    <>
      {pdfs.length > 0 && (
        <JsonLd
          data={buildCollectionPageSchema({
            title: `${label} Free PDF Library`,
            description,
            path: `/library/${exam}`,
            items: pdfs.map((pdf) => ({
              name: pdf.title,
              path: `/library/resource/${pdf.slug}`
            }))
          })}
        />
      )}
      <SectionBand surface="ground" density="compact" labelledBy="scoped-lib-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Library', href: '/library' },
              { label }
            ]}
            currentPath={`/library/${exam}`}
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200 uppercase">
                EXAM SCOPED REPOSITORY
              </span>
              <h1 id="scoped-lib-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                {label}
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">{description}</p>
            </div>

            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 bg-white border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-primary)] text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All Exam PDFs</span>
            </Link>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="scoped-results-title">
        <div className="space-y-6">
          <h2 id="scoped-results-title" className="type-section-heading text-[var(--dmc-ink-primary)]">
            {pdfs.length} Published Resource{pdfs.length === 1 ? '' : 's'}
          </h2>

          {pdfs.length === 0 ? (
            <EmptyStateCard
              icon={FileText}
              title="No Exam-Specific PDFs Archived Here Yet"
              description={`Dedicated compilations for ${label} are still in curation. Browse shared General Knowledge and PPSC solved MCQ booklets in the full library.`}
              primaryAction={{ label: 'View Full PDF Library', href: '/library' }}
            />
          ) : (
            <PdfFilterToolbar
              resources={pdfs}
              exams={exams}
              subjects={subjects}
              topics={topics}
              scopedExamSlug={exam}
            />
          )}
        </div>
      </SectionBand>
    </>
  );
}
