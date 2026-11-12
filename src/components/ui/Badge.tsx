import React from 'react';
import { AlertTriangle, Archive, Calendar, Clock, Info, ShieldCheck } from 'lucide-react';
import type { VerificationStatus } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'prepare' | 'feature' | 'verified' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: React.ReactNode;
}

const BADGE_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  prepare:
    'bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border border-[var(--color-warning-border)] text-xs font-semibold tracking-wider uppercase px-3 py-1',
  feature:
    'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)] text-xs sm:text-sm px-3 py-1',
  verified:
    'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)] text-[11px] font-semibold px-2.5 py-0.5 rounded-md',
  success:
    'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)] text-xs font-semibold px-2.5 py-0.5',
  warning:
    'bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border border-[var(--color-warning-border)] text-xs font-semibold px-2.5 py-0.5',
  error:
    'bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] border border-[var(--color-danger-border)] text-xs font-semibold px-2.5 py-0.5',
  info:
    'bg-[var(--color-info-bg)] text-[var(--color-info-ink)] border border-[var(--color-info-border)] text-xs font-semibold px-2.5 py-0.5',
  neutral:
    'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border border-[var(--color-border)] text-xs px-2.5 py-1'
};

export function Badge({
  children,
  variant = 'neutral',
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors',
        BADGE_CLASSES[variant],
        className
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

export type EpistemicBadgeStatus =
  | VerificationStatus
  | 'open'
  | 'closed'
  | 'upcoming'
  | 'archived'
  | 'editorial';

export interface VerificationBadgeProps {
  status: EpistemicBadgeStatus;
  date?: string;
  label?: string;
  className?: string;
}

const EPISTEMIC_STYLES: Record<
  EpistemicBadgeStatus,
  { bg: string; defaultLabel: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  verified: {
    bg: 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border-[var(--color-success-border)]',
    defaultLabel: 'Verified',
    Icon: ShieldCheck
  },
  unverified: {
    bg: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border-[var(--color-warning-border)]',
    defaultLabel: 'Unverified - Pending Official Check',
    Icon: AlertTriangle
  },
  disputed: {
    bg: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)] border-[var(--color-warning-border)]',
    defaultLabel: 'Disputed Field',
    Icon: AlertTriangle
  },
  outdated: {
    bg: 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border-[var(--color-border-strong)]',
    defaultLabel: 'Outdated Notice',
    Icon: Clock
  },
  archived: {
    bg: 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border-[var(--color-border-strong)]',
    defaultLabel: 'Archived',
    Icon: Archive
  },
  editorial: {
    bg: 'bg-[var(--color-info-bg)] text-[var(--color-info-ink)] border-[var(--color-info-border)]',
    defaultLabel: 'Platform recommendation, not official',
    Icon: Info
  },
  open: {
    bg: 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border-[var(--color-success-border)]',
    defaultLabel: 'Open',
    Icon: Calendar
  },
  closed: {
    bg: 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border-[var(--color-border-strong)]',
    defaultLabel: 'Closed',
    Icon: Clock
  },
  upcoming: {
    bg: 'bg-[var(--color-info-bg)] text-[var(--color-info-ink)] border-[var(--color-info-border)]',
    defaultLabel: 'Upcoming',
    Icon: Calendar
  }
};

export function VerificationBadge({
  status,
  date,
  label,
  className
}: VerificationBadgeProps) {
  const config = EPISTEMIC_STYLES[status] ?? EPISTEMIC_STYLES.unverified;
  const Icon = config.Icon;
  const text = label ?? (date ? `${config.defaultLabel} · ${date}` : config.defaultLabel);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none',
        config.bg,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
