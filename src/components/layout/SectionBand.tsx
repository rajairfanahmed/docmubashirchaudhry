import React from 'react';
import { PageContainer, type ContainerSize } from '@/components/layout/PageContainer';
import { cn } from '@/lib/utils';

export type SectionSurface = 'ground' | 'muted' | 'card' | 'hero' | 'emerald' | 'trust' | 'footer' | 'mcq-sheet';
export type SectionDensity = 'compact' | 'standard' | 'spacious';

export interface SectionBandProps {
  id?: string;
  surface?: SectionSurface;
  size?: ContainerSize;
  density?: SectionDensity;
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

const SURFACE_CLASSES: Record<SectionSurface, string> = {
  ground: 'bg-[var(--color-page)]',
  muted: 'bg-[var(--color-surface-soft)] border-y border-[var(--color-border)]',
  card: 'bg-[var(--color-surface)] border-y border-[var(--color-border)]',
  hero: 'bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[var(--color-ink)]',
  emerald: 'bg-[var(--color-dark-surface-raised)] text-[var(--color-dark-ink)] border-y border-[var(--color-dark-border)]',
  trust: 'bg-[var(--color-success-bg)] border-y border-[var(--color-success-border)]',
  footer: 'bg-[var(--color-dark-surface)] text-[var(--color-dark-ink-secondary)]',
  'mcq-sheet': 'bg-[var(--color-surface-soft)] border-y border-[var(--color-border)]'
};

const DENSITY_CLASSES: Record<SectionDensity, string> = {
  compact: 'py-5 sm:py-6',
  standard: 'py-8 sm:py-10 lg:py-14',
  spacious: 'py-10 sm:py-12 lg:py-16'
};

/**
 * Step 3 Structural Section Band.
 * Enforces consistent surface alternation, full-bleed background framing, and contained horizontal rhythm.
 */
export function SectionBand({
  id,
  surface = 'ground',
  size = 'wide',
  density = 'standard',
  labelledBy,
  ariaLabel,
  className,
  containerClassName,
  children
}: SectionBandProps) {
  const isDarkSurface = surface === 'emerald' || surface === 'footer';

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      data-dmc-surface={isDarkSurface ? 'dark' : undefined}
      className={cn(SURFACE_CLASSES[surface], DENSITY_CLASSES[density], className)}
    >
      <PageContainer size={size} className={containerClassName}>
        {children}
      </PageContainer>
    </section>
  );
}

