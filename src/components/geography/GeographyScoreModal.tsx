'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Award, RotateCcw, Trash2, Trophy } from 'lucide-react';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen || !passedThreshold || prefersReducedMotion) return;

    try {
      confetti({
        particleCount: 28,
        spread: 60,
        startVelocity: 30,
        ticks: 140,
        origin: { y: 0.6 },
        colors: ['#10B981', '#0D4A28', '#F0B938', '#FEF08A'],
        disableForReducedMotion: true
      });
    } catch {
      // Ignore confetti failures in non-canvas environments
    }

    const stopTimer = window.setTimeout(() => {
      try {
        confetti.reset();
      } catch {
        // Ignore cleanup failures
      }
    }, 1400);

    return () => {
      window.clearTimeout(stopTimer);
      try {
        confetti.reset();
      } catch {
        // Ignore cleanup failures
      }
    };
  }, [isOpen, passedThreshold, prefersReducedMotion]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Geography Quiz Results">
      <div className="space-y-6 text-center">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${
            passedThreshold
              ? 'bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] border-[var(--dmc-highlight-border)]'
              : 'bg-[var(--dmc-surface-muted)] text-[var(--dmc-brand-forest)] border-[var(--dmc-border-subtle)]'
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dmc-highlight-bg)] border border-[var(--dmc-accent-gold)] text-[var(--dmc-highlight-ink)] text-xs font-extrabold">
              <span>{prefersReducedMotion ? '70%+ Mastery Achieved' : 'Milestone Achieved! (70%+ Score)'}</span>
            </div>
          )}

          <div className="text-3xl font-extrabold text-[var(--dmc-ink-primary)] tabular-nums">
            {score} / {total} ({percentage}%)
          </div>
          <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
            {passedThreshold
              ? 'Strong mastery of sovereign capitals, currencies, and languages. Advance to the next region or review weak spots.'
              : 'Review the reference cards above and retake this set to cross the 70% mastery mark.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button variant="forest" size="md" onClick={onNextScope}>
            <span>{nextScopeLabel}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="gold" size="md" onClick={onRetake}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Retake</span>
          </Button>
        </div>

        {onClearProgress && (
          <div className="pt-3 border-t border-[var(--dmc-border-subtle)] flex justify-center">
            <button
              type="button"
              onClick={onClearProgress}
              className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-semibold text-[var(--dmc-status-error-ink)] hover:underline cursor-pointer"
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

