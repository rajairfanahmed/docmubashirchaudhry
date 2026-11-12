import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Subject, Topic } from '@/lib/schemas';
import { SUBJECT_PASTEL_TOKENS } from '@/lib/tokens/visual-tokens';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';

export interface McqSubjectStripProps {
  subjects: Subject[];
  topics: Topic[];
  questionCountsBySubject?: Record<string, number>;
}

/**
 * Pure Server Component rendering the 5x2 pastel subject strip on `/`
 * so static subject icons and tiles ship zero interactive client JS.
 */
export function McqSubjectStrip({
  subjects,
  topics,
  questionCountsBySubject
}: McqSubjectStripProps) {
  const topicsBySubject = new Map<string, Topic[]>();
  for (const topic of topics) {
    const list = topicsBySubject.get(topic.subjectId) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subjectId, list);
  }

  return (
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
            className="track-card bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand-deep)] rounded-[var(--radius-panel)] p-2.5 min-[360px]:p-3 sm:p-4 elevation-1 flex flex-col justify-between space-y-2.5 sm:space-y-3 group min-w-0 min-h-[84px]"
          >
            <div className="flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-3 min-w-0">
              <span
                className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 rounded-[var(--radius-control)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: palette.bgVar, color: palette.inkVar }}
                aria-hidden="true"
              >
                <SubjectIconChip subjectId={subject.id} iconOnly inheritColor size="md" />
              </span>
              <div className="min-w-0">
                <div className="text-xs min-[360px]:text-[13px] font-bold text-[var(--color-ink)] leading-tight break-words [overflow-wrap:anywhere]">
                  {subject.name}
                </div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 truncate tabular-nums">
                  {qCount > 0
                    ? `${qCount} MCQ${qCount === 1 ? '' : 's'}`
                    : subjectTopics.length > 0
                      ? `${subjectTopics.length} topic${subjectTopics.length === 1 ? '' : 's'}`
                      : 'Topic Archive'}
                </div>
              </div>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 text-xs font-semibold text-[var(--color-brand-deep)] group-hover:underline min-w-0 max-w-full">
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Explore</span>
              <ArrowRight
                className="w-3 h-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

