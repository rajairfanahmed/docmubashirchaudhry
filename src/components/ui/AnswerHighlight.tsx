import React from 'react';
import { cn } from '@/lib/utils';

export interface AnswerHighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  shape?: 'pill' | 'chip';
}

/**
 * High-Contrast Golden Answer Highlighter Pill / Overflow-Safe Chip
 * Golden background (#FEF08A) + deep amber-brown text (#78350F)
 * Providing a measured 7.80:1 contrast ratio conforming to WCAG 2.2 AAA.
 */
export function AnswerHighlight({
  children,
  shape = 'pill',
  className = '',
  ...props
}: AnswerHighlightProps) {
  if (shape === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-lg bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] border border-[var(--dmc-highlight-border)] font-bold px-2 py-0.5 leading-snug max-w-full break-words [overflow-wrap:anywhere]',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={cn('answer-highlight', className)} {...props}>
      {children}
    </span>
  );
}
