'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  HelpCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { v3Api } from '@/lib/v3/client';
import type { AdminOverviewAnalytics } from '@/lib/v3/types';
import { cn } from '@/lib/utils';

type ChartWindowDays = 7 | 14 | 30;

function formatShortUtcDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function AdminOverviewClient() {
  const [data, setData] = useState<AdminOverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<ChartWindowDays>(30);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await v3Api.admin.analytics.overview(signal);
      setData(res);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load portal overview analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadOverview(controller.signal);
    return () => controller.abort();
  }, [loadOverview]);

  const seriesSlice = useMemo(() => {
    const raw = data?.dailyVisitSeries ?? [];
    if (raw.length <= windowDays) {
      return raw;
    }
    return raw.slice(raw.length - windowDays);
  }, [data, windowDays]);

  const maxVisits = useMemo(() => {
    let peak = 1;
    for (const pt of seriesSlice) {
      if (pt.visits > peak) {
        peak = pt.visits;
      }
    }
    return peak;
  }, [seriesSlice]);

  const activePoint =
    hoveredIdx !== null && seriesSlice[hoveredIdx]
      ? seriesSlice[hoveredIdx]
      : seriesSlice.length > 0
      ? seriesSlice[seriesSlice.length - 1]
      : null;

  if (loading && !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading portal overview analytics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 space-y-3"
            >
              <SkeletonBlock className="h-3.5 w-32" />
              <SkeletonBlock className="h-8 w-20" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-4">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div
        role="alert"
        className="bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded-[var(--radius-panel)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-[var(--color-danger-ink)] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Failed to load overview analytics
            </p>
            <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void loadOverview()}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const overviewCards = [
    {
      label: 'Total Registered Users',
      value: (data?.totalRegisteredUsers ?? 0).toLocaleString(),
      sub: 'Google OAuth & Email profiles',
      icon: Users
    },
    {
      label: 'Site Visits (Today / 7d / 30d)',
      value: `${(data?.siteVisits.today ?? 0).toLocaleString()} / ${(data?.siteVisits.last7Days ?? 0).toLocaleString()} / ${(data?.siteVisits.last30Days ?? 0).toLocaleString()}`,
      sub: `${(data?.siteVisits.total ?? 0).toLocaleString()} total logged views`,
      icon: Eye
    },
    {
      label: 'Active Users Today',
      value: (data?.activeUsersToday ?? 0).toLocaleString(),
      sub: 'Authenticated sessions active today',
      icon: Activity
    },
    {
      label: 'Quizzes Attempted Today',
      value: (data?.quizzesAttemptedToday ?? 0).toLocaleString(),
      sub: `${(data?.totalQuizAttempts ?? 0).toLocaleString()} cumulative attempts`,
      icon: ClipboardCheck
    }
  ];

  const chartHeight = 180;
  const chartWidth = 640;
  const padX = 12;
  const padTop = 14;
  const padBottom = 10;
  const usableHeight = chartHeight - padTop - padBottom;
  const stepX =
    seriesSlice.length > 0 ? (chartWidth - padX * 2) / seriesSlice.length : 1;
  const barWidth = Math.max(6, Math.min(26, stepX * 0.68));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Analytics time range"
          className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] p-1 shadow-xs"
        >
          {([7, 14, 30] as ChartWindowDays[]).map((days) => {
            const active = windowDays === days;
            return (
              <button
                key={days}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setWindowDays(days);
                  setHoveredIdx(null);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold transition-colors cursor-pointer',
                  active
                    ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                    : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]'
                )}
              >
                {days === 7 ? '7 Days' : days === 14 ? '14 Days' : '30 Days'}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={loading}
          onClick={() => void loadOverview()}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {overviewCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
              </div>
              <div className="font-display font-extrabold text-xl sm:text-2xl text-[var(--color-ink)] tabular-nums">
                {kpi.value}
              </div>
              <div className="text-xs text-[var(--color-ink-secondary)]">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="type-card-title text-[var(--color-ink)]">
                Daily Site Visits Trend (Last {windowDays} Days UTC)
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Hover or focus any day bar to inspect logged first-party visits
              </p>
            </div>
            {activePoint ? (
              <div
                aria-live="polite"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] px-3 py-1 text-xs font-semibold text-[var(--color-success-ink)] tabular-nums"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-deep)]" />
                <span>
                  {formatShortUtcDate(activePoint.date)}: {activePoint.visits.toLocaleString()} visits
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
            {seriesSlice.length === 0 ? (
              <div className="min-h-[190px] flex flex-col items-center justify-center gap-2 text-center">
                <BarChart3 className="w-8 h-8 text-[var(--color-brand-deep)]/60" aria-hidden="true" />
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  No daily visit entries recorded in this window yet.
                </p>
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={`Daily site visits bar chart over the last ${windowDays} days`}
                className="w-full h-48 overflow-visible select-none"
              >
                {[0.25, 0.5, 0.75, 1].map((fraction) => {
                  const y = padTop + usableHeight * (1 - fraction);
                  return (
                    <line
                      key={fraction}
                      x1={padX}
                      x2={chartWidth - padX}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="3 4"
                      className="text-[var(--color-border-strong)]"
                    />
                  );
                })}
                {seriesSlice.map((point, index) => {
                  const ratio = point.visits / maxVisits;
                  const h = Math.max(4, Math.round(ratio * usableHeight));
                  const x = padX + index * stepX + (stepX - barWidth) / 2;
                  const y = padTop + usableHeight - h;
                  const isActive =
                    hoveredIdx === index ||
                    (hoveredIdx === null && index === seriesSlice.length - 1);

                  return (
                    <g
                      key={point.date}
                      tabIndex={0}
                      role="button"
                      aria-label={`${formatShortUtcDate(point.date)}: ${point.visits} visits`}
                      onMouseEnter={() => setHoveredIdx(index)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onFocus={() => setHoveredIdx(index)}
                      className="outline-none cursor-pointer"
                    >
                      <rect
                        x={x - 3}
                        y={padTop}
                        width={barWidth + 6}
                        height={usableHeight}
                        fill="transparent"
                      />
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        rx={4}
                        fill={isActive ? 'var(--color-action)' : 'var(--color-brand-deep)'}
                        opacity={isActive ? 1 : 0.7}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
            {seriesSlice.length > 0 ? (
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--color-ink-muted)] px-1 tabular-nums">
                <span>{formatShortUtcDate(seriesSlice[0].date)}</span>
                <span>Peak: {maxVisits.toLocaleString()} / day</span>
                <span>{formatShortUtcDate(seriesSlice[seriesSlice.length - 1].date)}</span>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="xl:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="type-card-title text-[var(--color-ink)]">Platform Totals</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Live totals and direct management shortcuts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <div className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                Total Attempts
              </div>
              <div className="font-display font-extrabold text-xl text-[var(--color-ink)] tabular-nums mt-0.5">
                {(data?.totalQuizAttempts ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <div className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                PDF Downloads
              </div>
              <div className="font-display font-extrabold text-xl text-[var(--color-ink)] tabular-nums mt-0.5">
                {(data?.totalPdfDownloads ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              href="/admin/users"
              className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] transition-colors text-sm font-semibold text-[var(--color-ink)]"
            >
              <span className="inline-flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-brand-deep)]" aria-hidden="true" />
                <span>Inspect Student Users</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/quizzes"
              className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] transition-colors text-sm font-semibold text-[var(--color-ink)]"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck
                  className="w-4 h-4 text-[var(--color-brand-deep)]"
                  aria-hidden="true"
                />
                <span>Configure Quizzes &amp; Mocks</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/questions"
              className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] transition-colors text-sm font-semibold text-[var(--color-ink)]"
            >
              <span className="inline-flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--color-brand-deep)]" aria-hidden="true" />
                <span>Author Bilingual MCQs</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/pdfs"
              className="flex items-center justify-between gap-2 p-3 rounded-[var(--radius-control)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] transition-colors text-sm font-semibold text-[var(--color-ink)]"
            >
              <span className="inline-flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-brand-deep)]" aria-hidden="true" />
                <span>Upload Watermarked PDFs</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
