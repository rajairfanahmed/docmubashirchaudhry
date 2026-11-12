'use client';

import React from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { OptionId, Question } from '@/lib/schemas';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { Button } from '@/components/ui/Button';

export interface McqSessionSummaryProps {
  questions: Question[];
  answersByQuestionId: Record<string, OptionId>;
  onRetryMissed?: (missedQuestions: Question[]) => void;
  onRestartAll?: () => void;
}

export function McqSessionSummary({
  questions,
  answersByQuestionId,
  onRetryMissed,
  onRestartAll
}: McqSessionSummaryProps) {
  const total = questions.length;
  const missedQuestions = questions.filter((q) => answersByQuestionId[q.id] !== q.correctOptionId);
  const correctCount = total - missedQuestions.length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-4 sm:p-6 lg:p-8 shadow-sm space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-brand-deep)] flex items-center justify-center mx-auto">
          <Award className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <div className="type-label-micro text-[var(--color-brand-deep)]">SESSION COMPLETED</div>
          <h2
            id="mcq-summary-heading"
            tabIndex={-1}
            className="type-section-heading text-[var(--color-ink)] tabular-nums focus:outline-none"
          >
            Score: {correctCount} / {total} ({pct}%)
          </h2>
          <p className="type-body-sm text-[var(--color-ink-secondary)]">
            {missedQuestions.length === 0
              ? 'Clean sweep! Every question in this drill was answered accurately.'
              : `${missedQuestions.length} question${missedQuestions.length === 1 ? '' : 's'} missed. Review each verified answer key below or retry your missed items.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {missedQuestions.length > 0 && onRetryMissed && (
            <Button variant="primary" size="md" onClick={() => onRetryMissed(missedQuestions)}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Retry Missed ({missedQuestions.length})</span>
            </Button>
          )}
          {onRestartAll && (
            <Button variant="secondary" size="md" onClick={onRestartAll}>
              <span>Practice Full Set Again</span>
            </Button>
          )}
          <Link
            href="/mcq"
            className="dmc-press inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-xs sm:text-sm font-semibold text-[var(--color-ink)]"
          >
            Choose Another Topic
          </Link>
        </div>
      </div>

      {missedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="type-card-title text-[var(--color-ink)]">
            Missed Questions Review ({missedQuestions.length})
          </h3>
          {missedQuestions.map((q) => {
            const chosenId = answersByQuestionId[q.id];
            const chosenOpt = q.options.find((o) => o.id === chosenId);
            const correctOpt = q.options.find((o) => o.id === q.correctOptionId);

            return (
              <article
                key={q.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-3"
              >
                <div className="font-bold text-sm sm:text-base text-[var(--color-ink)]">{q.stem}</div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-[var(--color-danger-ink)] font-semibold">
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Your pick: {chosenOpt ? `${chosenId.toUpperCase()}. ${chosenOpt.text}` : 'Unanswered'}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[var(--color-success-ink)] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Right answer:</span>
                  </span>
                  <AnswerHighlight className="uppercase">
                    {q.correctOptionId}: {correctOpt?.text}
                  </AnswerHighlight>
                </div>

                <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed bg-[var(--dmc-surface-muted)] rounded-xl p-3 border border-[var(--dmc-border-subtle)]">
                  {q.explanation}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

