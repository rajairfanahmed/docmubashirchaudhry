import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

export function PreFooterCta() {
  return (
    <section
      aria-label="Start Free Practice Call to Action"
      data-dmc-surface="dark"
      className="bg-[var(--dmc-brand-dark)] text-white py-12 border-t border-[var(--dmc-brand-emerald)]/50"
    >
      <PageContainer size="reading" className="text-center space-y-4">
        <h2 className="type-section-heading text-white">
          Start practicing now: free, no ads, no login
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/85 max-w-xl mx-auto leading-relaxed">
          Master sovereign capitals, currencies, languages, and competitive MCQ tracks across PPSC, CSS, PMS, FPSC, and NTS on docmubashirchaudhry.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/geography#quiz-module"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 bg-[var(--dmc-accent-gold)] text-[var(--dmc-ink-primary)] font-bold text-sm rounded-lg"
          >
            <span>Geography Interactive Quiz</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/mcq"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 border border-emerald-400/50 text-white font-semibold text-sm rounded-lg"
          >
            <span>Browse MCQ Practice</span>
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}
