import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import { AcademicFeedbackForm } from '@/components/about/AcademicFeedbackForm';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Report a Correction | Error & Errata Submission',
  description:
    'Help keep exam dates, syllabus citations, MCQ answer keys, and country facts accurate by reporting errors by email or quick form.',
  path: '/corrections'
});

export default function CorrectionsPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="corrections-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Corrections' }]} currentPath="/corrections" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-amber-50 text-amber-900 border border-amber-200">
              OPEN ACADEMIC ERRATA
            </span>
            <h1 id="corrections-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Report an Error or Update
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Spot an outdated recruitment deadline, incorrect MCQ distractor explanation, or changed country capital? Email our editorial desk directly.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="corrections-guide">
        <div className="space-y-6">
          <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-4">
            <h2 id="corrections-guide" className="type-card-title text-[var(--dmc-ink-primary)]">
              Email Our Editorial Review Team
            </h2>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Send corrections directly via email and include:
            </p>
            <ul className="space-y-2 text-sm text-[var(--dmc-ink-primary)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>The exact page URL (for example `/ppsc/intelligent-officer` or `/geography/pakistan`)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>The specific statement, date, MCQ option, or PDF page number needing review</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0 mt-0.5" aria-hidden="true" />
                <span>A primary official URL or gazette screenshot supporting the correction</span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href="mailto:corrections@docmubashirchaudhary.com?subject=Content%20Correction%20Report"
                className="inline-flex items-center gap-2 bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>corrections@docmubashirchaudhary.com</span>
              </a>
            </div>
          </div>

          <AcademicFeedbackForm />

          <div className="text-xs text-[var(--dmc-ink-muted)] text-center">
            For formal licensing or removal requests, see{' '}
            <Link href="/copyright" className="font-bold text-[var(--dmc-brand-emerald)] hover:underline">
              Copyright &amp; Takedown Policy
            </Link>
            .
          </div>
        </div>
      </SectionBand>
    </>
  );
}
