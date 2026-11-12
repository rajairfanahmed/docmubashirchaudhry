'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  History,
  Lock,
  RefreshCw,
  RotateCcw,
  Target
} from 'lucide-react';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import type { UserAttemptHistoryItem, UserAttemptsResponse } from '@/lib/v3/types';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) {
    return `${secs}s`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

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

export function AttemptsHistoryClient() {
  const { status, session } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [data, setData] = useState<UserAttemptsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAttempts = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.me.listAttempts({ page: targetPage, pageSize }, signal);
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
          err instanceof Error ? err.message : 'Unable to load your quiz attempts right now.'
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
    void fetchAttempts(page, controller.signal);
    return () => controller.abort();
  }, [status, session.authenticated, page, fetchAttempts]);

  const summary = data?.summary ?? {
    totalAttempts: 0,
    averagePercentage: 0,
    bestPercentage: 0,
    passedCount: 0
  };
  const items: UserAttemptHistoryItem[] = data?.items ?? [];
  const totalItems = data?.pagination.totalItems ?? items.length;
  const totalPages = data?.pagination.totalPages ?? 1;

  if (status === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading quiz attempts">
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
        title="Sign in to view your saved attempts"
        description="Your quiz scores, timed mock exam breakdowns, and progress over time remain strictly private to your account."
        primaryAction={{
          label: 'Sign In / Create Account',
          onClick: () =>
            openAuthModal({
              title: 'Sign in to view My Quiz Attempts',
              description:
                'Sign in with Google or your email and password to load your personal quiz history.',
              onAuthenticated: () => {
                void fetchAttempts(1);
              }
            })
        }}
        secondaryAction={{
          label: 'Browse Quizzes',
          href: '/quizzes'
        }}
      />
    );
  }

  const summaryCards = [
    {
      label: 'Attempts Completed',
      value: String(summary.totalAttempts),
      icon: History
    },
    {
      label: 'Best Score',
      value: `${Math.round(summary.bestPercentage)}%`,
      icon: Award
    },
    {
      label: 'Average Accuracy',
      value: `${Math.round(summary.averagePercentage)}%`,
      icon: Target
    },
    {
      label: 'Passed Attempts',
      value: String(summary.passedCount),
      icon: CheckCircle2
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
              <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums">
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
                Could not load attempt history
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void fetchAttempts(page)}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyStateCard
          icon={History}
          title="No saved attempts yet"
          description="Start any PPSC/FPSC Practice Quiz or Full-Length Mock Exam and submit your answers to record your score here."
          primaryAction={{
            label: 'Explore Quizzes',
            href: '/quizzes'
          }}
        />
      ) : (
        <>
          <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
              <h2 className="type-card-title text-[var(--color-ink)]">Saved Attempt Log</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-success-ink)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Private Account View</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th scope="col" className="py-3 px-4">Quiz Title</th>
                    <th scope="col" className="py-3 px-4">Mode</th>
                    <th scope="col" className="py-3 px-4">Score</th>
                    <th scope="col" className="py-3 px-4">Breakdown</th>
                    <th scope="col" className="py-3 px-4">Time Taken</th>
                    <th scope="col" className="py-3 px-4">Date</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--color-ink)]">
                          {item.quizTitle}
                        </div>
                        <div className="text-xs text-[var(--color-ink-muted)]">
                          {item.subject ?? 'General'} - {item.examTag ?? 'Exam'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={item.quizType === 'mock' ? 'prepare' : 'neutral'}>
                          {item.quizType === 'mock' ? 'Timed Mock' : 'Practice'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-ink)] tabular-nums">
                            {Math.round(item.percentage)}%
                          </span>
                          <Badge variant={item.passed ? 'success' : 'error'}>
                            {item.passed ? 'Passed' : 'Review'}
                          </Badge>
                        </div>
                        <div className="text-xs text-[var(--color-ink-muted)] tabular-nums">
                          {item.score} / {item.maxScore} pts
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] tabular-nums">
                        <span className="text-[var(--color-success-ink)] font-semibold">
                          {item.correctCount} correct
                        </span>
                        {' / '}
                        <span className="text-[var(--color-danger-ink)] font-semibold">
                          {item.incorrectCount} wrong
                        </span>
                        {item.unansweredCount > 0 ? ` / ${item.unansweredCount} blank` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" aria-hidden="true" />
                          <span>{formatDuration(item.timeTakenSeconds)}</span>
                        </span>
                        {item.autoSubmitted ? (
                          <div className="text-[11px] text-[var(--color-warning-ink)] font-semibold">
                            Auto-submitted
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.quizSlug ? (
                          <Link
                            href={`/quizzes/${item.quizSlug}`}
                            className="dmc-press inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-xs font-semibold text-[var(--color-brand-deep)]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Retake</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-muted)]">Archived</span>
                        )}
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-ink)]">
                      {item.quizTitle}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {item.subject ?? 'General'} - {item.examTag ?? 'Exam'}
                    </p>
                  </div>
                  <Badge variant={item.passed ? 'success' : 'error'}>
                    {Math.round(item.percentage)}%
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-ink-secondary)] border-t border-[var(--color-border)] pt-2.5">
                  <span className="tabular-nums">
                    {item.correctCount} correct, {item.incorrectCount} wrong (
                    {formatDuration(item.timeTakenSeconds)})
                  </span>
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>

                {item.quizSlug ? (
                  <Link
                    href={`/quizzes/${item.quizSlug}`}
                    className="dmc-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-brand-deep)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Retake {item.quizTitle}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="attempts"
          />
        </>
      )}
    </div>
  );
}
