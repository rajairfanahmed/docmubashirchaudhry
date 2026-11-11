import React from 'react';
import Link from 'next/link';
import { Globe, ArrowRight, CheckCircle2, Download } from 'lucide-react';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';

export function SubjectCards() {
  return (
    <section aria-labelledby="pillars-gateway-heading" className="space-y-6 pt-4">
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <span className="pill-badge bg-amber-50 text-amber-800 border border-amber-200">
          CORE MASTER MODULES
        </span>
        <h2 id="pillars-gateway-heading" className="text-2xl sm:text-3xl font-extrabold text-[var(--dmc-ink-primary)] tracking-tight">
          Choose Your Target Examination Track
        </h2>
        <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
          Access verified geographical datasets or download solved civil service MCQ booklets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Pillar 1: World Countries Module */}
        <div className="track-card flex flex-col justify-between bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-6 sm:p-8 elevation-1 hover:border-[var(--dmc-brand-forest)] border-t-4 border-t-[var(--dmc-brand-forest)] group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] flex items-center justify-center group-hover:scale-105 transition-transform duration-150 motion-reduce:transform-none motion-reduce:transition-none">
                <Globe className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] px-2.5 py-0.5 rounded-full">
                Interactive Module
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--dmc-ink-primary)] group-hover:text-[var(--dmc-brand-forest)] transition-colors">
                World Countries, Capitals &amp; Currencies
              </h3>
              <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)] mt-2 leading-relaxed">
                Verified reference directory of world nations paired with a synchronized self-test quiz assessing capitals, currencies, and official languages.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[var(--dmc-ink-secondary)] pt-2 border-t border-[var(--dmc-border-subtle)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
                <span>250 Verified Nations &amp; Territories</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
                <span>Synchronized Fact Scanning &amp; Recall Quiz</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
                <span>Signature Gold Answer Highlighting (7.8:1 AAA Contrast)</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-auto">
            <Link
              href="/geography"
              className="dmc-press inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm py-3 px-4 rounded-xl elevation-1 cursor-pointer"
            >
              <span>Open Geography Module</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Pillar 2: PPSC Exam Preparation */}
        <div className="track-card flex flex-col justify-between bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-6 sm:p-8 elevation-1 hover:border-[var(--dmc-accent-gold)] border-t-4 border-t-[var(--dmc-accent-gold)] group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CommissionBrandBadge examCodeOrSlug="ppsc" size="lg" />
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] border border-[var(--dmc-highlight-border)] px-2.5 py-0.5 rounded-full">
                Solved PDF Booklets
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--dmc-ink-primary)] group-hover:text-[var(--dmc-brand-forest)] transition-colors">
                PPSC Exam Preparation Booklets
              </h3>
              <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)] mt-2 leading-relaxed">
                Verified PPSC post provenance and SHA-256 checksummed solved MCQ PDF booklets curated by Doc Mubashir Chaudhry.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[var(--dmc-ink-secondary)] pt-2 border-t border-[var(--dmc-border-subtle)]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Intelligence Officer &amp; Traffic Sergeant PDF Sets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Direct Official PPSC Provenance Citations</span>
              </li>
              <li className="flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>1-Click Verified PDF Booklet Downloads</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-auto">
            <Link
              href="/ppsc"
              className="dmc-press inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[var(--dmc-accent-gold)] hover:bg-[var(--dmc-accent-gold-hover)] text-[var(--dmc-ink-primary)] font-bold text-sm py-3 px-4 rounded-xl elevation-1 cursor-pointer"
            >
              <span>Explore PPSC Posts &amp; Booklets</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
