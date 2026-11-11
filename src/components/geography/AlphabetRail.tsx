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
      className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-3 border-t border-[var(--dmc-border-subtle)]"
    >
      <button
        type="button"
        aria-pressed={selectedLetter === ''}
        onClick={() => onSelectLetter('')}
        className={cn(
          'dmc-press min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center justify-center',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dmc-brand-forest)]',
          selectedLetter === ''
            ? 'bg-[var(--dmc-brand-forest)] text-white'
            : 'bg-slate-100 text-[var(--dmc-ink-secondary)] hover:bg-slate-200 hover:text-[var(--dmc-ink-primary)]'
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
              'dmc-press min-w-[44px] min-h-[44px] px-2 py-2 rounded-lg text-xs font-bold cursor-pointer tabular-nums inline-flex items-center justify-center',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dmc-brand-forest)]',
              isSelected
                ? 'bg-[var(--dmc-brand-forest)] text-white'
                : isEmpty
                  ? 'bg-slate-50 text-[var(--dmc-ink-muted)] opacity-50 hover:opacity-80'
                  : 'bg-slate-100 text-[var(--dmc-ink-primary)] hover:bg-emerald-50 hover:text-[var(--dmc-brand-forest)]'
            )}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}

