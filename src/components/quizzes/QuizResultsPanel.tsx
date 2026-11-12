'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  History,
  Info,
  RotateCcw,
  XCircle
} from 'lucide-react';
import type { ContentLanguage } from '@/lib/supabase/database.types';
import type { QuizSubmitResponse } from '@/lib/v3/types';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { Button } from '@/components/ui/Button';
import { BilingualQuestionStem } from '@/components/quizzes/BilingualQuestionStem';
import { formatCountdownClock } from '@/components/quizzes/MockExamTimerBar';

export interface QuizResultsPanelProps {
  result: QuizSubmitResponse;
  language: ContentLanguage;
  passPercentage: number;
  onRetake: () => void;
}

export function QuizResultsPanel({
  result,
  language,
  passPercentage,
  onRetake
}: QuizResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Main Score Summary Card */}
      <section
        aria-labelledby="quiz-results-heading"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-6 sm:p-8 lg:p-10 elevation-1 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span
                className={
                  result.passed
                    ? 'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)]'
                    : 'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning-ink)]'
                }
              >
                {result.passed ? (
                  <Award className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Info className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{result.passed ? 'Passed' : 'Did Not Meet Pass Mark'}</span>
              </span>

              {result.autoSubmitted && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-ink-secondary)]">
                  Auto-submitted at time limit
                </span>
              )}
            </div>

            <h2 id="quiz-results-heading" className="type-page-title text-[var(--color-ink)]">
              {result.quizTitle} Results
            </h2>
            <p className="text-sm text-[var(--color-ink-secondary)]">
              Pass mark target: {passPercentage}% &middot; Saved privately to your attempt history.
            </p>
          </div>

          <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-6 py-4 text-center shrink-0">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[var(--color-ink)] tabular-nums leading-none">
              {result.percentage}%
            </div>
            <div className="text-xs font-semibold text-[var(--color-ink-secondary)] tabular-nums mt-1.5">
              Score: {result.score} / {result.maxScore}
            </div>
          </div>
        </div>

        {/* 4 Breakdown Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-[var(--radius-control)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] p-4">
            <div className="text-xs font-semibold text-[var(--color-success-ink)]">
              Correct
            </div>
            <div className="font-display font-extrabold text-2xl text-[var(--color-success-ink)] tabular-nums mt-1">
              {result.correctCount}
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-4">
            <div className="text-xs font-semibold text-[var(--color-danger-ink)]">
              Incorrect
            </div>
            <div className="font-display font-extrabold text-2xl text-[var(--color-danger-ink)] tabular-nums mt-1">
              {result.incorrectCount}
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-4">
            <div className="text-xs font-semibold text-[var(--color-ink-secondary)]">
              Unanswered
            </div>
            <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums mt-1">
              {result.unansweredCount}
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-4">
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)]">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Time Taken</span>
            </div>
            <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums mt-1">
              {formatCountdownClock(result.timeTakenSeconds)}
            </div>
          </div>
        </div>

        {/* Action Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="primary" onClick={onRetake}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Retake Quiz</span>
          </Button>

          <Link
            href="/my-attempts"
            className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] text-xs sm:text-sm font-semibold text-[var(--color-ink)]"
          >
            <History className="w-4 h-4 text-[var(--color-brand-deep)]" aria-hidden="true" />
            <span>My Attempts</span>
          </Link>

          <Link
            href="/quizzes"
            className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] text-xs sm:text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            <span>Browse All Quizzes</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Chronological Review Breakdown */}
      <section aria-labelledby="quiz-review-heading" className="space-y-4">
        <h3 id="quiz-review-heading" className="type-section-heading text-[var(--color-ink)]">
          Question-by-Question Answer Review
        </h3>

        <div className="space-y-4">
          {result.review.map((item, idx) => (
            <article
              key={item.questionId}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 elevation-1 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                <span className="type-label-micro text-[var(--color-ink-muted)] tabular-nums">
                  Question {idx + 1}
                </span>

                {item.unanswered ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-ink-secondary)]">
                    Unanswered
                  </span>
                ) : item.isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)]">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Correct</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-[var(--color-danger-ink)]">
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Incorrect</span>
                  </span>
                )}
              </div>

              <BilingualQuestionStem
                language={language}
                textEn={item.textEn}
                textUr={item.textUr}
              />

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm pt-1">
                <div className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--color-ink-muted)]">Your answer:</span>
                  <span className="font-bold uppercase text-[var(--color-ink)]">
                    {item.selectedOption ?? 'Skipped'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--color-ink-muted)]">Correct key:</span>
                  <AnswerHighlight shape="pill">Option {item.correctOption.toUpperCase()}</AnswerHighlight>
                </div>
              </div>

              {item.explanation && (
                <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-3.5 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                  <span className="font-semibold text-[var(--color-ink)] mr-1">Explanation:</span>
                  {item.explanation}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

