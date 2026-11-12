'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  FolderCheck,
  Lock,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { GatedPdfDownloadButton } from '@/components/library/GatedPdfDownloadButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { formatBytes } from '@/lib/format';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import type { UserDownloadHistoryItem, UserDownloadsResponse } from '@/lib/v3/types';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function DownloadsHistoryClient() {
  const { status, session } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [data, setData] = useState<UserDownloadsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDownloads = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.me.listDownloads({ page: targetPage, pageSize }, signal);
        setData(res);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (isV3ClientError(err) && err.status === 401) {
          setData(null);
          return;
        }
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Unable to load your PDF download log right now.'
        );
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    if (!session.authenticated) {
      setData(null);
      setErrorMsg(null);
      return;
    }

    const controller = new AbortController();
    void fetchDownloads(page, controller.signal);
    return () => controller.abort();
  }, [status, session.authenticated, page, fetchDownloads]);

  const items: UserDownloadHistoryItem[] = data?.items ?? [];
  const totalDownloads = data?.pagination.totalItems ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const uniqueBooklets = new Set(items.map((item) => item.pdfId)).size;
  const lastDownloadedLabel =
    items.length > 0 ? formatDateTime(items[0].downloadedAt) : 'None yet';

  if (status === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading PDF download log">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 space-y-3"
            >
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!session.authenticated) {
    return (
      <EmptyStateCard
        icon={Lock}
        title="Sign in to view your downloaded PDFs"
        description="Every watermarked study PDF uses temporary expiring links logged privately to your account so you can re-download notes anytime."
        primaryAction={{
          label: 'Sign In / Create Account',
          onClick: () =>
            openAuthModal({
              title: 'Sign in to view My PDF Downloads',
              description:
                'Sign in with Google or your email and password to view your downloaded booklets and request fresh expiring links.',
              onAuthenticated: () => {
                void fetchDownloads(1);
              }
            })
        }}
        secondaryAction={{
          label: 'Browse PDF Library',
          href: '/library'
        }}
      />
    );
  }

  const summaryCards = [
    {
      label: 'Total Downloads',
      value: String(totalDownloads),
      icon: Download
    },
    {
      label: 'Unique Booklets (Page)',
      value: String(uniqueBooklets),
      icon: FolderCheck
    },
    {
      label: 'Signed URL Protection',
      value: 'Active',
      icon: ShieldCheck
    },
    {
      label: 'Last Downloaded',
      value: lastDownloadedLabel,
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-[var(--color-ink-muted)]">
                <span className="text-xs font-semibold">{kpi.label}</span>
                <Icon className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
              </div>
              <div className="font-display font-extrabold text-base sm:text-xl text-[var(--color-ink)] tabular-nums truncate">
                {loading && !data ? '...' : kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg ? (
        <div
          role="alert"
          className="bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded-[var(--radius-panel)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 text-[var(--color-danger-ink)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--color-ink)]">
                Could not load download history
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void fetchDownloads(page)}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyStateCard
          icon={FileText}
          title="No PDFs downloaded yet"
          description="Browse solved PPSC/FPSC booklets in the PDF Library. Every file uses temporary expiring signed links protected for enrolled students."
          primaryAction={{
            label: 'Open PDF Library',
            href: '/library'
          }}
        />
      ) : (
        <>
          <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
              <h2 className="type-card-title text-[var(--color-ink)]">
                Downloaded Study Booklets
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)]">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Fresh Signed URLs per click</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th scope="col" className="py-3 px-4">Document Title</th>
                    <th scope="col" className="py-3 px-4">Subject / Exam Tag</th>
                    <th scope="col" className="py-3 px-4">File Size</th>
                    <th scope="col" className="py-3 px-4">Accessed On</th>
                    <th scope="col" className="py-3 px-4 text-right">Download Again</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[var(--color-ink)]">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">
                          {item.subject ?? 'General'} - {item.examTag ?? 'Exam'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] tabular-nums">
                        {typeof item.fileSize === 'number' ? formatBytes(item.fileSize) : 'PDF'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatDateTime(item.downloadedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <GatedPdfDownloadButton
                          pdfId={item.pdfId}
                          title={item.title}
                          fileSizeBytes={item.fileSize ?? undefined}
                          label="Download Again"
                          variant="outline"
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 shadow-xs space-y-3"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[var(--color-ink)]">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                    <span>{item.subject ?? 'General'}</span>
                    <span>-</span>
                    <span>{item.examTag ?? 'Exam'}</span>
                    {typeof item.fileSize === 'number' ? (
                      <>
                        <span>-</span>
                        <span className="tabular-nums">{formatBytes(item.fileSize)}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-ink-secondary)] border-t border-[var(--color-border)] pt-2.5">
                  <span>Accessed {formatDateTime(item.downloadedAt)}</span>
                </div>

                <GatedPdfDownloadButton
                  pdfId={item.pdfId}
                  title={item.title}
                  fileSizeBytes={item.fileSize ?? undefined}
                  label="Download Again"
                  variant="forest"
                  size="sm"
                  className="w-full"
                />
              </article>
            ))}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalDownloads}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="downloads"
          />
        </>
      )}
    </div>
  );
}
