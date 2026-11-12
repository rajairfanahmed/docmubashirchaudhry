'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => Promise<void> | void;
  answeredCount: number;
  totalCount: number;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  isSubmitting: boolean;
}

export function ConfirmSubmitModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  answeredCount,
  totalCount,
  negativeMarking,
  negativeMarkingValue,
  isSubmitting
}: ConfirmSubmitModalProps) {
  const unansweredCount = Math.max(0, totalCount - answeredCount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Submit Quiz Answers?"
      labelledBy="confirm-quiz-submit-heading"
      className="max-w-md"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-[var(--radius-control)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-success-ink)]">
              Answered
            </div>
            <div className="font-display font-extrabold text-xl text-[var(--color-ink)] tabular-nums mt-0.5">
              {answeredCount} / {totalCount}
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Unanswered
            </div>
            <div className="font-display font-extrabold text-xl text-[var(--color-ink)] tabular-nums mt-0.5">
              {unansweredCount}
            </div>
          </div>
        </div>

        {negativeMarking ? (
          <div className="rounded-[var(--radius-control)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-warning-ink)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-snug">
              Negative marking is active (-{negativeMarkingValue} deducted per incorrect answer;
              unanswered questions receive 0).
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-ink-secondary)]">
            <CheckCircle2
              className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="leading-snug">
              Once submitted, your final score is graded on the server and saved privately to your
              attempt history.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Review Questions
          </Button>
          <Button
            variant="primary"
            onClick={() => void onConfirmSubmit()}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>Submit Answers</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

