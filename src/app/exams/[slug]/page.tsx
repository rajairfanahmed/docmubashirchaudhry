import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { formatBytes, formatVerificationDate } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageSchema } from '@/lib/seo/structured-data';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const exams = await repo.getExams();
  return exams.map((exam) => ({ slug: exam.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const repo = getContentRepository();
  const exam = await repo.getExam(slug);

  if (!exam) {
    return buildPageMetadata({
      title: 'Exam Not Found',
      description: 'Requested exam commission hub was not found.',
      path: `/exams/${slug}`,
      index: false
    });
  }

  return buildPageMetadata({
    title: `${exam.bodyCode}: ${exam.title} Resources`,
    description: exam.summary,
    path: `/exams/${exam.slug}`,
    index: exam.status === 'published'
  });
}

export default async function ExamDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getContentRepository();
  const exam = await repo.getExam(slug);

  if (!exam) {
    notFound();
  }

  const [posts, questions, pdfs] = await Promise.all([
    repo.getRecruitmentPosts(exam.slug),
    repo.getQuestions({ examId: exam.id, includeDrafts: false }),
    repo.getPdfResources({ examSlug: exam.slug, includeDrafts: false })
  ]);

  const schemaItems = [
    ...posts.map((post) => ({
      name: post.title,
      path: `/${exam.slug}/${post.slug}`
    })),
    ...pdfs.map((pdf) => ({
      name: pdf.title,
      path: `/library/resource/${pdf.slug}`
    }))
  ];

  return (
    <>
      {exam.status === 'published' && schemaItems.length > 0 && (
        <JsonLd
          data={buildCollectionPageSchema({
            title: `${exam.title} Recruitment Posts & Solved PDFs`,
            description: exam.summary,
            path: `/exams/${exam.slug}`,
            items: schemaItems
          })}
        />
      )}
      <SectionBand surface="ground" density="compact" labelledBy="exam-detail-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: exam.bodyCode }
            ]}
            currentPath={`/exams/${exam.slug}`}
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
                {exam.bodyCode} &middot; {exam.jurisdiction}
              </span>
              <div className="flex items-center gap-3.5">
                <CommissionBrandBadge examCodeOrSlug={exam.slug} size="lg" />
                <h1 id="exam-detail-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                  {exam.title}
                </h1>
              </div>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">{exam.summary}</p>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:min-w-[270px] space-y-2 elevation-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)]">
                  Verification Status
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full ${
                    exam.verification.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {exam.verification.status}
                </span>
              </div>
              <a
                href={exam.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>{exam.officialPortalUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <div className="text-[11px] text-[var(--dmc-ink-muted)]">
                Last verified: {formatVerificationDate(exam.verification.lastCheckedAt)}
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="exam-tracks-heading">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 id="exam-tracks-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
              Recruitment Tracks &amp; Cadres ({posts.length})
            </h2>
            <Link
              href={`/${exam.slug}`}
              className="text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline inline-flex items-center gap-1"
            >
              <span>Open Dedicated {exam.bodyCode} Hub</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 text-center space-y-2">
              <p className="font-bold text-[var(--dmc-ink-primary)]">No Exam-Specific Posts Published Yet</p>
              <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                We have not added {exam.bodyCode}-specific recruitment posts yet. You can practice general screening MCQs or explore PPSC study tracks below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-[var(--dmc-ink-muted)]">{post.department}</div>
                      <h3 className="type-card-title text-[var(--dmc-ink-primary)] mt-0.5">{post.title}</h3>
                    </div>
                    <span className="text-xs font-bold bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {post.basicScale}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">{post.syllabusSummary}</p>
                  <Link
                    href={`/${exam.slug}/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                  >
                    <span>Open Solved PDFs</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
                <BookOpen className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
                <span>Linked MCQ Practice ({questions.length} available)</span>
              </div>
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Test verified single-best-answer questions matching {exam.bodyCode} screening topics with immediate explanations.
              </p>
              <Link
                href="/mcq"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <span>Launch MCQ Filter &amp; Practice</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
                <FileText className="w-4 h-4 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
                <span>Linked PDF Booklets ({pdfs.length} available)</span>
              </div>
              {pdfs.length === 0 ? (
                <p className="text-xs text-[var(--dmc-ink-secondary)]">
                  No PDFs published specifically under {exam.bodyCode} yet. Browse the full open-access PDF library for shared subject compilations.
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {pdfs.slice(0, 3).map((pdf) => (
                    <li key={pdf.id} className="flex items-center justify-between gap-2">
                      <Link href={`/library/resource/${pdf.slug}`} className="font-semibold text-[var(--dmc-ink-primary)] hover:underline">
                        {pdf.title}
                      </Link>
                      <span className="text-[var(--dmc-ink-muted)] tabular-nums shrink-0">
                        {formatBytes(pdf.fileSizeBytes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/library/${exam.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <span>Open {exam.bodyCode} Library Scope</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
