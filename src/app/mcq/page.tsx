import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { McqSetupForm } from '@/components/mcq/McqSetupForm';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { getLiveDatabaseQuestions } from '@/lib/data/live-questions';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageSchema } from '@/lib/seo/structured-data';
import { SUBJECT_PASTEL_TOKENS } from '@/lib/tokens/visual-tokens';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'MCQ Practice Launcher & Subject Filters',
  description:
    'Filter verified competitive exam MCQs by exam, subject, and syllabus topic. Launch single-question practice with instant explanations and zero login.',
  path: '/mcq'
});

export default async function McqHubPage() {
  const repo = getContentRepository();
  const [exams, subjects, topics] = await Promise.all([
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics()
  ]);
  const posts = (await Promise.all(exams.map((exam) => repo.getRecruitmentPosts(exam.slug)))).flat();
  const [staticQuestions, liveQuestions] = await Promise.all([
    repo.getQuestions({ includeDrafts: false }),
    getLiveDatabaseQuestions(topics, subjects, posts)
  ]);
  const questions = liveQuestions.length > 0 ? liveQuestions : staticQuestions;
  const subjById = new Map(subjects.map((s) => [s.id, s]));

  const countByTopic = new Map<string, number>();
  for (const q of questions) {
    for (const tid of q.topicIds) {
      countByTopic.set(tid, (countByTopic.get(tid) ?? 0) + 1);
    }
  }

  const populatedTopics = topics.filter((t) => (countByTopic.get(t.id) ?? 0) > 0 && subjById.has(t.subjectId));

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          title: 'Competitive Exam MCQ Practice & Syllabus Topics',
          description:
            'Subject and topic-indexed active recall MCQ drills with verified answer explanations.',
          path: '/mcq',
          items: populatedTopics.map((topic) => ({
            name: topic.name,
            path: `/topics/${subjById.get(topic.subjectId)!.slug}/${topic.slug}`
          }))
        })}
      />
      <SectionBand surface="ground" density="compact" labelledBy="mcq-hub-heading">
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'MCQs' }]} currentPath="/mcq" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
                ACTIVE RECALL PRACTICE ENGINE
              </span>
              <h1 id="mcq-hub-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                MCQ Practice &amp; Subject Filter
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                Choose an exam, subject, or syllabus topic to start a single-question practice drill with immediate answer keys and explanations.
              </p>
            </div>

            <div className="text-xs font-bold text-[var(--dmc-ink-primary)] bg-white border border-[var(--dmc-border-subtle)] rounded-xl px-4 py-2.5 tabular-nums elevation-1 self-start">
              {questions.length} Published Screening MCQs &middot; {subjects.length} Subjects
            </div>
          </div>

          <div id="mcq-filter-launcher">
            <McqSetupForm
              exams={exams}
              subjects={subjects}
              topics={topics}
              questions={questions}
              posts={posts}
            />
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="subjects-matrix-heading">
        <div className="space-y-6">
          <div>
            <h2 id="subjects-matrix-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
              Browse by Subject &amp; Topic
            </h2>
            <p className="type-body-sm text-[var(--dmc-ink-secondary)] mt-1">
              Jump directly to any topic landing page for question counts, linked solved PDFs, and targeted practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subject) => {
              const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
              const subjectCount = subjectTopics.reduce(
                (acc, t) => acc + (countByTopic.get(t.id) ?? 0),
                0
              );
              const token = SUBJECT_PASTEL_TOKENS[subject.id] ?? {
                bgVar: 'var(--dmc-subject-gk-bg)',
                inkVar: 'var(--dmc-subject-gk-ink)'
              };

              return (
                <article
                  key={subject.id}
                  className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-5 elevation-1 flex flex-col justify-between space-y-4 min-w-0"
                >
                  <div className="space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold min-w-0 max-w-full"
                        style={{ backgroundColor: token.bgVar, color: token.inkVar }}
                      >
                        <SubjectIconChip
                          subjectId={subject.id}
                          label={subject.name}
                          size="sm"
                          inheritColor
                        />
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--dmc-ink-muted)] tabular-nums shrink-0">
                        {subjectCount} MCQs
                      </span>
                    </div>

                    <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                      {subject.description}
                    </p>

                    {subjectTopics.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {subjectTopics.map((topic) => (
                          <li key={topic.id} className="flex items-center justify-between gap-2 text-xs">
                            <Link
                              href={`/topics/${subject.slug}/${topic.slug}`}
                              className="font-semibold text-[var(--dmc-brand-emerald)] hover:underline truncate"
                            >
                              {topic.name}
                            </Link>
                            <span className="text-[11px] text-[var(--dmc-ink-muted)] tabular-nums shrink-0">
                              {countByTopic.get(topic.id) ?? 0}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--dmc-border-subtle)] flex items-center justify-between gap-2">
                    <Link
                      href={`/mcq/practice?subject=${subject.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Start {subject.name} Drill</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </SectionBand>
    </>
  );
}
