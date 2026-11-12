'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface AlphabetRailProps {
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;
  letterCounts?: Record<string, number>;
}

export function AlphabetRail({
  selectedLetter,
  onSelectLetter,
  letterCounts
}: AlphabetRailProps) {
  return (
    <nav
      aria-label="Filter countries by starting letter"
      className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-3 border-t border-[var(--color-border)]"
    >
      <button
        type="button"
        aria-pressed={selectedLetter === ''}
        onClick={() => onSelectLetter('')}
        className={cn(
          'dmc-press min-w-[44px] min-h-[44px] px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold cursor-pointer inline-flex items-center justify-center',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-deep)]',
          selectedLetter === ''
            ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
            : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-ink)]'
        )}
      >
        All
      </button>

      {LETTERS.map((letter) => {
        const count = letterCounts ? letterCounts[letter] ?? 0 : undefined;
        const isSelected = selectedLetter === letter;
        const isEmpty = count === 0;

        return (
          <button
            key={letter}
            type="button"
            aria-pressed={isSelected}
            aria-label={
              count !== undefined
                ? `Letter ${letter} (${count} countr${count === 1 ? 'y' : 'ies'})`
                : `Letter ${letter}`
            }
            onClick={() => onSelectLetter(letter)}
            className={cn(
              'dmc-press min-w-[44px] min-h-[44px] px-2 py-2 rounded-[var(--radius-control)] text-xs font-semibold cursor-pointer tabular-nums inline-flex items-center justify-center',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand-deep)]',
              isSelected
                ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                : isEmpty
                  ? 'bg-[var(--color-surface-soft)] border border-dashed border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]'
                  : 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] hover:bg-[var(--color-border)] hover:text-[var(--color-brand-deep)]'
            )}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}

