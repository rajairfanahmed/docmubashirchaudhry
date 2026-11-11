import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Inbox } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { VerificationBadge } from '@/components/ui/Badge';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { ProvenanceBox } from '@/components/ui/ProvenanceBox';
import { PdfResourceCard } from '@/components/library/PdfResourceCard';
import { CorrectionTrigger } from '@/components/feedback/CorrectionTrigger';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildLearningResourceSchema } from '@/lib/seo/structured-data';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const posts = await repo.getRecruitmentPosts('ppsc');
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const repo = getContentRepository();
  const postEntity = await repo.getRecruitmentPost(slug);

  if (!postEntity) {
    return buildPageMetadata({
      title: 'Post Not Found | PPSC Preparation',
      description: 'Requested PPSC recruitment post guide was not found.',
      path: `/ppsc/${slug}`,
      index: false
    });
  }

  const verificationSummary =
    postEntity.verification.status === 'verified'
      ? 'primary official verification checked'
      : `commission recruitment details currently labeled ${postEntity.verification.status} pending direct official gazette PDF`;

  const displayTitle = postEntity.title.includes(postEntity.basicScale)
    ? postEntity.title
    : `${postEntity.title} (${postEntity.basicScale})`;

  return buildPageMetadata({
    title: `${displayTitle} Solved PDF Compilations`,
    description: `Downloadable solved MCQ PDF booklets and ${verificationSummary} for PPSC ${postEntity.title}.`,
    path: `/ppsc/${postEntity.slug}`
  });
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getContentRepository();

  const [postEntity, pdfs, topics, subjects] = await Promise.all([
    repo.getRecruitmentPost(slug),
    repo.getPdfResources({ includeDrafts: false }),
    repo.getTopics(),
    repo.getSubjects()
  ]);

  if (!postEntity) {
    notFound();
  }

  const sources = await repo.getSources(postEntity.verification.sourceIds);
  const bookletsToRender = pdfs.filter((pdf) => postEntity.pdfResourceIds.includes(pdf.id));
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return (
    <>
      <JsonLd
        data={buildLearningResourceSchema({
          title: `PPSC ${postEntity.title} Solved PDF Compilations`,
          description: postEntity.syllabusSummary,
          path: `/ppsc/${postEntity.slug}`,
          educationalLevel: `PPSC ${postEntity.basicScale}`,
          learningResourceType: 'Downloadable Solved MCQ Booklets',
          dateModified: postEntity.verification.lastCheckedAt,
          about: ['PPSC Recruitment', postEntity.title, postEntity.department],
          sources
        })}
      />

      {/* Band 1: Breadcrumbs, Post Header & Source Provenance */}
      <SectionBand surface="ground" density="compact" labelledBy="post-detail-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: 'PPSC', href: '/ppsc' },
              { label: postEntity.title }
            ]}
            currentPath={`/ppsc/${postEntity.slug}`}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[var(--dmc-border-subtle)]">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
              <CommissionBrandBadge examCodeOrSlug="ppsc" size="lg" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--dmc-ink-muted)] break-words">
                  {postEntity.department}
                  {postEntity.advertisementNo ? ` - Advertisement ${postEntity.advertisementNo}` : ''}
                </div>
                <h1 id="post-detail-heading" className="type-page-title text-[var(--dmc-ink-primary)] mt-0.5 break-words">
                  {postEntity.title} ({postEntity.basicScale})
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <VerificationBadge status={postEntity.postStatus} />
              <VerificationBadge status={postEntity.verification.status} />
            </div>
          </div>

          <ProvenanceBox
            officialUrl="https://www.ppsc.gop.pk/"
            officialLabel="Official Portal: ppsc.gop.pk"
            verification={postEntity.verification}
            sources={sources}
            title={`Source Provenance (${postEntity.basicScale})`}
            summary={postEntity.syllabusSummary}
          />
        </div>
      </SectionBand>

      {/* Band 2: Linked Downloadable Solved PDF Booklets Only */}
      <SectionBand surface="muted" density="standard" labelledBy="downloads-section-title">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="pill-badge bg-amber-50 text-amber-900 border border-amber-200 mb-2">
                DOWNLOADABLE SOLVED PDFS
              </span>
              <h2 id="downloads-section-title" className="type-section-heading text-[var(--dmc-ink-primary)]">
                Free Solved MCQ Booklets
              </h2>
              <p className="type-body-sm text-[var(--dmc-ink-secondary)] mt-1">
                SHA-256 checksummed PDF booklets linked directly to {postEntity.title}, distributed with zero login.
              </p>
            </div>
            <Link
              href="/library/ppsc"
              className="min-h-[44px] sm:min-h-0 text-xs font-bold text-[var(--dmc-brand-forest)] hover:underline inline-flex items-center gap-1"
            >
              <span>Open PPSC Library</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {bookletsToRender.length === 0 ? (
            <EmptyStateCard
              icon={Inbox}
              title={`No Linked PDFs Available Yet for ${postEntity.title}`}
              description="No verified downloadable PDF booklets have been attached to this recruitment post yet."
              primaryAction={{ label: 'Browse All PPSC PDFs', href: '/library/ppsc' }}
              secondaryAction={{ label: 'Return to PPSC Hub', href: '/ppsc' }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {bookletsToRender.map((pdf) => {
                const firstTopic = topicMap.get(pdf.topicIds[0] ?? '');
                const firstSubject = firstTopic ? subjectMap.get(firstTopic.subjectId) : undefined;
                return (
                  <PdfResourceCard
                    key={pdf.id}
                    pdf={pdf}
                    subjectLabel={firstSubject?.name}
                  />
                );
              })}
            </div>
          )}

          <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 elevation-1">
            <div className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)]">
              Spotted an error or broken download link for{' '}
              <strong className="text-[var(--dmc-ink-primary)]">{postEntity.title}</strong>?
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <CorrectionTrigger
                referenceTitle={`${postEntity.title} (${postEntity.basicScale})`}
                category="syllabus"
                label="Report a correction"
              />
            </div>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
