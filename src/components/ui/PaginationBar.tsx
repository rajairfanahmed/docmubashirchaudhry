'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  itemLabel?: string;
  className?: string;
}

type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildWindowedPages(current: number, total: number): PageToken[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const tokens: PageToken[] = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  if (windowStart > 2) {
    tokens.push('ellipsis-left');
  }
  for (let p = windowStart; p <= windowEnd; p += 1) {
    tokens.push(p);
  }
  if (windowEnd < total - 1) {
    tokens.push('ellipsis-right');
  }
  tokens.push(total);
  return tokens;
}

/**
 * Windowed pagination bar for Tier 1 Countries (24/page) & MCQ lists (20/page).
 */
export function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className
}: PaginationBarProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const clampedPage = Math.min(Math.max(1, page), safeTotalPages);

  const tokens = useMemo(
    () => buildWindowedPages(clampedPage, safeTotalPages),
    [clampedPage, safeTotalPages]
  );

  if (safeTotalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalItems);
  const hasPreviousPage = clampedPage > 1;
  const hasNextPage = clampedPage < safeTotalPages;

  return (
    <nav
      aria-label={`Pagination for ${itemLabel}`}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-[var(--color-border)]',
        className
      )}
    >
      <p className="text-xs text-[var(--color-ink-secondary)] tabular-nums text-center sm:text-left">
        Showing <strong className="text-[var(--color-ink)]">{startItem}-{endItem}</strong> of{' '}
        <strong className="text-[var(--color-ink)]">{totalItems}</strong> {itemLabel}
      </p>

      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
          className="dmc-press min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="ml-1">Prev</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
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

            const isCurrent = token === clampedPage;
            return (
              <button
                key={token}
                type="button"
                onClick={() => onPageChange(token)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${token}`}
                className={cn(
                  'dmc-press min-w-[44px] min-h-[44px] px-2.5 inline-flex items-center justify-center rounded-[var(--radius-control)] border text-xs font-semibold tabular-nums cursor-pointer',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                  isCurrent
                    ? 'border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-action-ink)] shadow-xs'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)]'
                )}
              >
                {token}
              </button>
            );
          })}
        </div>

        <span className="sm:hidden px-2.5 text-xs font-semibold text-[var(--color-ink)] tabular-nums">
          Page {clampedPage} of {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
          className="dmc-press min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

