'use client';

import React from 'react';
import { Clock, Send, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MockExamTimerBarProps {
  title: string;
  remainingSeconds: number;
  totalSeconds: number;
  answeredCount: number;
  totalCount: number;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  onOpenSubmitModal: () => void;
  isSubmitting?: boolean;
}

export function formatCountdownClock(secondsInput: number): string {
  const safe = Math.max(0, Math.floor(secondsInput));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((unit) => String(unit).padStart(2, '0')).join(':');
}

export function MockExamTimerBar({
  title,
  remainingSeconds,
  totalSeconds,
  answeredCount,
  totalCount,
  negativeMarking,
  negativeMarkingValue,
  onOpenSubmitModal,
  isSubmitting = false
}: MockExamTimerBarProps) {
  const ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const isDanger = ratio <= 0.1 || remainingSeconds < 60;
  const isWarn = !isDanger && ratio <= 0.25;

  const timerToneStyle = isDanger
    ? 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger-ink)]'
    : isWarn
    ? 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-warning-ink)]'
    : 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-ink)]';

  return (
    <div
      role="region"
      aria-label="Mock exam timer and submission bar"
      className="sticky top-[4.25rem] sm:top-[4.5rem] z-20 bg-[var(--color-surface)]/95 backdrop-blur-sm border border-[var(--color-border)] rounded-[var(--radius-panel)] px-4 py-3 elevation-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="font-display font-bold text-sm sm:text-base text-[var(--color-ink)] line-clamp-2 sm:line-clamp-1">
          {title}
        </span>

        <span className="text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-ink-secondary)]">
          {answeredCount} / {totalCount} answered
        </span>

        {negativeMarking && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border border-[var(--color-warning-border)]">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>-{negativeMarkingValue} neg</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
        <div
          aria-live={isDanger ? 'assertive' : 'off'}
          className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-1.5 rounded-[var(--radius-control)] border font-bold text-sm tabular-nums ${timerToneStyle}`}
        >
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{formatCountdownClock(remainingSeconds)}</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenSubmitModal}
          isLoading={isSubmitting}
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Submit Exam</span>
        </Button>
      </div>
    </div>
  );
}

