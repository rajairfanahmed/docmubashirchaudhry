import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, EyeOff, Lock, RotateCcw } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { ClearSavedProgressControl } from '@/components/privacy/ClearSavedProgressControl';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy | Zero Tracking & Local Storage Explanation',
  description:
    'Learn why docmubashirchaudhry requires no accounts or tracking cookies, and how browser localStorage saves only your local quiz progress.',
  path: '/privacy'
});

export default function PrivacyPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="privacy-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Privacy' }]} currentPath="/privacy" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
              ZERO ADS &middot; ZERO ACCOUNTS
            </span>
            <h1 id="privacy-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Privacy &amp; Browser Local Storage Notice
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              No personal profiles, no analytics beacons, and clear disclosure of browser-side storage.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="privacy-details">
        <div className="space-y-6">
          <h2 id="privacy-details" className="sr-only">
            Privacy Practices and Local Storage Details
          </h2>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <EyeOff className="w-4 h-4" aria-hidden="true" />
              <span>1. Zero Tracking &amp; Zero User Accounts</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              docmubashirchaudhary does not ask you to create an account, enter an email address to download PDFs, or accept third-party advertising trackers. Page views and PDF downloads are never monetized through ad networks.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Database className="w-4 h-4 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              <span>2. What Browser localStorage Means</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              To remember your score and missed questions between browser refreshes during MCQ and World Geography quizzes, the site stores lightweight progress data inside your own device using standard browser `localStorage` (`dmc:v1:geography-quiz` and `dmc:v1:mcq`).
            </p>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              This storage remains strictly on your browser and is never uploaded to external databases or shared with any third party.
            </p>
          </article>

          <article
            id="privacy-clear-storage-slot"
            className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Lock className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>3. Clearing Your Saved Quiz Data</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              You can clear local quiz state directly below, via the &ldquo;Clear my progress&rdquo; control in the Geography quiz header bar, or by clearing site data in your browser settings.
            </p>
            <ClearSavedProgressControl />
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold">
              <Link
                href="/geography#quiz-module"
                className="inline-flex items-center gap-1.5 text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Go to Geography Quiz Progress Controls</span>
              </Link>
              <Link href="/accessibility" className="text-[var(--dmc-ink-muted)] hover:underline">
                Accessibility Statement
              </Link>
            </div>
          </article>
        </div>
      </SectionBand>
    </>
  );
}
