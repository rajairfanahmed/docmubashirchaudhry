import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, CheckCircle2, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Accessibility Statement | WCAG 2.2 AA Standards',
  description:
    'Accessibility commitment across keyboard navigation, screen reader semantics, high-contrast pills, and reduced motion preferences.',
  path: '/accessibility'
});

export default function AccessibilityPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="a11y-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Accessibility' }]} currentPath="/accessibility" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
              <Accessibility className="w-3 h-3 mr-1" aria-hidden="true" />
              WCAG 2.2 AA STANDARD
            </span>
            <h1 id="a11y-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Accessibility Commitment
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Designed to remain legible, keyboard-navigable, and usable across assistive technologies and low-bandwidth mobile devices.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="a11y-measures">
        <div className="space-y-6">
          <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-4">
            <h2 id="a11y-measures" className="type-card-title text-[var(--dmc-ink-primary)]">
              Implemented Accessibility Measures
            </h2>
            <ul className="space-y-3 text-sm text-[var(--dmc-ink-secondary)]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">High-Contrast Answer Pills:</strong> Correct answers and Geography reference facts use `#FEF08A` surfaces paired with `#78350F` text (exceeding 10:1 contrast).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Icon + Text Outcome Feedback:</strong> Correct and incorrect quiz selections always combine color cues with check/cross icons and screen-reader labels rather than relying on color alone.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Reduced Motion Support:</strong> Celebration badges automatically render static achievement states when `prefers-reduced-motion: reduce` is enabled.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Keyboard Landmarks &amp; Skip Link:</strong> Every page includes a keyboard skip-to-content link, sequential headings (`h1` to `h3`), and descriptive `alt` text on national flags.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <h3 className="font-bold text-base text-[var(--dmc-ink-primary)]">Report an Accessibility Barrier</h3>
            <p className="text-sm text-[var(--dmc-ink-secondary)]">
              Encountered a keyboard trap, screen-reader announcement gap, or unreadable table on mobile? Let us know by email.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="mailto:accessibility@docmubashirchaudhary.com?subject=Accessibility%20Feedback"
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>accessibility@docmubashirchaudhary.com</span>
              </a>
              <Link href="/status" className="text-xs font-semibold text-[var(--dmc-ink-muted)] hover:underline">
                View Dataset Status
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
