import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

export interface StandingTrustNoticeProps {
  variant?: 'bar' | 'band';
  className?: string;
}

/**
 * Mandatory independence and open-reference transparency statement.
 * `bar` sits cleanly beneath the sticky Navbar; `band` anchors the bottom content zone.
 */
export function StandingTrustNotice({
  variant = 'bar',
  className = ''
}: StandingTrustNoticeProps) {
  if (variant === 'bar') {
    return (
      <div
        role="region"
        aria-label="Independence and open-access notice"
        className={`bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border-b border-[var(--color-border)] ${className}`}
      >
        <PageContainer className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-xs">
          <p className="flex items-center gap-2 font-medium text-[var(--color-ink-secondary)] leading-snug">
            <ShieldCheck className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
            <span>
              Independent educational platform &middot; not affiliated with PPSC, FPSC, NTS, or
              any commission. Always verify official test updates.
            </span>
          </p>
          <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-ink-secondary)] shrink-0">
            <span>
              Open Reference Guides &middot; Free Sign-In for Quizzes &amp; PDFs
            </span>
            <Link
              href="/methodology"
              className="font-semibold text-[var(--color-brand-deep)] underline-offset-2 hover:underline whitespace-nowrap"
            >
              Methodology
            </Link>
            <Link
              href="/privacy"
              className="font-semibold text-[var(--color-brand-deep)] underline-offset-2 hover:underline whitespace-nowrap"
            >
              Privacy
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="standing-trust-heading"
      data-dmc-surface="dark"
      className={`bg-[var(--color-dark-surface-raised)] text-[var(--color-dark-ink)] py-10 sm:py-12 border-t border-[var(--color-dark-border)] ${className}`}
    >
      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-accent)]">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Open Reference Guides &middot; Free Student Account for Quizzes &amp; PDFs</span>
            </div>
            <h2 id="standing-trust-heading" className="type-card-title text-[var(--color-dark-ink)]">
              Transparent Preparation Without Advertising Clutter
            </h2>
            <p className="text-sm text-[var(--color-dark-ink-secondary)] leading-relaxed">
              Country profiles, World Geography references, and exam hub guides stay openly readable
              to everyone. Starting a timed quiz or downloading a watermarked study PDF prompts a
              quick free student sign-in so scores and booklets stay personal. This is an independent
              academic portal and has no official link to any commission.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/quizzes"
              className="px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:opacity-95 font-semibold text-xs sm:text-sm transition-opacity"
            >
              Browse Quizzes
            </Link>
            <Link
              href="/methodology"
              className="px-4 py-2.5 rounded-[var(--radius-control)] border border-[var(--color-dark-ink-secondary)]/40 text-[var(--color-dark-ink)] hover:bg-white/10 font-semibold text-xs sm:text-sm transition-colors"
            >
              Read Methodology
            </Link>
            <Link
              href="/privacy"
              className="px-4 py-2.5 rounded-[var(--radius-control)] border border-[var(--color-dark-ink-secondary)]/40 text-[var(--color-dark-ink)] hover:bg-white/10 font-semibold text-xs sm:text-sm transition-colors"
            >
              Privacy Notice
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
