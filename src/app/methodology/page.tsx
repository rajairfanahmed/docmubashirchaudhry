import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileCheck2, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Verification Methodology | How Content Is Checked',
  description:
    'Learn how docmubashirchaudhry verifies official exam notices, separates editorial study recommendations from commission facts, and validates country profiles.',
  path: '/methodology'
});

export default function MethodologyPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="methodology-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Methodology' }]} currentPath="/methodology" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
              PROVENANCE &amp; VERIFICATION STANDARD
            </span>
            <h1 id="methodology-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Content Verification Methodology
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Every recruitment post record, country fact, MCQ, and PDF booklet carries explicit epistemic verification metadata.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="methodology-sections">
        <div className="space-y-6">
          <h2 id="methodology-sections" className="sr-only">
            Verification Principles
          </h2>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>1. Four Verification States</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Records across the platform are explicitly flagged as <strong>Verified</strong> (cross-checked against primary commission gazettes or UN/ISO datasets), <strong>Unverified</strong> (derived from secondary summaries pending primary PDF review), <strong>Disputed</strong> (subject to conflicting jurisdictional or court guidance), or <strong>Outdated</strong>.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>2. Official Rules vs Editorial Plans</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Exam commissions frequently release broad syllabus outlines without numeric marks breakdowns per topic. Whenever official percentages are absent, our schemas set `officialMarksPct` to `null` and keep our faculty preparation hours inside an isolated box marked <em>&ldquo;Platform recommendation, not official.&rdquo;</em>
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <FileCheck2 className="w-4 h-4" aria-hidden="true" />
              <span>3. PDF Integrity &amp; Automated Validation</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Before any build completes, our data validator verifies file existence on disk, exact byte sizes, 64-character SHA-256 checksums, valid slug references, and full quiz coverage against our schema rules.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Shield className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>See Live Dataset Telemetry</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)]">
              Inspect current counts of verified records or submit a source correction directly.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <Link href="/status" className="text-[var(--dmc-brand-emerald)] hover:underline">
                View System Status &amp; Record Counts
              </Link>
              <Link href="/corrections" className="text-[var(--dmc-brand-emerald)] hover:underline">
                Report an Error
              </Link>
            </div>
          </article>
        </div>
      </SectionBand>
    </>
  );
}
