import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import type { CorrectionTriggerProps } from './types';
import { buildCorrectionMailtoUrl } from '@/lib/feedback/mailto';
import { cn } from '@/lib/utils';

export function CorrectionTrigger({
  referenceTitle,
  category = 'errata',
  label = 'Report a correction',
  className
}: CorrectionTriggerProps) {
  const href = buildCorrectionMailtoUrl({
    fullName: 'Reader',
    senderEmail: '',
    category,
    referenceTitle,
    message: `Correction noted regarding "${referenceTitle}":\n`
  });

  const webFormHref = `/corrections?ref=${encodeURIComponent(referenceTitle)}&category=${encodeURIComponent(category)}`;

  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs', className)}>
      <a
        href={href}
        className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold text-[var(--color-brand-deep)] hover:underline"
      >
        <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </a>
      <span className="text-[var(--color-ink-muted)]" aria-hidden="true">|</span>
      <Link
        href={webFormHref}
        className="inline-flex items-center min-h-[44px] font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-brand-deep)] hover:underline"
      >
        Use feedback form
      </Link>
    </div>
  );
}
