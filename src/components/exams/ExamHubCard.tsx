import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import type { ExamHubCardProps } from './types';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { VerificationBadge } from '@/components/ui/Badge';
import { formatVerificationDate } from '@/lib/format';

export function ExamHubCard({ exam, postCount = 0, pdfCount = 0 }: ExamHubCardProps) {
  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 lg:p-6 elevation-1 flex flex-col justify-between space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CommissionBrandBadge examCodeOrSlug={exam.slug} size="lg" showLabel />
          <VerificationBadge
            status={exam.verification.status}
            date={formatVerificationDate(exam.verification.lastCheckedAt)}
          />
        </div>

        <div>
          <h3 className="type-card-title text-[var(--color-ink)]">{exam.title}</h3>
          <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">{exam.jurisdiction}</div>
        </div>

        <p className="type-body-sm text-[var(--color-ink-secondary)] leading-relaxed">{exam.summary}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-muted)] tabular-nums">
          <span>{postCount} tracked post{postCount === 1 ? '' : 's'}</span>
          <span>&middot;</span>
          <span>{pdfCount} PDF booklet{pdfCount === 1 ? '' : 's'}</span>
          {exam.status === 'draft' && (
            <>
              <span>&middot;</span>
              <span className="font-semibold text-[var(--color-warning-ink)]">Coming Soon</span>
            </>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/exams/${exam.slug}`}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>
            Explore Hub
            <span className="sr-only"> for {exam.title}</span>
          </span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>

        <a
          href={exam.officialPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 min-h-[44px] text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <span>
            Official Site
            <span className="sr-only"> for {exam.title} (opens in a new tab)</span>
          </span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

