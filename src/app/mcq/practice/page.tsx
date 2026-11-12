import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { McqPracticeRunner } from '@/components/mcq/McqPracticeRunner';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { getServerDatasetVersion } from '@/lib/data/server-manifest';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildQuizResourceSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'Interactive MCQ Practice Session',
  description:
    'Interactive single-question practice workspace with locked option feedback, verified golden-pill answer reveals, explanations, and missed-question retry.',
  path: '/mcq/practice',
  index: false,
  follow: true
});

function firstString(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function McqPracticePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const examSlug = firstString(sp.exam)?.trim();
  const subjectSlug = firstString(sp.subject)?.trim();
  const topicSlug = firstString(sp.topic)?.trim();

  const repo = getContentRepository();
  const [exams, subjects, topics] = await Promise.all([
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics()
  ]);

  const exam = examSlug ? exams.find((e) => e.slug === examSlug) : undefined;
  const subject = subjectSlug ? subjects.find((s) => s.slug === subjectSlug) : undefined;
  const topic = topicSlug ? topics.find((t) => t.slug === topicSlug) : undefined;

  const questions = await repo.getQuestions({
    examId: exam?.id,
    subjectId: subject?.id,
    topicIds: topic ? [topic.id] : undefined,
    includeDrafts: false
  });

  const datasetVersion = getServerDatasetVersion();
  const sessionKey = `exam=${exam?.slug ?? 'all'}&subject=${subject?.slug ?? 'all'}&topic=${topic?.slug ?? 'all'}`;

  return (
    <>
      <JsonLd
        data={buildQuizResourceSchema({
          title: 'Competitive Exam Single-Question MCQ Practice Session',
          description:
            'Interactive active-recall MCQ practice session with immediate explanations and missed-question review.',
          path: '/mcq/practice',
          about: [
            exam?.title ?? 'Competitive Exams',
            subject?.name ?? 'General Knowledge',
            topic?.name ?? 'Active Recall Practice'
          ],
          questionCount: questions.length
        })}
      />
      <SectionBand surface="ground" size="wide" density="compact" labelledBy="practice-heading">
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: 'MCQs', href: '/mcq' },
              { label: 'Practice Session' }
            ]}
            currentPath="/mcq/practice"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
            <div>
              <h1 id="practice-heading" className="type-page-title text-[var(--color-ink)]">
                Interactive MCQ Practice
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[var(--color-ink-secondary)]">
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] font-medium">
                  Exam: {exam?.bodyCode ?? 'All Exams'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] font-medium">
                  Subject: {subject?.name ?? 'All Subjects'}
                </span>
                {topic && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[var(--color-success-bg)] text-[var(--color-success-ink)] font-semibold border border-[var(--color-success-border)]">
                    Topic: {topic.name}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/mcq"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-[var(--color-brand-deep)] hover:underline shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Change Filters</span>
            </Link>
          </div>
        </div>
      </SectionBand>

      <SectionBand
        surface="ground"
        size="wide"
        density="compact"
        ariaLabel="Interactive MCQ Question Workspace"
        className="pb-12 sm:pb-16"
      >
        <div className="bg-[var(--color-surface-soft)] rounded-[var(--radius-sheet)] border border-[var(--color-border)] p-3 sm:p-8 lg:p-10">
          <div className="max-w-3xl mx-auto">
            <McqPracticeRunner
              questions={questions}
              sessionKey={sessionKey}
              datasetVersion={datasetVersion}
            />
          </div>
        </div>
      </SectionBand>
    </>
  );
}
