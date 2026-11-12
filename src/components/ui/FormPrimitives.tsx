import React from 'react';
import { cn } from '@/lib/utils';

export interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  helperText?: string;
  error?: string | null;
  dir?: 'ltr' | 'rtl';
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  id,
  label,
  required = false,
  optionalLabel,
  helperText,
  error,
  dir = 'ltr',
  className,
  children
}: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-semibold text-[var(--color-ink)]"
        >
          <span>{label}</span>
          {required && (
            <span className="text-[var(--color-danger-ink)] ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {optionalLabel && (
          <span className="text-[11px] font-medium text-[var(--color-ink-muted)]">
            {optionalLabel}
          </span>
        )}
      </div>

      <div dir={dir}>{children}</div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-[var(--color-danger-ink)]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-ink-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

const INPUT_BASE_CLASS =
  'w-full min-h-[44px] px-3.5 py-2.5 rounded-[var(--radius-control)] border bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-deep)] focus:border-[var(--color-brand-deep)] disabled:opacity-60 disabled:cursor-not-allowed';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { hasError = false, className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        INPUT_BASE_CLASS,
        hasError
          ? 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]/45'
          : 'border-[var(--color-border-strong)]',
        className
      )}
      {...props}
    />
  );
});

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { hasError = false, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        INPUT_BASE_CLASS,
        'min-h-[96px] py-2.5 leading-relaxed',
        hasError
          ? 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]/45'
          : 'border-[var(--color-border-strong)]',
        className
      )}
      {...props}
    />
  );
});

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField({ hasError = false, className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={hasError || undefined}
        className={cn(
          INPUT_BASE_CLASS,
          hasError
            ? 'border-[var(--color-danger-border)]'
            : 'border-[var(--color-border-strong)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('dmc-skeleton rounded-[var(--radius-control)]', className)}
    />
  );
}

