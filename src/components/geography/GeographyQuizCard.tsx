'use client';

import React, { useId } from 'react';
import { ArrowRight, CheckCircle2, Info, XCircle } from 'lucide-react';
import { CircularProgressRing } from '@/components/mcq/CircularProgressRing';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface GeographyQuizOption {
  id: string;
  label: string;
}

export interface GeographyQuizCardProps {
  questionIndex: number;
  totalQuestions: number;
  answeredCount?: number;
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
  footer?: React.ReactNode;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function GeographyQuizCard({
  questionIndex,
  totalQuestions,
  answeredCount = 0,
  prompt,
  subLabel,
  options,
  correctOptionId,
  selectedOptionId = null,
  explanation,
  subStepperSteps,
  activeSubStepKey,
  onSelectOption,
  onNext,
  footer
}: GeographyQuizCardProps) {
  const promptId = useId();
  const isLocked = selectedOptionId !== null && selectedOptionId !== undefined;
  const isCorrect = isLocked && selectedOptionId === correctOptionId;
  const correctOptIdx = options.findIndex((opt) => opt.id === correctOptionId);
  const correctOpt = correctOptIdx >= 0 ? options[correctOptIdx] : undefined;
  const correctLetter = correctOptIdx >= 0 ? (OPTION_LETTERS[correctOptIdx] ?? String(correctOptIdx + 1)) : '';
  const selectedOptIdx = options.findIndex((opt) => opt.id === selectedOptionId);
  const selectedOpt = selectedOptIdx >= 0 ? options[selectedOptIdx] : undefined;
  const selectedLetter = selectedOptIdx >= 0 ? (OPTION_LETTERS[selectedOptIdx] ?? String(selectedOptIdx + 1)) : '';

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-4 sm:p-8 lg:p-10 elevation-1 space-y-5 sm:space-y-6">
      {/* Mobile (< md) Centered Progress Ring */}
      <div className="flex justify-center md:hidden">
        <CircularProgressRing
          answeredCount={answeredCount}
          totalCount={Math.max(1, totalQuestions)}
          sizePx={96}
        />
      </div>

      {/* Desktop Asymmetric Body: Left Stem + 2x2 Options Grid, Right Circular Ring */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-center gap-6 md:gap-10">
        <div key={`${questionIndex}-${prompt}`} className="dmc-question-enter space-y-4 sm:space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-ink-secondary)] tabular-nums">
                Question {questionIndex + 1} of {totalQuestions}
              </span>
              {subLabel && (
                <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                  &middot; {subLabel}
                </span>
              )}
            </div>

            {subStepperSteps && subStepperSteps.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold"
                aria-label="Country Attribute Stepper"
              >
                {subStepperSteps.map((step) => {
                  const active = step.key === activeSubStepKey;
                  return (
                    <span
                      key={step.key}
                      className={cn(
                        'px-2 py-0.5 rounded-full border transition-colors duration-150',
                        active
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border-[var(--color-success-border)] font-bold'
                          : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-muted)] border-[var(--color-border)]'
                      )}
                    >
                      {step.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <h3
            id={promptId}
            className="text-base sm:text-lg lg:text-xl font-bold text-[var(--color-ink)] leading-snug"
          >
            {prompt}
          </h3>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            role="group"
            aria-labelledby={promptId}
          >
            {options.map((opt, idx) => {
              const isPicked = selectedOptionId === opt.id;
              const isRight = opt.id === correctOptionId;
              const letter = OPTION_LETTERS[idx] ?? String(idx + 1);

              let containerStyle =
                'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] cursor-pointer active:scale-[0.988]';
              let letterStyle = 'text-[var(--color-ink)]';

              if (isLocked) {
                if (isRight && isPicked) {
                  containerStyle =
                    'border-2 border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)] cursor-default';
                  letterStyle = 'text-[var(--color-success-ink)]';
                } else if (isRight && !isPicked) {
                  containerStyle =
                    'border-2 border-[var(--color-warning-border)] bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] cursor-default';
                  letterStyle = 'text-[var(--dmc-highlight-ink)]';
                } else if (isPicked && !isRight) {
                  containerStyle =
                    'border-2 border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] cursor-default';
                  letterStyle = 'text-[var(--color-danger-ink)]';
                } else {
                  containerStyle =
                    'border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] cursor-default';
                  letterStyle = 'text-[var(--color-ink-secondary)]';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-disabled={isLocked || undefined}
                  aria-pressed={isPicked}
                  onClick={() => {
                    if (!isLocked) onSelectOption(opt.id);
                  }}
                  className={cn(
                    'w-full min-h-[52px] text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 ease-out motion-reduce:transform-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                    containerStyle
                  )}
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <span className={cn('font-bold uppercase shrink-0 min-w-[20px]', letterStyle)}>
                      {letter}.
                    </span>
                    <span className="leading-snug min-w-0 break-words">{opt.label}</span>
                    {isLocked && isRight && (
                      <span className="sr-only"> (Correct answer)</span>
                    )}
                    {isLocked && isPicked && !isRight && (
                      <span className="sr-only"> (Your selection, incorrect)</span>
                    )}
                  </span>

                  {isLocked && isRight && (
                    <CheckCircle2
                      className="w-4 h-4 text-[var(--color-success-ink)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {isLocked && isPicked && !isRight && (
                    <XCircle
                      className="w-4 h-4 text-[var(--color-danger-ink)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop (>= md) Vertically Centered Progress Ring */}
        <div className="hidden md:flex items-center justify-center shrink-0">
          <CircularProgressRing
            answeredCount={answeredCount}
            totalCount={Math.max(1, totalQuestions)}
            sizePx={124}
          />
        </div>
      </div>

      {isLocked && (
        <div
          aria-live="polite"
          className="dmc-reveal border-t border-[var(--color-border)] pt-5 space-y-3.5"
        >
          <span className="sr-only">
            {isCorrect
              ? `Correct! Option ${correctLetter} (${correctOpt?.label ?? ''}) is right.`
              : `Incorrect. You selected Option ${selectedLetter} (${selectedOpt?.label ?? ''}); the correct answer is Option ${correctLetter} (${correctOpt?.label ?? ''}).`}
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--color-ink)]">
              {isCorrect ? 'Correct pick:' : 'Correct option:'}
            </span>
            <AnswerHighlight className="uppercase">
              {correctLetter}. {correctOpt?.label}
            </AnswerHighlight>
          </div>

          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-[var(--radius-control)] p-4 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed flex items-start gap-2.5">
            <Info
              className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p>{explanation}</p>
          </div>
        </div>
      )}

      {footer ? (
        <div className="pt-2 border-t border-[var(--color-border)]/80">{footer}</div>
      ) : (
        isLocked && (
          <div className="flex justify-end">
            <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={onNext}>
              <span>
                {questionIndex + 1 < totalQuestions ? 'Next Question' : 'View Results Summary'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )
      )}
    </article>
  );
}
