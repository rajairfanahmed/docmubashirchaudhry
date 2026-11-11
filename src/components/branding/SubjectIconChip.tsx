import React from 'react';
import {
  BookOpen,
  BookOpenCheck,
  Calculator,
  Cpu,
  Feather,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Trophy,
  type LucideIcon
} from 'lucide-react';
import { SUBJECT_ICON_CATALOG } from '@/lib/branding/logos';
import { cn } from '@/lib/utils';
import type { SubjectIconChipProps } from './types';

const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Landmark,
  BookOpenCheck,
  FlaskConical,
  Languages,
  Feather,
  Calculator,
  Cpu,
  Trophy
};

/**
 * Semantic subject icon/flag badge mapping taxonomy subject IDs to Lucide glyphs or flag SVG.
 */
export function SubjectIconChip({
  subjectId,
  label,
  size = 'md',
  iconOnly = false,
  inheritColor = false,
  className
}: SubjectIconChipProps) {
  const meta = SUBJECT_ICON_CATALOG[subjectId];
  const Icon = (meta?.iconName ? ICON_MAP[meta.iconName] : undefined) ?? BookOpen;
  const displayLabel = label ?? meta?.badgeLabel ?? subjectId;

  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0 max-w-full', className)}>
      {meta?.iconUrl ? (
        <img
          src={meta.iconUrl}
          alt={iconOnly ? '' : displayLabel}
          loading="lazy"
          decoding="async"
          className={cn(
            'rounded-xs object-cover shrink-0 border border-[var(--dmc-border-subtle)]',
            size === 'sm' ? 'h-3.5 w-5' : 'h-4 w-6'
          )}
        />
      ) : (
        <Icon
          strokeWidth={1.75}
          className={cn(
            'shrink-0',
            !inheritColor && 'text-[var(--dmc-brand-forest)]',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )}
          aria-hidden="true"
        />
      )}
      {!iconOnly && <span className="font-semibold min-w-0 break-words text-left leading-snug">{displayLabel}</span>}
    </span>
  );
}

