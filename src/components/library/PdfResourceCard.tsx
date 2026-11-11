import React from 'react';
import Link from 'next/link';
import { Archive, ArrowRight, Download } from 'lucide-react';
import type { PdfResource } from '@/lib/schemas';
import { derivePdfYear, formatBytes } from '@/lib/format';
import { VerificationBadge } from '@/components/ui/Badge';

export interface PdfResourceCardProps {
  pdf: PdfResource;
  subjectLabel?: string;
}

export function PdfResourceCard({ pdf, subjectLabel }: PdfResourceCardProps) {
  const year = derivePdfYear(pdf);
  const isArchived = pdf.status === 'archived';

  return (
    <article className="track-card bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-5 lg:p-6 elevation-1 flex flex-col justify-between space-y-5 border-t-4 border-t-[var(--dmc-brand-forest)] min-w-0">
      <div className="space-y-3">
        {isArchived && (
          <div className="bg-[var(--dmc-status-archived-bg)] border border-[var(--dmc-status-archived-border)] rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-[var(--dmc-status-archived-ink)]">
            <Archive className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Archived Edition (Historical Reference)</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] border border-[var(--dmc-status-verified-border)]/40">
            {subjectLabel ?? pdf.gradeLabel}
          </span>
          <VerificationBadge status={pdf.verification.status} />
        </div>

        <h3 className="type-card-title text-[var(--dmc-ink-primary)]">
          <Link
            href={`/library/resource/${pdf.slug}`}
            className="hover:text-[var(--dmc-brand-forest)] hover:underline"
          >
            {pdf.title}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)] leading-relaxed line-clamp-3">
          {pdf.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--dmc-ink-muted)] tabular-nums">
          <span>{year ?? pdf.edition}</span>
          {(pdf.pageCount || (pdf.questionCount && pdf.questionCount > 0)) && (
            <>
              <span>&middot;</span>
              <span>{pdf.pageCount ? `${pdf.pageCount} pages` : `${pdf.questionCount}+ MCQs`}</span>
            </>
          )}
          <span>&middot;</span>
          <span>{formatBytes(pdf.fileSizeBytes)}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--dmc-border-subtle)] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Link
          href={`/library/resource/${pdf.slug}`}
          className="inline-flex items-center gap-1 min-h-[44px] text-xs font-bold text-[var(--dmc-brand-forest)] hover:underline"
        >
          <span>Details &amp; SHA-256</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>

        <a
          href={pdf.filePath}
          download
          className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-xs font-bold px-4 py-2 rounded-[var(--dmc-radius-button)]"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Download</span>
        </a>
      </div>
    </article>
  );
}

