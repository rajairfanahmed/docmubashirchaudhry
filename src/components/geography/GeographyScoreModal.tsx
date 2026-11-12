'use client';

import React from 'react';
import { ArrowRight, Award, RotateCcw, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface GeographyScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  total: number;
  onRetake: () => void;
  onNextScope: () => void;
  onClearProgress?: () => void;
  nextScopeLabel?: string;
}

export function GeographyScoreModal({
  isOpen,
  onClose,
  score,
  total,
  onRetake,
  onNextScope,
  onClearProgress,
  nextScopeLabel = 'Next Alphabet / Region'
}: GeographyScoreModalProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passedThreshold = percentage >= 70;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Geography Quiz Results">
      <div className="space-y-6 text-center">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${
            passedThreshold
              ? 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border-[var(--color-success-border)]'
              : 'bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] border-[var(--color-border)]'
          }`}
        >
          {passedThreshold ? (
            <Trophy className="w-8 h-8" aria-hidden="true" />
          ) : (
            <Award className="w-8 h-8" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          {passedThreshold && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)] text-xs font-semibold">
              <span>Milestone Achieved (70%+ Score)</span>
            </div>
          )}

          <div className="text-3xl font-extrabold text-[var(--color-ink)] tabular-nums">
            {score} / {total} ({percentage}%)
          </div>
          <p className="type-body-sm text-[var(--color-ink-secondary)]">
            {passedThreshold
              ? 'Strong mastery of sovereign capitals, currencies, and languages. Advance to the next region or review weak spots.'
              : 'Review the reference cards above and retake this set to cross the 70% mastery mark.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button variant="primary" size="md" onClick={onNextScope}>
            <span>{nextScopeLabel}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="md" onClick={onRetake}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Retake</span>
          </Button>
        </div>

        {onClearProgress && (
          <div className="pt-3 border-t border-[var(--color-border)] flex justify-center">
            <button
              type="button"
              onClick={onClearProgress}
              className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-semibold text-[var(--color-danger-ink)] hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear my saved quiz progress</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

