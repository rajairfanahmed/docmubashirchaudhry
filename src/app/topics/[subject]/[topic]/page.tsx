import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, FileText, PlayCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { PdfResourceCard } from '@/components/library/PdfResourceCard';
import { McqQuestionsPreviewList } from '@/components/mcq/McqQuestionsPreviewList';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { getLiveDatabaseQuestions } from '@/lib/data/live-questions';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildLearningResourceSchema } from '@/lib/seo/structured-data';
import { SUBJECT_PASTEL_TOKENS } from '@/lib/tokens/visual-tokens';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const [subjects, topics] = await Promise.all([repo.getSubjects(), repo.getTopics()]);
  const subjMap = new Map(subjects.map((s) => [s.id, s.slug]));

  return topics
    .map((topic) => {
      const subjSlug = subjMap.get(topic.subjectId);
      return subjSlug ? { subject: subjSlug, topic: topic.slug } : null;
    })
    .filter((entry): entry is { subject: string; topic: string } => entry !== null);
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ subject: string; topic: string }>;
}): Promise<Metadata> {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const repo = getContentRepository();
  const resolved = await repo.getTopicBySlugs(subjectSlug, topicSlug);

  if (!resolved) {
    return buildPageMetadata({
      title: 'Topic Not Found',
      description: 'Requested subject topic page was not found.',
      path: `/topics/${subjectSlug}/${topicSlug}`,
      index: false
    });
  }

  const [questions, relatedPdfs] = await Promise.all([
    repo.getQuestions({ topicIds: [resolved.topic.id], includeDrafts: false }),
    repo.getPdfResources({ topicId: resolved.topic.id, includeDrafts: false })
  ]);

  return buildPageMetadata({
    title: `${resolved.topic.name} (${resolved.subject.name}) MCQs & Notes`,
    description: resolved.topic.description,
    path: `/topics/${resolved.subject.slug}/${resolved.topic.slug}`,
    index: questions.length > 0 || relatedPdfs.length > 0
  });
}

export default async function TopicLandingPage({
  params
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const repo = getContentRepository();
  const resolved = await repo.getTopicBySlugs(subjectSlug, topicSlug);

  if (!resolved) {
    notFound();
  }

  const { subject, topic } = resolved;
  const [staticQuestions, liveQuestions, relatedPdfs] = await Promise.all([
    repo.getQuestions({ topicIds: [topic.id], includeDrafts: false }),
    getLiveDatabaseQuestions([topic]),
    repo.getPdfResources({ topicId: topic.id, includeDrafts: false })
  ]);
  const questions = liveQuestions.length > 0 ? liveQuestions : staticQuestions;

  const token = SUBJECT_PASTEL_TOKENS[subject.id] ?? {
    bgVar: 'var(--dmc-subject-gk-bg)',
    inkVar: 'var(--dmc-subject-gk-ink)'
  };

  return (
    <>
      <JsonLd
        data={buildLearningResourceSchema({
          title: `${topic.name} (${subject.name}) Topic Guide`,
          description: topic.description,
          path: `/topics/${subject.slug}/${topic.slug}`,
          learningResourceType: 'Topic Practice & Study Booklets',
          about: [subject.name, topic.name]
        })}
      />
      <SectionBand surface="ground" density="compact" labelledBy="topic-landing-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'MCQs', href: '/mcq' },
              { label: subject.name, href: `/mcq?subject=${subject.slug}` },
              { label: topic.name }
            ]}
            currentPath={`/topics/${subject.slug}/${topic.slug}`}
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2.5 max-w-3xl">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: token.bgVar, color: token.inkVar }}
              >
                <SubjectIconChip subjectId={subject.id} label={subject.name} size="sm" inheritColor />
              </span>
              <h1 id="topic-landing-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                {topic.name}
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">{topic.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
              <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-xl px-4 py-2.5 text-xs font-bold tabular-nums elevation-1">
                {questions.length} Verified MCQ{questions.length === 1 ? '' : 's'}
              </div>
              <Link
                href={`/mcq/practice?subject=${subject.slug}&topic=${topic.slug}`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                <span>Start Topic Quiz</span>
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="topic-content-grid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <h2 id="topic-content-grid" className="sr-only">
            Topic Sample MCQs and Linked PDFs
          </h2>

          {/* Left 7 Cols: Paginated Verified Topic MCQs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="type-card-title text-[var(--dmc-ink-primary)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
                <span>Topic Practice Questions</span>
              </h3>
              {questions.length > 0 && (
                <Link
                  href={`/mcq/practice?subject=${subject.slug}&topic=${topic.slug}`}
                  className="inline-flex items-center min-h-[44px] sm:min-h-0 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                >
                  Practice All ({questions.length})
                </Link>
              )}
            </div>

            <McqQuestionsPreviewList
              questions={questions}
              subjects={[subject]}
              topics={[topic]}
              topicIds={[topic.id]}
              syncUrlPage
              practiceHrefBase={`/mcq/practice?subject=${subject.slug}&topic=${topic.slug}`}
              emptyTitle="Questions Queued for Verification"
              emptyDescription={`Interactive MCQs for ${topic.name} are queued for editorial verification. Check the linked solved PDF booklets or explore another topic in ${subject.name}.`}
              emptyAction={{ label: `Explore ${subject.name}`, href: `/mcq?subject=${subject.slug}` }}
            />
          </div>

          {/* Right 5 Cols: Linked PDF Booklets */}
          <aside className="lg:col-span-5 space-y-4">
            <h3 className="type-card-title text-[var(--dmc-ink-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              <span>Related PDF Booklets ({relatedPdfs.length})</span>
            </h3>

            {relatedPdfs.length === 0 ? (
              <EmptyStateCard
                icon={FileText}
                title="No Topic-Tagged PDF Yet"
                description={`No solved PDF booklet is explicitly tagged with ${topic.name} yet.`}
                primaryAction={{ label: 'Browse Full PDF Library', href: '/library' }}
              />
            ) : (
              <div className="space-y-4">
                {relatedPdfs.map((pdf) => (
                  <PdfResourceCard key={pdf.id} pdf={pdf} subjectLabel={subject.name} />
                ))}
              </div>
            )}
          </aside>
        </div>
      </SectionBand>
    </>
  );
}
