'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Filter,
  History,
  RefreshCw,
  Search,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import { v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

interface ParticipationAttemptItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number | null;
  autoSubmitted: boolean;
  createdAt: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function AdminParticipationClient() {
  const { showToast } = useToast();
  const [attempts, setAttempts] = useState<ParticipationAttemptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const loadAttempts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await v3Api.admin.attempts.list({
        page,
        pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setAttempts(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch {
      setError('Unable to load quiz participation logs right now.');
      showToast({
        title: 'Error loading participation',
        description: 'Failed to retrieve quiz attempts from server.',
        tone: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, showToast]);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--color-brand-deep)]" aria-hidden="true" />
              <h1 className="text-xl font-bold text-[var(--dmc-ink-primary)]">
                Quiz Participation &amp; Score Log
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--dmc-ink-secondary)]">
              Track mock exam completions, pass rates, score distributions, and time spent across all registered users.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadAttempts()}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} aria-hidden="true" />
              <span>Refresh</span>
            </Button>

            <a
              href="/api/admin/exports/attempts"
              download
              className="dmc-press inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-control)] bg-[var(--color-brand-deep)] text-white hover:bg-[var(--color-brand-deep)]/90 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--dmc-ink-secondary)] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              Outcome Filter:
            </span>
            <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-soft)]">
              {(['all', 'passed', 'failed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-colors capitalize cursor-pointer',
                    statusFilter === filter
                      ? 'bg-[var(--color-surface)] text-[var(--color-brand-deep)] shadow-xs'
                      : 'text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-ink-primary)]'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-[var(--dmc-ink-secondary)] font-medium">
            Total Records: <strong className="text-[var(--dmc-ink-primary)]">{totalCount}</strong>
          </div>
        </div>
      </div>

      {/* Main Table / State View */}
      {isLoading ? (
        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4">
          <SkeletonBlock className="h-8 w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-panel)] bg-red-50 border border-red-200 p-6 text-center space-y-3 text-red-900">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" aria-hidden="true" />
          <p className="text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void loadAttempts()}>
            Retry Loading
          </Button>
        </div>
      ) : attempts.length === 0 ? (
        <EmptyStateCard
          title="No Participation Records Found"
          description="There are currently no recorded quiz attempts matching the selected criteria."
          icon={Award}
        />
      ) : (
        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-xs font-bold text-[var(--dmc-ink-secondary)] uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Quiz Title</th>
                  <th scope="col" className="py-3 px-4 text-center">Score</th>
                  <th scope="col" className="py-3 px-4 text-center">Outcome</th>
                  <th scope="col" className="py-3 px-4">Breakdown</th>
                  <th scope="col" className="py-3 px-4">Duration</th>
                  <th scope="col" className="py-3 px-4">Completed At</th>
                  <th scope="col" className="py-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {attempts.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-soft)]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--dmc-ink-primary)]">
                        {item.userName || item.userEmail.split('@')[0]}
                      </div>
                      <div className="text-xs text-[var(--dmc-ink-muted)]">
                        {item.userEmail}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate font-medium text-[var(--dmc-ink-primary)]">
                      {item.quizTitle}
                    </td>

                    <td className="py-3 px-4 text-center font-bold tabular-nums">
                      <span className="text-[var(--dmc-ink-primary)]">{item.score}</span>
                      <span className="text-xs text-[var(--dmc-ink-muted)] font-normal"> / {item.maxScore}</span>
                      <div className="text-xs text-[var(--dmc-ink-secondary)] font-normal">
                        ({item.percentage.toFixed(1)}%)
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={item.passed ? 'success' : 'error'}
                        className="text-xs px-2.5 py-0.5 inline-flex items-center gap-1 font-semibold"
                      >
                        {item.passed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>Failed</span>
                          </>
                        )}
                      </Badge>
                      {item.autoSubmitted && (
                        <div className="mt-1">
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Timed Out
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs tabular-nums text-[var(--dmc-ink-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-semibold">{item.correctCount} correct</span>
                        <span>&middot;</span>
                        <span className="text-red-700 font-semibold">{item.incorrectCount} wrong</span>
                        <span>&middot;</span>
                        <span className="text-[var(--dmc-ink-muted)]">{item.unansweredCount} skipped</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs text-[var(--dmc-ink-secondary)] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--dmc-ink-muted)]" aria-hidden="true" />
                        <span>{formatDuration(item.timeTakenSeconds)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs text-[var(--dmc-ink-secondary)] whitespace-nowrap">
                      {formatShortDate(item.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/my-attempts/${item.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-deep)] hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[var(--color-border)]">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                itemLabel="attempts"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
