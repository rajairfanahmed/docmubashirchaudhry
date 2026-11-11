import React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Globe, HelpCircle, Home, Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

export default function NotFound() {
  return (
    <PageContainer size="narrow" className="py-16">
      <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-8 text-center space-y-6 elevation-1">
        <div className="w-16 h-16 rounded-2xl bg-[var(--dmc-status-unverified-bg)] text-[var(--dmc-status-unverified-ink)] border border-[var(--dmc-status-unverified-border)]/40 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="type-label-micro text-[var(--dmc-status-unverified-ink)] bg-[var(--dmc-status-unverified-bg)] px-3 py-1 rounded-full inline-block">
            Error 404
          </span>
          <h1 className="type-page-title text-[var(--dmc-ink-primary)]">
            Study Resource Not Found
          </h1>
          <p className="type-body-sm text-[var(--dmc-ink-secondary)] max-w-md mx-auto">
            The requested exam guide, country profile, or PDF resource could not be located. Explore active modules or search the portal below.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[var(--dmc-brand-forest)] text-white text-sm font-bold"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Homepage</span>
          </Link>
          <Link
            href="/geography"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[var(--dmc-border-strong)] bg-white text-[var(--dmc-ink-primary)] text-sm font-semibold"
          >
            <Globe className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
            <span>World Geography</span>
          </Link>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[var(--dmc-border-strong)] bg-white text-[var(--dmc-ink-primary)] text-sm font-semibold"
          >
            <BookOpen className="w-4 h-4 text-[var(--dmc-accent-gold-hover)]" aria-hidden="true" />
            <span>Exam Hubs</span>
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[var(--dmc-border-strong)] bg-white text-[var(--dmc-ink-primary)] text-sm font-semibold"
          >
            <FileText className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
            <span>PDF Library</span>
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[var(--dmc-border-strong)] bg-white text-[var(--dmc-ink-primary)] text-sm font-semibold"
          >
            <Search className="w-4 h-4 text-[var(--dmc-ink-muted)]" aria-hidden="true" />
            <span>Search</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
