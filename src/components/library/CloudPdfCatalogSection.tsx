'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { formatBytes } from '@/lib/format';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import type { PublicPdfItem } from '@/lib/v3/types';
import { GatedPdfDownloadButton } from '@/components/library/GatedPdfDownloadButton';
import { SkeletonBlock, TextInput } from '@/components/ui/FormPrimitives';

export function CloudPdfCatalogSection() {
  const [items, setItems] = useState<PublicPdfItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.pdfs.list(
          { page: 1, pageSize: 24, search: search.trim() || undefined },
          controller.signal
        );
        setConfigured(res.configured !== false);
        setItems(res.items);
      } catch (err) {
        if (!controller.signal.aborted && isV3ClientError(err)) {
          setErrorMsg(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, reloadNonce]);

  if (!configured) {
    return null;
  }

  if (!isLoading && items.length === 0 && !search.trim() && !errorMsg) {
    return null;
  }

  return (
    <div className="space-y-5 pb-8 border-b border-[var(--color-border)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 type-label-micro text-[var(--color-brand-deep)]">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Private Bucket Booklets</span>
          </span>
          <h3 className="type-section-heading text-[var(--color-ink)]">
            Latest Watermarked Releases
          </h3>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <TextInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter uploaded PDFs..."
            aria-label="Filter uploaded cloud PDFs"
            className="pl-9"
          />
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-danger-ink)]"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
          <SkeletonBlock className="h-56" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center space-y-3 text-sm text-[var(--color-ink-secondary)]">
          <p>No cloud-hosted PDFs matched &ldquo;{search}&rdquo;.</p>
          {search.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((pdf) => (
            <article
              key={pdf.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 elevation-1 flex flex-col justify-between space-y-5 min-w-0"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)]">
                    {pdf.subject}
                  </span>
                  <span className="font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                    {pdf.examTag}
                  </span>
                </div>

                <h4 className="type-card-title text-[var(--color-ink)]">{pdf.title}</h4>

                {pdf.description && (
                  <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3">
                    {pdf.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--color-ink-muted)] tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{formatBytes(pdf.fileSize)}</span>
                  </span>
                  <span>&middot;</span>
                  <span>{pdf.downloadCount} downloads</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                  Signed R2 Delivery
                </span>
                <GatedPdfDownloadButton
                  pdfId={pdf.id}
                  title={pdf.title}
                  fileSizeBytes={pdf.fileSize}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

