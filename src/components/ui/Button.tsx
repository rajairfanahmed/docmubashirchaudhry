'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'forest'
    | 'gold'
    | 'amber'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[44px] sm:min-h-[36px] px-3 py-2 sm:py-1.5 text-xs gap-1.5',
  md: 'min-h-[44px] px-5 py-2 text-xs sm:text-sm gap-2',
  lg: 'min-h-[48px] px-7 py-2.5 text-sm sm:text-base gap-2.5'
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] active:bg-[var(--dmc-brand-dark)] text-white shadow-xs',
  forest:
    'bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] active:bg-[var(--dmc-brand-dark)] text-white shadow-xs',
  gold:
    'bg-[var(--dmc-accent-gold)] hover:bg-[var(--dmc-accent-gold-hover)] text-[var(--dmc-ink-primary)] shadow-xs',
  amber:
    'bg-[var(--dmc-accent-gold)] hover:bg-[var(--dmc-accent-gold-hover)] text-[var(--dmc-ink-primary)] shadow-xs',
  secondary:
    'bg-[var(--dmc-status-verified-bg)] hover:bg-emerald-100 text-[var(--dmc-status-verified-ink)] border border-[var(--dmc-status-verified-border)]/40',
  outline:
    'bg-[var(--dmc-surface-card)] hover:bg-[var(--dmc-surface-muted)] text-[var(--dmc-ink-primary)] border border-[var(--dmc-border-strong)] hover:border-[var(--dmc-brand-forest)]',
  ghost:
    'bg-transparent hover:bg-slate-100 text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-ink-primary)]',
  danger:
    'bg-[var(--dmc-status-error-bg)] hover:bg-red-100 text-[var(--dmc-status-error-ink)] border border-[var(--dmc-status-error-border)]/50'
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
        'inline-flex items-center justify-center font-bold rounded-[var(--dmc-radius-button)] transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:scale-[0.985] motion-reduce:transition-none motion-reduce:transform-none cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dmc-brand-forest)]',
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
