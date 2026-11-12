'use client';

import React, { useId } from 'react';
import { ArrowRight, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { OptionId, Question } from '@/lib/schemas';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CircularProgressRing } from './CircularProgressRing';

export interface SingleQuestionCardProps {
  question: Question;
  selectedOptionId?: OptionId | null;
  onSelectOption?: (optionId: OptionId) => void;
  onNext?: () => void;
  nextLabel?: string;
  questionIndex?: number;
  totalQuestions?: number;
  answeredCount?: number;
  footer?: React.ReactNode;
}

export function SingleQuestionCard({
  question,
  selectedOptionId = null,
  onSelectOption,
  onNext,
  nextLabel = 'Next Question',
  questionIndex = 0,
  totalQuestions = 1,
  answeredCount = 0,
  footer
}: SingleQuestionCardProps) {
  const stemId = useId();
  const isLocked = selectedOptionId !== null && selectedOptionId !== undefined;
  const isCorrect = isLocked && selectedOptionId === question.correctOptionId;
  const correctOpt = question.options.find((opt) => opt.id === question.correctOptionId);
  const selectedOpt = question.options.find((opt) => opt.id === selectedOptionId);

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-4 sm:p-8 lg:p-10 elevation-1 space-y-5 sm:space-y-6">
      {/* Mobile (< md) Centered Progress Ring */}
      <div className="flex justify-center md:hidden">
        <CircularProgressRing
          answeredCount={answeredCount}
          totalCount={totalQuestions}
          sizePx={96}
        />
      </div>

      {/* Desktop Asymmetric Body: Left Stem + 2x2 Options Grid, Right Circular Ring */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-center gap-6 md:gap-10">
        <div key={question.id} className="dmc-question-enter space-y-4 sm:space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] tabular-nums">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            {question.verification.status !== 'verified' && (
              <VerificationBadge status={question.verification.status} />
            )}
          </div>

          <h3 id={stemId} className="text-base sm:text-lg lg:text-xl font-bold text-[var(--color-ink)] leading-snug">
            {question.stem}
          </h3>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            role="group"
            aria-labelledby={stemId}
          >
            {question.options.map((opt) => {
              const isThisSelected = selectedOptionId === opt.id;
              const isThisCorrect = opt.id === question.correctOptionId;

              let containerStyle =
                'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] cursor-pointer active:scale-[0.988]';
              let letterStyle = 'text-[var(--color-ink)]';

              if (isLocked) {
                if (isThisCorrect && isThisSelected) {
                  containerStyle =
                    'border-2 border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)] cursor-default';
                  letterStyle = 'text-[var(--color-success-ink)]';
                } else if (isThisCorrect && !isThisSelected) {
                  containerStyle =
                    'border-2 border-[var(--color-warning-border)] bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] cursor-default';
                  letterStyle = 'text-[var(--dmc-highlight-ink)]';
                } else if (isThisSelected && !isThisCorrect) {
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
                  aria-pressed={isThisSelected}
                  onClick={() => {
                    if (!isLocked) onSelectOption?.(opt.id);
                  }}
                  className={cn(
                    'w-full min-h-[52px] text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 ease-out motion-reduce:transform-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                    containerStyle
                  )}
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <span className={cn('font-bold uppercase shrink-0 min-w-[20px]', letterStyle)}>
                      {opt.id}.
                    </span>
                    <span className="leading-snug min-w-0 break-words">{opt.text}</span>
                    {isLocked && isThisCorrect && (
                      <span className="sr-only"> (Correct answer)</span>
                    )}
                    {isLocked && isThisSelected && !isThisCorrect && (
                      <span className="sr-only"> (Your selection, incorrect)</span>
                    )}
                  </span>

                  {isLocked && isThisCorrect && (
                    <CheckCircle2
                      className="w-4 h-4 text-[var(--color-success-ink)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {isLocked && isThisSelected && !isThisCorrect && (
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
            totalCount={totalQuestions}
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
              ? `Correct! Option ${question.correctOptionId.toUpperCase()} (${correctOpt?.text ?? ''}) is right.`
              : `Incorrect. You selected Option ${String(selectedOptionId).toUpperCase()} (${selectedOpt?.text ?? ''}); the correct answer is Option ${question.correctOptionId.toUpperCase()} (${correctOpt?.text ?? ''}).`}
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--color-ink)]">
              {isCorrect ? 'Correct pick:' : 'Correct option:'}
            </span>
            <AnswerHighlight className="uppercase">
              {question.correctOptionId}. {correctOpt?.text}
            </AnswerHighlight>
          </div>

          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-[var(--radius-control)] p-4 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0 mt-0.5" aria-hidden="true" />
            <p>{question.explanation}</p>
          </div>
        </div>
      )}

      {footer ? (
        <div className="pt-2 border-t border-[var(--color-border)]/80">{footer}</div>
      ) : (
        isLocked &&
        onNext && (
          <div className="flex justify-end">
            <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={onNext}>
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )
      )}
    </article>
  );
}

