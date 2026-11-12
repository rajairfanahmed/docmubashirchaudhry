import React from 'react';
import Link from 'next/link';
import { Globe, ArrowRight, CheckCircle2, Download } from 'lucide-react';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';

export function SubjectCards() {
  return (
    <section aria-labelledby="pillars-gateway-heading" className="space-y-6 pt-4">
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <span className="type-label-micro text-[var(--color-brand-deep)]">
          Core Preparation Tracks
        </span>
        <h2 id="pillars-gateway-heading" className="type-section-heading text-[var(--color-ink)]">
          Choose Your Target Examination Track
        </h2>
        <p className="type-supporting text-[var(--color-ink-secondary)] leading-relaxed">
          Access verified geographical datasets or download solved civil service MCQ booklets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Pillar 1: World Countries Module */}
        <article className="track-card flex flex-col justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 sm:p-8 elevation-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] flex items-center justify-center">
                <Globe className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)] px-2.5 py-0.5 rounded-full">
                Interactive Module
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--color-ink)]">
                World Countries, Capitals &amp; Currencies
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] mt-2 leading-relaxed">
                Verified reference directory of world nations paired with a synchronized self-test quiz assessing capitals, currencies, and official languages.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-ink-secondary)] pt-2 border-t border-[var(--color-border)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success-ink)] shrink-0" aria-hidden="true" />
                <span>250 Verified Nations &amp; Territories</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success-ink)] shrink-0" aria-hidden="true" />
                <span>Synchronized Fact Scanning &amp; Recall Quiz</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success-ink)] shrink-0" aria-hidden="true" />
                <span>Clear Source Status &amp; Answer Explanations</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-auto">
            <Link
              href="/geography"
              className="dmc-press group inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] font-semibold text-sm py-3 px-4 rounded-[var(--radius-control)] elevation-1 cursor-pointer"
            >
              <span>Open Geography Module</span>
              <ArrowRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </Link>
          </div>
        </article>

        {/* Pillar 2: PPSC Exam Preparation */}
        <article className="track-card flex flex-col justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 sm:p-8 elevation-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CommissionBrandBadge examCodeOrSlug="ppsc" size="lg" />
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                Solved PDF Booklets
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--color-ink)]">
                PPSC Exam Preparation Booklets
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] mt-2 leading-relaxed">
                Verified PPSC post provenance and SHA-256 checksummed solved MCQ PDF booklets curated by Doc Mubashir Chaudhry.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-ink-secondary)] pt-2 border-t border-[var(--color-border)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                <span>Intelligence Officer &amp; Traffic Sergeant PDF Sets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                <span>Direct Official PPSC Provenance Citations</span>
              </li>
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                <span>Verified PDF Booklet Downloads</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-auto">
            <Link
              href="/ppsc"
              className="dmc-press group inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-deep)] text-[var(--color-ink)] font-semibold text-sm py-3 px-4 rounded-[var(--radius-control)] cursor-pointer"
            >
              <span>Explore PPSC Posts &amp; Booklets</span>
              <ArrowRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
