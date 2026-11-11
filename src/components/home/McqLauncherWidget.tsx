'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, PlayCircle } from 'lucide-react';
import type { Exam, Subject, Topic } from '@/lib/schemas';
import { SUBJECT_PASTEL_TOKENS } from '@/lib/tokens/visual-tokens';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';
import { Button } from '@/components/ui/Button';

export interface McqLauncherWidgetProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  questionCountsBySubject?: Record<string, number>;
}

export function McqLauncherWidget({
  exams,
  subjects,
  topics,
  questionCountsBySubject
}: McqLauncherWidgetProps) {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const topicsBySubject = useMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const topic of topics) {
      const list = map.get(topic.subjectId) ?? [];
      list.push(topic);
      map.set(topic.subjectId, list);
    }
    return map;
  }, [topics]);

  const handleLaunch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedExam) params.set('exam', selectedExam);
    if (selectedSubject) params.set('subject', selectedSubject);
    const qs = params.toString();
    notifyNavigationStart();
    router.push(qs ? `/mcq/practice?${qs}` : '/mcq/practice');
  };

  return (
    <div className="space-y-8">
      {/* Quick Exam & Subject Launcher Card */}
      <form
        action="/mcq/practice"
        method="GET"
        onSubmit={handleLaunch}
        className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-5 sm:p-6 elevation-1"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label
              htmlFor="home-mcq-exam"
              className="block text-xs font-bold text-[var(--dmc-ink-secondary)] mb-1.5"
            >
              Exam Authority
            </label>
            <select
              id="home-mcq-exam"
              name="exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full h-11 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] px-3 text-sm text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
            >
              <option value="">All Exams (General Screening)</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.slug}>
                  {exam.bodyCode} - {exam.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="home-mcq-subject"
              className="block text-xs font-bold text-[var(--dmc-ink-secondary)] mb-1.5"
            >
              Subject Focus
            </label>
            <select
              id="home-mcq-subject"
              name="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-11 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] px-3 text-sm text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.slug}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="forest" size="md" className="w-full">
            <PlayCircle className="w-4 h-4" aria-hidden="true" />
            <span>Start Practice</span>
          </Button>
        </div>
      </form>

      {/* Compact 5x2 Pastel Subject Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {subjects.slice(0, 10).map((subject) => {
          const subjectTopics = topicsBySubject.get(subject.id) ?? [];
          const qCount = questionCountsBySubject?.[subject.id] ?? 0;
          const firstTopic = subjectTopics[0];
          const href = firstTopic
            ? `/topics/${subject.slug}/${firstTopic.slug}`
            : `/mcq?subject=${subject.slug}`;
          const palette = SUBJECT_PASTEL_TOKENS[subject.id] ?? {
            bgVar: 'var(--dmc-subject-gk-bg)',
            inkVar: 'var(--dmc-subject-gk-ink)'
          };

          return (
            <Link
              key={subject.id}
              href={href}
              className="track-card bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-2xl p-2.5 min-[360px]:p-3 sm:p-4 elevation-1 flex flex-col justify-between space-y-2.5 sm:space-y-3 group min-w-0 min-h-[84px]"
            >
              <div className="flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-3 min-w-0">
                <span
                  className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 rounded-[var(--dmc-radius-squircle)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: palette.bgVar, color: palette.inkVar }}
                  aria-hidden="true"
                >
                  <SubjectIconChip subjectId={subject.id} iconOnly inheritColor size="md" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs min-[360px]:text-[13px] font-bold text-[var(--dmc-ink-primary)] leading-tight break-words [overflow-wrap:anywhere]">
                    {subject.name}
                  </div>
                  <div className="text-[11px] text-[var(--dmc-ink-muted)] mt-0.5 truncate tabular-nums">
                    {qCount > 0
                      ? `${qCount} MCQ${qCount === 1 ? '' : 's'}`
                      : subjectTopics.length > 0
                        ? `${subjectTopics.length} topic${subjectTopics.length === 1 ? '' : 's'}`
                        : 'Topic Archive'}
                  </div>
                </div>
              </div>

              <div className="inline-flex flex-wrap items-center gap-1 text-xs font-bold text-[var(--dmc-brand-forest)] group-hover:underline min-w-0 max-w-full">
                <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Explore</span>
                <ArrowRight className="w-3 h-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

