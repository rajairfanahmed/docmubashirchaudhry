import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

export function PreFooterCta() {
  return (
    <section
      aria-labelledby="prefooter-cta-heading"
      data-dmc-surface="dark"
      className="bg-[var(--color-dark-surface-raised)] text-[var(--color-dark-ink)] py-12 sm:py-14 border-t border-[var(--color-dark-border)]"
    >
      <PageContainer size="reading" className="text-center space-y-5">
        <div className="text-xs font-semibold tracking-wide text-[var(--color-accent)]">
          Open Reference Guides &amp; Saved Student Quizzes
        </div>
        <h2 id="prefooter-cta-heading" className="type-section-heading text-[var(--color-dark-ink)]">
          Test Your Recall Under Real Exam Discipline
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-dark-ink-secondary)] max-w-xl mx-auto">
          Practice bilingual subject quizzes or full timed PPSC &amp; FPSC mocks with saved
          attempt history, plus solved watermarked PDFs in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:opacity-95 font-semibold text-sm transition-opacity"
          >
            <span>Explore Quizzes &amp; Mocks</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/geography#quiz-module"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] text-[var(--color-dark-ink)] hover:bg-white/10 border border-[var(--color-dark-ink-secondary)]/35 font-semibold text-sm transition-colors"
          >
            <span>Geography Practice</span>
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] text-[var(--color-dark-ink)] hover:bg-white/10 border border-[var(--color-dark-ink-secondary)]/35 font-semibold text-sm transition-colors"
          >
            <span>Browse PDF Library</span>
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}
