'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Download,
  Filter,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import { v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'blocked' | 'deleted';

interface AdminUserItem {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string | null;
  authProvider: string;
  status: string;
  blockedReason: string | null;
  role: string;
  isAdmin: boolean;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  totalPdfDownloads: number;
  createdAt: string;
  lastActiveAt: string;
}

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
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status toggle modal state
  const [targetUser, setTargetUser] = useState<AdminUserItem | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.admin.users.list(
          {
            page,
            pageSize,
            q: debouncedSearch || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter
          },
          signal
        );
        setUsers(res.data);
        setTotalPages(res.meta.totalPages);
        setTotalItems(res.meta.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load user directory.');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, debouncedSearch, statusFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const nextStatus: 'active' | 'blocked' = targetUser.status === 'blocked' ? 'active' : 'blocked';

    setIsUpdatingStatus(true);
    try {
      await v3Api.admin.users.updateStatus(targetUser.id, {
        status: nextStatus,
        reason: nextStatus === 'blocked' ? blockReasonInput.trim() || undefined : undefined
      });
      showToast({
        title: 'Status Updated',
        description: `User account is now marked as ${nextStatus}.`,
        tone: 'success'
      });
      setTargetUser(null);
      setBlockReasonInput('');
      void fetchUsers();
    } catch (err) {
      showToast({
        title: 'Action Failed',
        description: err instanceof Error ? err.message : 'Unable to modify user status.',
        tone: 'error'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/admin/exports/users', '_blank');
  };

  const googleCount = users.filter((u) => u.authProvider === 'google').length;
  const emailCount = users.filter((u) => u.authProvider === 'email').length;

  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--color-ink-muted)]">
            <span>Matching Accounts</span>
            <Users className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums">
            {loading && users.length === 0 ? '...' : totalItems}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--color-ink-muted)]">
            <span>Google OAuth (Page)</span>
            <ShieldCheck className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums">
            {loading && users.length === 0 ? '...' : googleCount}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--color-ink-muted)]">
            <span>Email Sign-Ups (Page)</span>
            <Mail className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-2xl text-[var(--color-ink)] tabular-nums">
            {loading && users.length === 0 ? '...' : emailCount}
          </div>
        </div>
      </div>

      {/* Search, Filter & Export Toolbar */}
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
            className="w-full min-h-[40px] pl-9 pr-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold" role="group" aria-label="Filter by account status">
            {(
              [
                { id: 'all', label: 'All Statuses' },
                { id: 'active', label: 'Active' },
                { id: 'blocked', label: 'Blocked' },
                { id: 'deleted', label: 'Deleted' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.id);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-[var(--radius-control)] transition-colors cursor-pointer',
                  statusFilter === opt.id
                    ? 'bg-[var(--color-brand-deep)] text-white shadow-xs'
                    : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title="Download CSV of user directory"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={loading}
            onClick={() => void fetchUsers()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Directory Table */}
      {loading && users.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded-[var(--radius-panel)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-danger-ink)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)]">Could not load user directory</p>
              <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void fetchUsers()}>
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <EmptyStateCard
          icon={Users}
          title="No matching accounts found"
          description={
            debouncedSearch || statusFilter !== 'all'
              ? 'Try clearing your search query or status filter.'
              : 'Registered user accounts will appear here automatically.'
          }
          primaryAction={
            debouncedSearch || statusFilter !== 'all'
              ? {
                  label: 'Reset Filters',
                  onClick: () => {
                    setSearchInput('');
                    setDebouncedSearch('');
                    setStatusFilter('all');
                    setPage(1);
                  }
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <th scope="col" className="py-3 px-4">User / Email</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Provider</th>
                  <th scope="col" className="py-3 px-4">Joined</th>
                  <th scope="col" className="py-3 px-4">Quizzes</th>
                  <th scope="col" className="py-3 px-4">Avg Score</th>
                  <th scope="col" className="py-3 px-4">Downloads</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-surface-soft)]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-ink)]">
                          {user.displayName || user.email}
                        </span>
                        {user.isAdmin && <Badge variant="verified">Admin</Badge>}
                      </div>
                      {user.displayName && (
                        <div className="text-xs text-[var(--color-ink-muted)]">{user.email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
                          user.status === 'blocked'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : user.status === 'deleted'
                            ? 'bg-gray-100 text-gray-700 border border-gray-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        )}
                      >
                        {user.status === 'blocked' ? (
                          <>
                            <Ban className="w-3 h-3" />
                            Blocked
                          </>
                        ) : user.status === 'deleted' ? (
                          'Deleted'
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={user.authProvider === 'google' ? 'feature' : 'neutral'}>
                        {user.authProvider === 'google' ? 'Google' : 'Email'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)] whitespace-nowrap">
                      {formatShortDate(user.createdAt)}
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
                    <td className="py-3.5 px-4 text-right">
                      {!user.isAdmin && user.status !== 'deleted' && (
                        <Button
                          variant={user.status === 'blocked' ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            setTargetUser(user);
                            setBlockReasonInput(user.blockedReason || '');
                          }}
                          className={user.status === 'blocked' ? 'text-emerald-700' : 'text-red-700'}
                        >
                          {user.status === 'blocked' ? 'Unblock' : 'Block'}
                        </Button>
                      )}
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
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                itemLabel="users"
              />
            </div>
          )}
        </div>
      )}

      {/* Block / Unblock Modal */}
      {targetUser && (
        <Modal
          isOpen={Boolean(targetUser)}
          onClose={() => setTargetUser(null)}
          title={targetUser.status === 'blocked' ? 'Unblock User Account' : 'Block User Account'}
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {targetUser.status === 'blocked'
                ? `Restore access for ${targetUser.email}. They will be able to take quizzes and download PDFs again.`
                : `Suspending ${targetUser.email} prevents future quiz submissions and downloads.`}
            </p>
            {targetUser.status !== 'blocked' && (
              <div className="space-y-1.5">
                <label htmlFor="block-reason-input" className="text-xs font-semibold text-[var(--color-ink)]">
                  Reason for Suspension (Optional):
                </label>
                <input
                  id="block-reason-input"
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="e.g. Terms violation or suspicious activity"
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-deep)]"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTargetUser(null)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className={targetUser.status === 'blocked' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700 text-white'}
                onClick={() => void handleToggleStatus()}
                isLoading={isUpdatingStatus}
              >
                {targetUser.status === 'blocked' ? 'Confirm Unblock' : 'Confirm Suspension'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
