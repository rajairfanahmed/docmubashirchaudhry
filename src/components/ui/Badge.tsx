import React from 'react';
import { AlertTriangle, Archive, Calendar, Clock, Info, ShieldCheck } from 'lucide-react';
import type { VerificationStatus } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'prepare' | 'feature' | 'verified' | 'success' | 'error' | 'neutral';
  icon?: React.ReactNode;
}

const BADGE_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  prepare:
    'bg-amber-100 text-amber-900 text-xs font-bold tracking-wider uppercase px-3.5 py-1',
  feature:
    'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border border-[var(--dmc-status-verified-border)]/40 text-xs sm:text-sm px-3.5 py-1.5',
  verified:
    'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border border-[var(--dmc-status-verified-border)]/40 text-[11px] font-bold px-2.5 py-0.5 rounded-md',
  success:
    'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border border-[var(--dmc-status-verified-border)] text-xs font-bold px-2.5 py-0.5',
  error:
    'bg-[var(--dmc-status-error-bg)] text-[var(--dmc-status-error-ink)] border border-[var(--dmc-status-error-border)] text-xs font-bold px-2.5 py-0.5',
  neutral:
    'bg-slate-100 text-[var(--dmc-ink-secondary)] border border-[var(--dmc-border-subtle)] text-xs px-2.5 py-1'
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
    bg: 'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border-[var(--dmc-status-verified-border)]/50',
    defaultLabel: 'Verified',
    Icon: ShieldCheck
  },
  unverified: {
    bg: 'bg-[var(--dmc-status-unverified-bg)] text-[var(--dmc-status-unverified-ink)] border-[var(--dmc-status-unverified-border)]/60',
    defaultLabel: 'Unverified - Pending Official Check',
    Icon: AlertTriangle
  },
  disputed: {
    bg: 'bg-[var(--dmc-status-disputed-bg)] text-[var(--dmc-status-disputed-ink)] border-[var(--dmc-status-disputed-border)]/50',
    defaultLabel: 'Disputed Field',
    Icon: AlertTriangle
  },
  outdated: {
    bg: 'bg-[var(--dmc-status-archived-bg)] text-[var(--dmc-status-archived-ink)] border-[var(--dmc-status-archived-border)]',
    defaultLabel: 'Outdated Notice',
    Icon: Clock
  },
  archived: {
    bg: 'bg-[var(--dmc-status-archived-bg)] text-[var(--dmc-status-archived-ink)] border-[var(--dmc-status-archived-border)]',
    defaultLabel: 'Archived',
    Icon: Archive
  },
  editorial: {
    bg: 'bg-[var(--dmc-status-editorial-bg)] text-[var(--dmc-status-editorial-ink)] border-[var(--dmc-status-editorial-border)]',
    defaultLabel: 'Platform recommendation, not official',
    Icon: Info
  },
  open: {
    bg: 'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] border-[var(--dmc-status-verified-border)]/50',
    defaultLabel: 'Open',
    Icon: Calendar
  },
  closed: {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    defaultLabel: 'Closed',
    Icon: Clock
  },
  upcoming: {
    bg: 'bg-sky-50 text-sky-900 border-sky-200',
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
