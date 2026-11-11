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
  ground: 'bg-[var(--dmc-surface-ground)]',
  muted: 'bg-[var(--dmc-surface-muted)] border-y border-[var(--dmc-border-subtle)]',
  card: 'bg-[var(--dmc-surface-card)] border-y border-[var(--dmc-border-subtle)]',
  hero: 'hero-gradient text-white',
  emerald: 'bg-[var(--dmc-brand-forest)] text-white',
  trust: 'bg-[var(--dmc-status-verified-bg)] border-y border-[var(--dmc-status-verified-border)]/40',
  footer: 'bg-[var(--dmc-brand-footer)] text-slate-300',
  'mcq-sheet': 'mcq-sheet-surface border-y border-[var(--dmc-border-subtle)]'
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
  const isDarkSurface = surface === 'hero' || surface === 'emerald' || surface === 'footer';

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

