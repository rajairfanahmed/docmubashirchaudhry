import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Languages,
  Lock,
  ShieldAlert,
  Sparkles,
  Target
} from 'lucide-react';
import type { QuizSummaryItem } from '@/lib/v3/types';

export interface QuizCatalogCardProps {
  quiz: QuizSummaryItem;
}

export function QuizCatalogCard({ quiz }: QuizCatalogCardProps) {
  const isMock = quiz.type === 'mock';
  const durationMinutes = quiz.timeLimitSeconds
    ? Math.ceil(quiz.timeLimitSeconds / 60)
    : null;

  const languageLabel =
    quiz.language === 'ur'
      ? 'Urdu'
      : quiz.language === 'bilingual'
      ? 'English & Urdu'
      : 'English';

  return (
    <article className="track-card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 elevation-1 flex flex-col justify-between gap-5 min-w-0">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={
              isMock
                ? 'font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-action)] text-[var(--color-action-ink)]'
                : 'font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)]'
            }
          >
            {isMock ? 'Full-Length Mock' : 'Practice Quiz'}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {quiz.examTag && (
              <span className="font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                {quiz.examTag}
              </span>
            )}
            {quiz.language !== 'en' && (
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-info-ink)] bg-[var(--color-info-bg)] border border-[var(--color-info-border)] px-2.5 py-0.5 rounded-full">
                <Languages className="w-3 h-3" aria-hidden="true" />
                <span>{languageLabel}</span>
              </span>
            )}
          </div>
        </div>

        <h2 className="type-card-title text-[var(--color-ink)]">
          <Link
            href={`/quizzes/${quiz.slug}`}
            className="hover:text-[var(--color-brand-deep)] hover:underline"
          >
            {quiz.title}
          </Link>
        </h2>

        {quiz.description && (
          <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed line-clamp-2">
            {quiz.description}
          </p>
        )}

        <dl className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-[var(--color-ink-muted)] tabular-nums">
          <div className="inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-deep)]" aria-hidden="true" />
            <span>{quiz.questionCount} MCQs</span>
          </div>

          <div className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{durationMinutes ? `${durationMinutes} min` : 'Untimed'}</span>
          </div>

          <div className="inline-flex items-center gap-1">
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{quiz.passPercentage}% pass</span>
          </div>

          {quiz.negativeMarking && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning-ink)] font-semibold">
              <ShieldAlert className="w-3 h-3" aria-hidden="true" />
              <span>-{quiz.negativeMarkingValue} negative marking</span>
            </div>
          )}
        </dl>
      </div>

      <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-ink-muted)]">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{quiz.subject || 'General Prep'}</span>
        </span>

        <Link
          href={`/quizzes/${quiz.slug}`}
          className="dmc-press group inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs font-semibold whitespace-nowrap"
        >
          <span>{isMock ? 'Take Mock Exam' : 'Start Quiz'}</span>
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

