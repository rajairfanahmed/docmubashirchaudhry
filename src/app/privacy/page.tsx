import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, EyeOff, Lock, RotateCcw, ShieldCheck, UserCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { ClearSavedProgressControl } from '@/components/privacy/ClearSavedProgressControl';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy & User Data Governance',
  description:
    'Learn how docmubashirchaudhary protects user privacy, uses Clerk for identity, Supabase for saved attempt scores, and Cloudflare R2 for watermarked downloads.',
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
              ZERO ADVERTISEMENTS &middot; STRICT DATA PRIVACY
            </span>
            <h1 id="privacy-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Privacy &amp; User Data Governance
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Transparent disclosure of identity management, user attempt records, secure watermarked PDF delivery, and browser storage.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="privacy-details">
        <div className="space-y-6">
          <h2 id="privacy-details" className="sr-only">
            Privacy Practices and Data Governance
          </h2>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <EyeOff className="w-4 h-4" aria-hidden="true" />
              <span>1. Zero Advertising Trackers &amp; No Data Monetization</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              docmubashirchaudhary does not display third-party advertisements, sell user data, or install cross-site tracking pixels. Your reading history, syllabus searches, and reference reviews are never monetized through commercial ad networks.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <UserCheck className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>2. User Accounts &amp; Authentication via Clerk</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              To save your timed mock exam attempts, track personal accuracy percentages, and access watermarked PDF past papers, the portal provides optional free user accounts managed through Clerk. Authentication credentials (including Google OAuth and password hashes) are securely processed by Clerk; our database never stores raw passwords.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Database className="w-4 h-4 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              <span>3. Relational Data Storage in Supabase PostgreSQL</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Your saved attempt scores, completion timestamps, question accuracy metrics, and downloaded booklet logs are stored in private PostgreSQL tables protected by Row Level Security (RLS). Your academic records are strictly private and accessible only to your account.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-brand-emerald)]">
              <ShieldCheck className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>4. Private Cloudflare R2 Storage for PDF Booklets</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              All PDF exam past papers and study notes are hosted inside private, non-public Cloudflare R2 buckets. Download links are short-lived, signed URLs generated per authenticated request to prevent unauthorized hotlinking.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Lock className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>5. Browser Local Storage &amp; Progress Reset</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              When attempting practice questions anonymously, your in-progress answers are cached locally in your browser storage (`dmc:v1:geography-quiz` and `dmc:v1:mcq`) so accidental reloads do not wipe your progress. You can reset local data at any time below.
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
