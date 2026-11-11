'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface GeographyQuizOption {
  id: string;
  label: string;
}

export interface GeographyQuizCardProps {
  questionIndex: number;
  totalQuestions: number;
  prompt: string;
  subLabel?: string;
  options: GeographyQuizOption[];
  correctOptionId: string;
  selectedOptionId?: string | null;
  explanation: string;
  subStepperSteps?: Array<{ key: string; label: string }>;
  activeSubStepKey?: string;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function GeographyQuizCard({
  questionIndex,
  totalQuestions,
  prompt,
  subLabel,
  options,
  correctOptionId,
  selectedOptionId = null,
  explanation,
  subStepperSteps,
  activeSubStepKey,
  onSelectOption,
  onNext
}: GeographyQuizCardProps) {
  const isLocked = selectedOptionId !== null && selectedOptionId !== undefined;
  const isCorrect = isLocked && selectedOptionId === correctOptionId;

  return (
    <article className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-6 lg:p-8 elevation-2 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
        <div className="space-y-0.5">
          <div className="type-label-micro text-amber-800 uppercase tabular-nums">
            QUESTION {questionIndex + 1} OF {totalQuestions}
          </div>
          {subLabel && <div className="text-xs text-[var(--dmc-ink-muted)]">{subLabel}</div>}
        </div>

        <span
          className={cn(
            'text-xs font-bold px-3 py-1 rounded-full border',
            !isLocked
              ? 'bg-slate-100 text-[var(--dmc-ink-secondary)] border-[var(--dmc-border-subtle)]'
              : isCorrect
                ? 'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border-[var(--dmc-status-verified-border)]'
                : 'bg-[var(--dmc-status-error-bg)] text-[var(--dmc-status-error-ink)] border-[var(--dmc-status-error-border)]'
          )}
        >
          {!isLocked ? 'Unanswered' : isCorrect ? 'Correct +1' : 'Incorrect'}
        </span>
      </div>

      {subStepperSteps && subStepperSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold" aria-label="Country Attribute Stepper">
          {subStepperSteps.map((step, i) => {
            const active = step.key === activeSubStepKey;
            return (
              <React.Fragment key={step.key}>
                {i > 0 && <span className="text-slate-300" aria-hidden="true">-&gt;</span>}
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-md border transition-colors duration-150',
                    active
                      ? 'bg-[var(--dmc-brand-forest)] text-white border-transparent'
                      : 'bg-[var(--dmc-surface-muted)] text-[var(--dmc-ink-muted)] border-[var(--dmc-border-subtle)]'
                  )}
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      <h3 className="text-lg sm:text-xl font-bold text-[var(--dmc-ink-primary)] leading-snug">
        {prompt}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Quiz options A through D">
        {options.map((opt, idx) => {
          const isPicked = selectedOptionId === opt.id;
          const isRight = opt.id === correctOptionId;

          let cardClass =
            'border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-card)] hover:border-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-surface-muted)] text-[var(--dmc-ink-primary)]';

          if (isLocked) {
            if (isRight && isPicked) {
              cardClass =
                'border-2 border-[var(--dmc-status-verified-border)] bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)]';
            } else if (isRight && !isPicked) {
              cardClass =
                'border-2 border-[var(--dmc-accent-gold)] bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)]';
            } else if (isPicked && !isRight) {
              cardClass =
                'border-2 border-[var(--dmc-status-error-border)] bg-[var(--dmc-status-error-bg)] text-[var(--dmc-status-error-ink)]';
            } else {
              cardClass = 'border-[var(--dmc-border-subtle)] bg-slate-50 text-[var(--dmc-ink-muted)] opacity-75';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isLocked}
              aria-pressed={isPicked}
              onClick={() => onSelectOption(opt.id)}
              className={cn(
                'min-h-[54px] text-left rounded-xl border px-4 py-3 flex items-center justify-between gap-2.5 text-sm font-semibold transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.988] motion-reduce:transform-none cursor-pointer disabled:cursor-default disabled:active:scale-100',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dmc-brand-forest)]',
                cardClass
              )}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-white/80 border border-slate-300 flex items-center justify-center text-xs font-extrabold shrink-0">
                  {OPTION_LETTERS[idx] ?? idx + 1}
                </span>
                <span className="leading-snug min-w-0 break-words">{opt.label}</span>
              </span>

              {isLocked && isRight && (
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
              )}
              {isLocked && isPicked && !isRight && (
                <XCircle className="w-4 h-4 text-[var(--dmc-status-error-icon)] shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {isLocked && (
        <div
          aria-live="polite"
          className="dmc-reveal border-t border-[var(--dmc-border-subtle)] pt-5 space-y-4"
        >
          <div className="bg-[var(--dmc-surface-muted)] border border-[var(--dmc-border-subtle)] rounded-xl p-4 text-xs sm:text-sm text-[var(--dmc-ink-secondary)] leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[var(--dmc-brand-forest)] shrink-0 mt-0.5" aria-hidden="true" />
            <p>{explanation}</p>
          </div>

          <div className="flex justify-end">
            <Button variant="forest" size="md" className="w-full sm:w-auto" onClick={onNext}>
              <span>{questionIndex + 1 < totalQuestions ? 'Next Question' : 'View Results Summary'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

