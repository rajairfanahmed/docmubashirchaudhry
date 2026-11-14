import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileCheck, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Use & Academic Service Agreement',
  description:
    'Review the terms of use, academic fair use, independent disclaimer, and user account guidelines for docmubashirchaudhary.',
  path: '/terms'
});

export default function TermsPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="terms-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Terms of Use' }]} currentPath="/terms" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
              OPEN ACADEMIC ACCESS &middot; FAIR USE GUIDELINES
            </span>
            <h1 id="terms-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Terms of Use &amp; Service Agreement
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Terms governing the use of learning resources, past paper booklets, and timed mock examination modules on docmubashirchaudhary.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="terms-details">
        <div className="space-y-6">
          <h2 id="terms-details" className="sr-only">
            Terms of Use Sections
          </h2>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              <span>1. Independent Educational Status</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              docmubashirchaudhary is an independent, non-commercial educational portal curated by Dr. Mubashir Chaudhry. This platform is not affiliated with, endorsed by, or representing the Punjab Public Service Commission (PPSC), Federal Public Service Commission (FPSC), National Testing Service (NTS), or any provincial or federal government authority. Official commission gazettes and notices remain the sole legal authority for syllabus schedules, candidate eligibility, and official examination results.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <BookOpen className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>2. Fair Personal &amp; Academic Use</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              All learning articles, country geography profiles, practice questions, and solved past paper booklets are provided free of charge for individual study and examination preparation. Content may not be redistributed for commercial sale, packaged into paid test series, or reproduced on monetization platforms without explicit attribution and permission.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <UserCheck className="w-4 h-4 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              <span>3. User Accounts &amp; Conduct</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Users may create a free account to store timed quiz attempts and access verified PDF downloads. Users agree to provide valid credentials and refrain from abusive behavior, automated scraping, denial-of-service attempts, or circumventing rate limits. Users have the absolute right to delete their account and associated profile records at any time from their account settings.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <FileCheck className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>4. Curatorial Accuracy &amp; Corrections</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              While every past paper question, answer key, and syllabus summary is curated with rigorous academic standards, candidates are advised to verify evolving legal and constitutional amendments. If you detect any typographical or factual error, please submit a report through our{' '}
              <Link href="/corrections" className="text-[var(--dmc-brand-emerald)] font-semibold hover:underline">
                Corrections Channel
              </Link>{' '}
              or report the specific question during a quiz attempt.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <ShieldCheck className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>5. Zero Advertisements &amp; No Paywalls</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              In accordance with our core founding charter, docmubashirchaudhary guarantees zero third-party commercial advertisements, zero subscription fees, and no gated paywalls on primary academic syllabus materials.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold">
              <Link href="/privacy" className="text-[var(--dmc-brand-emerald)] hover:underline">
                Privacy Policy
              </Link>
              <Link href="/copyright" className="text-[var(--dmc-brand-emerald)] hover:underline">
                Copyright Notice
              </Link>
              <Link href="/about" className="text-[var(--dmc-brand-emerald)] hover:underline">
                About the Portal
              </Link>
            </div>
          </article>
        </div>
      </SectionBand>
    </>
  );
}
