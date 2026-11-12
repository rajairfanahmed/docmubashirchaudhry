'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import type { AuthProviderType } from '@/lib/supabase/database.types';
import { v3Api } from '@/lib/v3/client';
import type { AdminUsersAnalyticsResponse } from '@/lib/v3/types';
import { cn } from '@/lib/utils';

type ProviderFilter = 'all' | AuthProviderType;

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function AdminUsersClient() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<AdminUsersAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(
    async (targetPage: number, query: string, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.admin.analytics.users(
          { page: targetPage, pageSize, search: query || undefined },
          signal
        );
        setData(res);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load registered users.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(page, debouncedSearch, controller.signal);
    return () => controller.abort();
  }, [page, debouncedSearch, fetchUsers]);

  const rawItems = data?.items ?? [];
  const filteredItems = useMemo(() => {
    if (providerFilter === 'all') {
      return rawItems;
    }
    return rawItems.filter((item) => item.authProvider === providerFilter);
  }, [rawItems, providerFilter]);

  const totalMatching = data?.pagination.totalItems ?? rawItems.length;
  const googleCountOnPage = rawItems.filter((u) => u.authProvider === 'google').length;
  const emailCountOnPage = rawItems.filter((u) => u.authProvider === 'email').length;
  const totalPages = data?.pagination.totalPages ?? 1;

  const kpis = [
    { label: 'Matching Accounts', value: String(totalMatching), icon: Users },
    { label: 'Google OAuth (Page)', value: String(googleCountOnPage), icon: ShieldCheck },
    { label: 'Email Sign-Ups (Page)', value: String(emailCountOnPage), icon: Mail }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--color-ink-muted)]">
                <span>{item.label}</span>
                <Icon className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
              </div>
              <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums">
                {loading && !data ? '...' : item.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[240px] sm:max-w-md">
          <Search
            className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email or display name..."
            aria-label="Search registered users by email or display name"
            className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold" role="group" aria-label="Filter by sign-up provider">
          {(
            [
              { id: 'all', label: 'All Providers' },
              { id: 'google', label: 'Google' },
              { id: 'email', label: 'Email' }
            ] as const
          ).map((option) => {
            const active = providerFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setProviderFilter(option.id)}
                className={cn(
                  'min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-full transition-colors cursor-pointer',
                  active
                    ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                    : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
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
                Could not load user directory
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void fetchUsers(page, debouncedSearch)}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyStateCard
          icon={Users}
          title="No matching accounts found"
          description={
            debouncedSearch || providerFilter !== 'all'
              ? 'Try clearing your search text or provider filter to view all registered accounts.'
              : 'Registered student accounts will appear here automatically once users sign in.'
          }
          primaryAction={
            debouncedSearch || providerFilter !== 'all'
              ? {
                  label: 'Reset Filters',
                  onClick: () => {
                    setSearchInput('');
                    setDebouncedSearch('');
                    setProviderFilter('all');
                    setPage(1);
                  }
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th scope="col" className="py-3 px-4">Student / Email</th>
                    <th scope="col" className="py-3 px-4">Sign-Up Method</th>
                    <th scope="col" className="py-3 px-4">Joined</th>
                    <th scope="col" className="py-3 px-4">Last Active</th>
                    <th scope="col" className="py-3 px-4">Quizzes Attempted</th>
                    <th scope="col" className="py-3 px-4">Avg Score</th>
                    <th scope="col" className="py-3 px-4">PDF Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredItems.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-ink)]">
                            {user.displayName || user.email}
                          </span>
                          {user.isAdmin ? <Badge variant="verified">Admin</Badge> : null}
                        </div>
                        {user.displayName ? (
                          <div className="text-xs text-[var(--color-ink-muted)]">{user.email}</div>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={user.authProvider === 'google' ? 'feature' : 'neutral'}>
                          {user.authProvider === 'google' ? 'Google OAuth' : 'Email & Password'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatShortDate(user.joinedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatShortDate(user.lastActiveAt)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--color-ink)] tabular-nums">
                        {user.totalQuizzesAttempted}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--color-brand-deep)] tabular-nums">
                        {Math.round(user.averageScorePercentage)}%
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] tabular-nums">
                        {user.totalPdfDownloads}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filteredItems.map((user) => (
              <article
                key={user.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-ink)]">
                      {user.displayName || user.email}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">{user.email}</p>
                  </div>
                  <Badge variant={user.authProvider === 'google' ? 'feature' : 'neutral'}>
                    {user.authProvider === 'google' ? 'Google' : 'Email'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[var(--color-border)] tabular-nums">
                  <div>
                    <span className="text-[var(--color-ink-muted)] block">Attempts</span>
                    <strong className="text-[var(--color-ink)]">
                      {user.totalQuizzesAttempted}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-ink-muted)] block">Avg Score</span>
                    <strong className="text-[var(--color-brand-deep)]">
                      {Math.round(user.averageScorePercentage)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-ink-muted)] block">Downloads</span>
                    <strong className="text-[var(--color-ink)]">
                      {user.totalPdfDownloads}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={totalMatching}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="users"
          />
        </>
      )}
    </div>
  );
}
