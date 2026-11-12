import React from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  icon: Icon = Inbox,
  primaryAction,
  secondaryAction,
  className
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 sm:p-8 text-center space-y-4 elevation-1',
        className
      )}
    >
      <div className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-ink-muted)] flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5 max-w-lg mx-auto">
        <h3 className="type-card-title text-[var(--color-ink)]">{title}</h3>
        <p className="type-body-sm text-[var(--color-ink-secondary)]">{description}</p>
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {primaryAction &&
            (primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs sm:text-sm font-semibold transition-colors"
              >
                {primaryAction.label}
              </Link>
            ) : (
              <Button variant="primary" size="md" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] text-xs sm:text-sm font-semibold transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <Button variant="secondary" size="md" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

