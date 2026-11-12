'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { McqPaginationStripProps } from './types';

type IndexToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildWindowedQuestionTokens(active: number, count: number): IndexToken[] {
  if (count <= 10) {
    return Array.from({ length: count }, (_, idx) => idx);
  }
  const tokens: IndexToken[] = [0];
  const start = Math.max(1, active - 2);
  const end = Math.min(count - 2, active + 2);

  if (start > 1) tokens.push('ellipsis-left');
  for (let i = start; i <= end; i += 1) {
    tokens.push(i);
  }
  if (end < count - 2) tokens.push('ellipsis-right');
  tokens.push(count - 1);
  return tokens;
}

/**
 * Responsive footer question navigation matching public/images/mcqs-design.png:
 * - Desktop (>= md): outlined Prev | square numbered buttons [1]..[N] | outlined Next
 * - Mobile (< md): equal 2-column Prev (outlined) + Next (solid forest) bar
 */
export function McqPaginationStrip({
  page,
  totalPages,
  questionIds,
  answeredByQuestionId,
  activeIndex,
  pageSize = 20,
  onSelectQuestion,
  onPageChange,
  canPrev,
  canNext,
  onPrev,
  onNext,
  nextLabel = 'Next',
  className
}: McqPaginationStripProps) {
  const tokens = useMemo(
    () => buildWindowedQuestionTokens(activeIndex, questionIds.length),
    [activeIndex, questionIds.length]
  );

  if (questionIds.length === 0) {
    return null;
  }

  const prevDisabled = canPrev !== undefined ? !canPrev : activeIndex <= 0 && page <= 1;
  const nextDisabled = canNext !== undefined ? !canNext : activeIndex >= questionIds.length - 1 && page >= totalPages;

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
      return;
    }
    if (activeIndex > 0) {
      onSelectQuestion(activeIndex - 1);
    } else if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    if (activeIndex + 1 < questionIds.length) {
      onSelectQuestion(activeIndex + 1);
    } else if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    <nav aria-label="Question navigator" className={cn('pt-2', className)}>
      {/* Desktop (>= md) Horizontal Centered Numbered Strip */}
      <div className="hidden md:flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevDisabled}
          aria-label="Previous question"
          className="dmc-press min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          Prev
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {tokens.map((token) => {
            if (token === 'ellipsis-left' || token === 'ellipsis-right') {
              return (
                <span
                  key={token}
                  aria-hidden="true"
                  className="px-1.5 text-xs font-semibold text-[var(--color-ink-muted)] select-none"
                >
                  ...
                </span>
              );
            }

            const qId = questionIds[token];
            const isCurrent = token === activeIndex;
            const isAnswered = Boolean(qId && answeredByQuestionId[qId]);
            const displayNumber = (page - 1) * pageSize + token + 1;

            return (
              <button
                key={qId ?? token}
                type="button"
                onClick={() => onSelectQuestion(token)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Question ${displayNumber}, ${isAnswered ? 'answered' : 'unanswered'}`}
                className={cn(
                  'dmc-press min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center rounded-lg border text-xs font-semibold tabular-nums cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                  isCurrent
                    ? 'border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-action-ink)] shadow-xs'
                    : isAnswered
                      ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)] hover:border-[var(--color-brand-deep)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)]'
                )}
              >
                {displayNumber}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled}
          aria-label={nextLabel}
          className="dmc-press min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          {nextLabel}
        </button>
      </div>

      {/* Mobile (< md) Equal 2-Button Prev / Next Footer */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <button
          type="button"
          onClick={handlePrev}
          disabled={prevDisabled}
          className="dmc-press min-h-[44px] px-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled}
          className="dmc-press min-h-[44px] px-4 inline-flex items-center justify-center rounded-lg bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-sm font-semibold text-[var(--color-action-ink)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          {nextLabel}
        </button>
      </div>
    </nav>
  );
}

