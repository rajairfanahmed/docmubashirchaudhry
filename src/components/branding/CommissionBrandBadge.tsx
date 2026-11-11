'use client';

import React, { useState } from 'react';
import { getExamBranding } from '@/lib/branding/logos';
import { cn } from '@/lib/utils';
import type { CommissionBrandBadgeProps } from './types';

const SIZE_CLASSES: Record<NonNullable<CommissionBrandBadgeProps['size']>, string> = {
  sm: 'h-9 w-9 text-[10px]',
  md: 'h-11 w-11 text-[11px]',
  lg: 'h-12 w-12 text-xs'
};

/**
 * Official commission emblem badge using Logo.dev CDN URLs with clean monogram fallback.
 */
export function CommissionBrandBadge({
  examCodeOrSlug,
  size = 'md',
  showLabel = false,
  className
}: CommissionBrandBadgeProps) {
  const branding = getExamBranding(examCodeOrSlug);
  const [imageFailed, setImageFailed] = useState(false);

  const monogram = branding?.fallbackMonogram ?? examCodeOrSlug.toUpperCase().slice(0, 5);
  const label = branding?.code ?? monogram;
  const shouldRenderLogo = Boolean(branding?.logoUrl && !imageFailed);

  return (
    <span className={cn('inline-flex items-center gap-2.5 shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-xl border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-card)] elevation-1 font-extrabold tracking-tight overflow-hidden shrink-0',
          SIZE_CLASSES[size]
        )}
        title={branding?.title ?? label}
      >
        {shouldRenderLogo && branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={`${branding.title} official emblem`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="h-full w-full flex items-center justify-center bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] px-1"
          >
            {monogram}
          </span>
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--dmc-ink-primary)]">
          {label}
        </span>
      )}
    </span>
  );
}

