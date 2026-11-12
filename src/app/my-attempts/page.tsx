import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AttemptsHistoryClient } from '@/components/account/AttemptsHistoryClient';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Quiz Attempts',
  description: 'Personal student dashboard displaying your saved quiz and mock exam attempts.',
  path: '/my-attempts',
  index: false,
  follow: false
});

export default function MyAttemptsPage() {
  return (
    <div className="flex flex-col">
      <SectionBand
        surface="hero"
        density="compact"
        className="py-8"
      >
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: 'My Quiz Attempts' }]} currentPath="/my-attempts" />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
                Private Student History
              </span>
              <h1 id="my-attempts-heading" className="type-page-title text-[var(--color-ink)]">
                My Quiz Attempts
              </h1>
              <p className="type-supporting text-[var(--color-ink-secondary)] max-w-2xl">
                Review your private quiz scores, timed mock performance, and question accuracy over
                time. Results remain strictly visible to your account only.
              </p>
            </div>

            <Link
              href="/quizzes"
              className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold shrink-0"
            >
              <span>Attempt a Quiz</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="ground" className="py-8 sm:py-10">
        <AttemptsHistoryClient />
      </SectionBand>
    </div>
  );
}
