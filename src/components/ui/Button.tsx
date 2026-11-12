'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'quiet'
    | 'destructive'
    | 'accent'
    | 'forest'
    | 'gold'
    | 'amber'
    | 'outline'
    | 'ghost'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[44px] sm:min-h-[38px] px-3.5 py-2 sm:py-1.5 text-xs gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-xs sm:text-sm gap-2',
  lg: 'min-h-[48px] px-7 py-3 text-sm sm:text-base gap-2.5'
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] active:bg-[var(--color-action)] text-[var(--color-action-ink)] shadow-xs',
  forest:
    'bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] active:bg-[var(--color-action)] text-[var(--color-action-ink)] shadow-xs',
  secondary:
    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-deep)]',
  outline:
    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-deep)]',
  tertiary:
    'bg-transparent hover:bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]',
  quiet:
    'bg-transparent hover:bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]',
  ghost:
    'bg-transparent hover:bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]',
  destructive:
    'bg-[var(--color-danger-bg)] hover:bg-red-100 text-[var(--color-danger-ink)] border border-[var(--color-danger-border)]',
  danger:
    'bg-[var(--color-danger-bg)] hover:bg-red-100 text-[var(--color-danger-ink)] border border-[var(--color-danger-border)]',
  accent:
    'bg-[var(--color-accent)] hover:brightness-95 text-[var(--color-accent-ink)] shadow-xs',
  gold:
    'bg-[var(--color-accent)] hover:brightness-95 text-[var(--color-accent-ink)] shadow-xs',
  amber:
    'bg-[var(--color-accent)] hover:brightness-95 text-[var(--color-accent-ink)] shadow-xs'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-[var(--radius-control)] transition-[transform,background-color,border-color,color,box-shadow,filter] duration-150 ease-out hover:-translate-y-[0.5px] active:translate-y-0 active:scale-[0.985] motion-reduce:transition-none motion-reduce:transform-none cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
        'disabled:opacity-50 disabled:pointer-events-none',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});
