import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';

export interface StandingTrustNoticeProps {
  variant?: 'bar' | 'band';
  className?: string;
}

/**
 * Persistent standing platform disclosure required across all routes:
 * independent status (non-affiliated) + 100% free, zero ads, zero login.
 */
export function StandingTrustNotice({
  variant = 'bar',
  className
}: StandingTrustNoticeProps) {
  if (variant === 'bar') {
    return (
      <div
        role="region"
        aria-label="Standing Platform Notice"
        data-dmc-surface="dark"
        className={cn(
          'bg-[var(--dmc-brand-dark)] text-emerald-50 border-b border-[var(--dmc-brand-emerald)]/40 text-xs',
          className
        )}
      >
        <PageContainer className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <p className="flex items-center gap-2 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--dmc-accent-gold)] shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-white">Independent Educational Portal:</strong> Not affiliated with PPSC, FPSC, NTS, CSS/PMS, or any government commission.
            </span>
          </p>
          <p className="font-semibold text-[var(--dmc-accent-gold)] sm:shrink-0">
            100% Free &middot; No Ads &middot; No Login
          </p>
        </PageContainer>
      </div>
    );
  }

  return (
    <section
      aria-label="Free Access and Independence Notice"
      className={cn(
        'bg-[var(--dmc-status-verified-bg)] border-y border-[var(--dmc-status-verified-border)]/40 py-8',
        className
      )}
    >
      <PageContainer>
        <div className="rounded-2xl bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] p-4 sm:p-6 elevation-1 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          <div className="lg:col-span-8 space-y-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 type-label-micro text-[var(--dmc-status-verified-ink)] bg-[var(--dmc-status-verified-bg)] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Free, No Ads, No Signup</span>
            </div>
            <h2 className="type-section-heading text-[var(--dmc-ink-primary)] [overflow-wrap:anywhere]">
              Open Educational Resource Without Gatekeeping
            </h2>
            <p className="type-body-sm text-[var(--dmc-ink-secondary)] [overflow-wrap:anywhere]">
              Every quiz deck, syllabus breakdown, and verified PDF compilation is free to study and download without accounts, popups, or subscriptions.{' '}
              <strong className="break-words">docmubashirchaudhry is strictly independent and unaffiliated with any public service commission or testing body.</strong>
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3 min-w-0">
            <Link
              href="/methodology"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg border border-[var(--dmc-border-strong)] bg-white text-sm font-semibold text-[var(--dmc-ink-primary)]"
            >
              Verification Methodology
            </Link>
            <Link
              href="/corrections"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg bg-[var(--dmc-brand-forest)] text-sm font-semibold text-white"
            >
              Report Correction
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

