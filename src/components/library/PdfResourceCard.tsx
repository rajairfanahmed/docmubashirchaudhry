import React from 'react';
import Link from 'next/link';
import { Archive, ArrowRight } from 'lucide-react';
import type { PdfResource } from '@/lib/schemas';
import { derivePdfYear, formatBytes } from '@/lib/format';
import { VerificationBadge } from '@/components/ui/Badge';
import { GatedPdfDownloadButton } from '@/components/library/GatedPdfDownloadButton';

export interface PdfResourceCardProps {
  pdf: PdfResource;
  subjectLabel?: string;
}

export function PdfResourceCard({ pdf, subjectLabel }: PdfResourceCardProps) {
  const year = derivePdfYear(pdf);
  const isArchived = pdf.status === 'archived';

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 lg:p-6 elevation-1 flex flex-col justify-between space-y-5 min-w-0">
      <div className="space-y-3">
        {isArchived && (
          <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] rounded-[var(--radius-control)] px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-secondary)]">
            <Archive className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Archived Edition (Historical Reference)</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border border-[var(--color-border)]">
            {subjectLabel ?? pdf.gradeLabel}
          </span>
          <VerificationBadge status={pdf.verification.status} />
        </div>

        <h3 className="type-card-title text-[var(--color-ink)]">
          <Link
            href={`/library/resource/${pdf.slug}`}
            className="hover:text-[var(--color-brand-deep)] hover:underline"
          >
            {pdf.title}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3">
          {pdf.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--color-ink-muted)] tabular-nums">
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

      <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Link
          href={`/library/resource/${pdf.slug}`}
          className="inline-flex items-center gap-1 min-h-[44px] text-xs font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          <span>
            Details &amp; SHA-256
            <span className="sr-only"> for {pdf.title}</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>

        <GatedPdfDownloadButton
          pdfId={pdf.slug}
          title={pdf.title}
          fileSizeBytes={pdf.fileSizeBytes}
          fallbackPublicHref={pdf.filePath}
          label="Download PDF"
        />
      </div>
    </article>
  );
}

