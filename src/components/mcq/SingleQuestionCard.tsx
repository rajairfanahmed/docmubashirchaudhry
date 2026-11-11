'use client';

import React from 'react';
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
  const isLocked = selectedOptionId !== null && selectedOptionId !== undefined;
  const isCorrect = isLocked && selectedOptionId === question.correctOptionId;
  const correctOpt = question.options.find((opt) => opt.id === question.correctOptionId);

  return (
    <article className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-8 lg:p-10 elevation-2 space-y-5 sm:space-y-6">
      {/* Mobile (< md) Centered Progress Ring Matching mcqs-design.png */}
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
            <span className="text-xs font-semibold text-[var(--dmc-ink-secondary)] tabular-nums">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            {question.verification.status !== 'verified' && (
              <VerificationBadge status={question.verification.status} />
            )}
          </div>

          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--dmc-mcq-heading)] leading-snug">
            {question.stem}
          </h3>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            role="group"
            aria-label="Answer options"
          >
            {question.options.map((opt) => {
              const isThisSelected = selectedOptionId === opt.id;
              const isThisCorrect = opt.id === question.correctOptionId;

              let containerStyle =
                'border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-card)] hover:border-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-surface-muted)] text-[var(--dmc-mcq-heading)]';
              let letterStyle = 'text-[var(--dmc-mcq-heading)]';

              if (isLocked) {
                if (isThisCorrect && isThisSelected) {
                  containerStyle =
                    'border-2 border-[var(--dmc-status-verified-border)] bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)]';
                  letterStyle = 'text-[var(--dmc-status-verified-ink)]';
                } else if (isThisCorrect && !isThisSelected) {
                  containerStyle =
                    'border-2 border-[var(--dmc-accent-gold)] bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)]';
                  letterStyle = 'text-[var(--dmc-highlight-ink)]';
                } else if (isThisSelected && !isThisCorrect) {
                  containerStyle =
                    'border-2 border-[var(--dmc-status-error-border)] bg-[var(--dmc-status-error-bg)] text-[var(--dmc-status-error-ink)]';
                  letterStyle = 'text-[var(--dmc-status-error-ink)]';
                } else {
                  containerStyle =
                    'border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-muted)]/70 text-[var(--dmc-ink-muted)] opacity-75';
                  letterStyle = 'text-[var(--dmc-ink-muted)]';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isLocked}
                  aria-pressed={isThisSelected}
                  onClick={() => onSelectOption?.(opt.id)}
                  className={cn(
                    'w-full min-h-[52px] text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.988] motion-reduce:transform-none cursor-pointer disabled:cursor-default disabled:active:scale-100',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dmc-brand-forest)]',
                    containerStyle
                  )}
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <span className={cn('font-bold uppercase shrink-0 min-w-[20px]', letterStyle)}>
                      {opt.id}.
                    </span>
                    <span className="leading-snug min-w-0 break-words">{opt.text}</span>
                  </span>

                  {isLocked && isThisCorrect && (
                    <CheckCircle2
                      className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0"
                      aria-label="Correct option"
                    />
                  )}
                  {isLocked && isThisSelected && !isThisCorrect && (
                    <XCircle
                      className="w-4 h-4 text-[var(--dmc-status-error-icon)] shrink-0"
                      aria-label="Incorrect selection"
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
          className="dmc-reveal border-t border-[var(--dmc-border-subtle)] pt-5 space-y-3.5"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[var(--dmc-ink-primary)]">
              {isCorrect ? 'Correct pick:' : 'Correct option:'}
            </span>
            <AnswerHighlight className="uppercase">
              {question.correctOptionId}. {correctOpt?.text}
            </AnswerHighlight>
          </div>

          <div className="bg-[var(--dmc-surface-muted)] border border-[var(--dmc-border-subtle)] rounded-xl p-4 text-xs sm:text-sm text-[var(--dmc-ink-secondary)] leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[var(--dmc-brand-forest)] shrink-0 mt-0.5" aria-hidden="true" />
            <p>{question.explanation}</p>
          </div>
        </div>
      )}

      {footer ? (
        <div className="pt-2 border-t border-[var(--dmc-border-subtle)]/70">{footer}</div>
      ) : (
        isLocked &&
        onNext && (
          <div className="flex justify-end">
            <Button variant="forest" size="md" className="w-full sm:w-auto" onClick={onNext}>
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )
      )}
    </article>
  );
}

