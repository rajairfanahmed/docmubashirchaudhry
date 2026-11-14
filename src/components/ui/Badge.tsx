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
    'bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold tracking-wider uppercase px-2.5 py-0.5',
  feature:
    'bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold px-2.5 py-0.5',
  verified:
    'bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md',
  success:
    'bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold px-2.5 py-0.5',
  warning:
    'bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold px-2.5 py-0.5',
  error:
    'bg-rose-100 text-rose-950 border border-rose-300 text-xs font-bold px-2.5 py-0.5',
  info:
    'bg-sky-100 text-sky-950 border border-sky-300 text-xs font-bold px-2.5 py-0.5',
  neutral:
    'bg-slate-100 text-slate-800 border border-slate-300 text-xs font-medium px-2.5 py-0.5'
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
