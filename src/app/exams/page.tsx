import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, FileText, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { ExamHubCard } from '@/components/exams/ExamHubCard';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pakistani Competitive Exams Hub | PPSC & Commission Directory',
  description:
    'Browse verified syllabus references, recruitment post records, and downloadable solved MCQ booklets across tracked examination commissions.',
  path: '/exams'
});

export default async function ExamsHubPage() {
  const repo = getContentRepository();
  const [exams, ppscPosts, pdfs] = await Promise.all([
    repo.getExams(),
    repo.getRecruitmentPosts('ppsc'),
    repo.getPdfResources({ includeDrafts: false })
  ]);

  const examPostLists = await Promise.all(
    exams.map((exam) => repo.getRecruitmentPosts(exam.slug))
  );
  const examPdfLists = await Promise.all(
    exams.map((exam) => repo.getPdfResources({ examSlug: exam.slug, includeDrafts: false }))
  );

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="exams-hub-heading">
        <div className="space-y-5">
          <Breadcrumbs items={[{ label: 'Exams' }]} currentPath="/exams" />

          <div className="space-y-2 max-w-3xl">
            <span className="pill-badge bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] border border-[var(--dmc-status-verified-border)]/40">
              INDEPENDENT EXAM PREPARATION DIRECTORY
            </span>
            <h1 id="exams-hub-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Competitive Examinations Directory
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Explore structured exam hubs with transparent source citations, recruitment records, and free downloadable study material.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="exam-hub-cards-title">
        <div className="space-y-8">
          <h2 id="exam-hub-cards-title" className="type-section-heading text-[var(--dmc-ink-primary)]">
            Commission Hubs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam, index) => (
              <ExamHubCard
                key={exam.id}
                exam={exam}
                postCount={examPostLists[index]?.length ?? 0}
                pdfCount={examPdfLists[index]?.length ?? 0}
              />
            ))}
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="ground" density="compact" labelledBy="featured-cadre-title">
        <div className="bg-[var(--dmc-brand-forest)] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Featured Commission Resources</span>
            </div>
            <h2 id="featured-cadre-title" className="text-xl sm:text-2xl font-extrabold">
              PPSC Intelligence Officer (BS-14) Solved PDFs
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Access {ppscPosts.length} tracked PPSC recruitment post{ppscPosts.length === 1 ? '' : 's'} and {pdfs.length} SHA-256 verified downloadable MCQ booklet{pdfs.length === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/ppsc/intelligent-officer"
              className="inline-flex items-center gap-2 bg-[var(--dmc-accent-gold)] hover:bg-[var(--dmc-accent-gold-hover)] text-[var(--dmc-ink-primary)] font-bold text-sm px-5 py-3 rounded-[var(--dmc-radius-button)] transition-colors"
            >
              <span>Open Intelligence Officer</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-3 rounded-[var(--dmc-radius-button)] transition-colors border border-white/25"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>PDF Library</span>
            </Link>
            <a
              href="https://www.ppsc.gop.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-semibold px-3.5 py-3 rounded-[var(--dmc-radius-button)] transition-colors"
            >
              <span>ppsc.gop.pk</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
