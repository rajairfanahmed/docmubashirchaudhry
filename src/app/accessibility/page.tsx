import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, CheckCircle2, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Accessibility Statement (WCAG 2.2 AA)',
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
                  <strong className="text-[var(--dmc-ink-primary)]">High-Contrast Answer Pills:</strong> Correct answers and Geography reference facts use <code className="font-mono text-xs">#FEF08A</code> surfaces paired with <code className="font-mono text-xs">#78350F</code> text (exceeding WCAG AAA 7:1 contrast).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Icon + Text Outcome Feedback:</strong> Correct and incorrect quiz selections preserve keyboard focus after locking, combine color cues with check/cross icons and screen-reader labels, and announce verdicts politely via live regions.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Reduced Motion Support:</strong> Celebration badges and scroll reveals honor <code className="font-mono text-xs">prefers-reduced-motion: reduce</code> with static achievement states.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-[var(--dmc-ink-primary)]">Keyboard Landmarks, Search &amp; Dialog Isolation:</strong> Every page includes a skip-to-content link, surface-calibrated focus rings, keyboard-navigable search comboboxes and <code className="font-mono text-xs">/search</code> category tabs (<code className="font-mono text-xs">ArrowLeft</code>/<code className="font-mono text-xs">ArrowRight</code>/<code className="font-mono text-xs">Home</code>/<code className="font-mono text-xs">End</code>), and focus-trapped dialogs with <code className="font-mono text-xs">inert</code> background isolation.
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
                className="inline-flex items-center gap-2 min-h-[44px] text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>accessibility@docmubashirchaudhary.com</span>
              </a>
              <Link
                href="/status"
                className="inline-flex items-center min-h-[44px] text-xs font-semibold text-[var(--dmc-ink-muted)] hover:text-[var(--dmc-ink-primary)] hover:underline"
              >
                View Dataset Status
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
