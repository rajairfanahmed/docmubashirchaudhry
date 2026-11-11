import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck
} from 'lucide-react';
import type { PdfResource, Source } from '@/lib/schemas';
import type { RelatedItem } from '@/lib/data/repository';
import { derivePdfYear, formatBytes, formatVerificationDate } from '@/lib/format';
import { VerificationBadge } from '@/components/ui/Badge';
import { CorrectionTrigger } from '@/components/feedback/CorrectionTrigger';

export interface PdfDetailPanelProps {
  pdf: PdfResource;
  sources: Source[];
  relatedItems: RelatedItem[];
}

export function PdfDetailPanel({ pdf, sources, relatedItems }: PdfDetailPanelProps) {
  const year = derivePdfYear(pdf);
  const replacementPdf = relatedItems.find((item) => item.type === 'pdf');

  return (
    <div className="space-y-6">
      {pdf.status === 'archived' && (
        <div
          role="note"
          className="bg-[var(--dmc-status-unverified-bg)] border border-[var(--dmc-status-unverified-border)] rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-amber-950 text-xs sm:text-sm"
        >
          <AlertTriangle className="w-5 h-5 text-[var(--dmc-status-unverified-icon)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider">Archived Edition Notice</div>
            <p>
              This PDF compilation has been archived and preserved for reference.{' '}
              {replacementPdf && replacementPdf.slug ? (
                <Link href={`/library/resource/${replacementPdf.slug}`} className="font-bold underline">
                  Open replacement: {replacementPdf.title}
                </Link>
              ) : (
                <Link href="/library" className="font-bold underline">
                  Browse newer verified booklets in the PDF Library
                </Link>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left 4 Cols: A4 Folio Thumbnail Preview & Primary Download CTA */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-6 elevation-1 space-y-5">
            {pdf.thumbnailPath ? (
              <div className="aspect-[3/4] rounded-xl border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-muted)] overflow-hidden">
                <img
                  src={pdf.thumbnailPath}
                  alt={`${pdf.title} cover preview`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-xl border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-muted)] flex flex-col justify-between p-5 border-t-4 border-t-[var(--dmc-brand-forest)]">
                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)]">
                    {pdf.gradeLabel}
                  </span>
                  <div className="font-bold text-base text-[var(--dmc-ink-primary)] leading-snug">
                    {pdf.title}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[var(--dmc-ink-muted)] border-t border-[var(--dmc-border-subtle)] pt-3">
                  <div>Author: {pdf.author}</div>
                  <div>Edition: {pdf.edition}</div>
                  <div className="tabular-nums">
                    {formatBytes(pdf.fileSizeBytes)} &middot; {pdf.pageCount ?? 'Full'} pages
                  </div>
                </div>
              </div>
            )}

            <a
              href={pdf.filePath}
              download
              className="dmc-press w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm py-3 px-5 rounded-[var(--dmc-radius-button)] shadow-xs"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download PDF ({formatBytes(pdf.fileSizeBytes)})</span>
            </a>

            <div className="flex items-center justify-center gap-2 text-xs text-[var(--dmc-ink-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--dmc-status-verified-icon)]" aria-hidden="true" />
              <span>Free direct download &middot; No login</span>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Complete Document Metadata, Rights & Related Material */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-6 lg:p-8 elevation-1 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <VerificationBadge
                status={pdf.verification.status}
                date={formatVerificationDate(pdf.verification.lastCheckedAt)}
              />
            </div>

            <h1 id="resource-detail-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              {pdf.title}
            </h1>

            <p className="type-body-base text-[var(--dmc-ink-secondary)] leading-relaxed">{pdf.summary}</p>

            {pdf.highlights.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="type-label-micro text-[var(--dmc-ink-muted)]">Booklet Contents Highlights</h2>
                <ul className="space-y-2 text-sm text-[var(--dmc-ink-primary)]">
                  {pdf.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--dmc-border-subtle)] text-xs">
              <div>
                <dt className="font-semibold text-[var(--dmc-ink-muted)]">Author / Compiler</dt>
                <dd className="font-bold text-[var(--dmc-ink-primary)] mt-0.5">{pdf.author}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dmc-ink-muted)]">Edition / Version Note</dt>
                <dd className="font-bold text-[var(--dmc-ink-primary)] mt-0.5">
                  {pdf.edition}{year ? ` (${year})` : ''}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dmc-ink-muted)]">Pages &amp; Solved MCQs</dt>
                <dd className="font-bold text-[var(--dmc-ink-primary)] mt-0.5 tabular-nums">
                  {pdf.pageCount ?? 'Full booklet'} pages &middot; {pdf.questionCount ?? 0} solved MCQs
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dmc-ink-muted)]">SHA-256 Checksum</dt>
                <dd className="font-mono text-[11px] text-[var(--dmc-ink-primary)] mt-0.5 break-all">
                  {pdf.sha256}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-6 elevation-1 space-y-4">
            <h2 className="type-card-title text-[var(--dmc-ink-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--dmc-accent-gold-hover)]" aria-hidden="true" />
              <span>Rights &amp; Redistribution Statement</span>
            </h2>

            <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Classification: <strong className="text-[var(--dmc-ink-primary)]">{pdf.rights}</strong>.{' '}
              {pdf.licenseNote ?? 'Provided free of charge strictly for personal exam preparation.'}
            </p>

            {sources.length > 0 && (
              <div className="text-xs text-[var(--dmc-ink-muted)]">
                Sources: {sources.map((s) => s.title).join(', ')}
              </div>
            )}

            <div className="pt-3 border-t border-[var(--dmc-border-subtle)] flex flex-wrap items-center justify-between gap-3">
              <CorrectionTrigger
                referenceTitle={pdf.title}
                category="pastpaper"
                label="Report a problem with this PDF"
              />
              <Link
                href="/library"
                className="inline-flex items-center gap-1 min-h-[44px] text-xs font-semibold text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-ink-primary)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to PDF Library</span>
              </Link>
            </div>
          </div>

          {relatedItems.length > 0 && (
            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-6 elevation-1 space-y-3">
              <h2 className="type-card-title text-[var(--dmc-ink-primary)]">Related Study Resources</h2>
              <ul className="space-y-1 text-xs sm:text-sm">
                {relatedItems.map((item) => {
                  const href =
                    item.type === 'post' && item.slug
                      ? `/ppsc/${item.slug}`
                      : item.type === 'pdf' && item.slug
                        ? `/library/resource/${item.slug}`
                        : '/library';

                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold text-[var(--dmc-brand-forest)] hover:underline"
                      >
                        <span>{item.title}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

