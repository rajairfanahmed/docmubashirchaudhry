'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { v3Api } from '@/lib/v3/client';

interface ActivityItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export function AdminActivityClient() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchActivities = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await v3Api.admin.activity.list({ page, pageSize: 20 }, signal);
      setActivities(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load activity audit log.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchActivities(controller.signal);
    return () => controller.abort();
  }, [fetchActivities]);

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[var(--color-ink-muted)]">
          Total Logged Actions: <span className="text-[var(--color-ink)] font-bold">{totalItems}</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={loading}
          onClick={() => void fetchActivities()}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {loading && activities.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 space-y-2"
            >
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded-[var(--radius-panel)] p-6 text-center space-y-3"
        >
          <AlertTriangle className="w-6 h-6 text-[var(--color-danger-ink)] mx-auto" />
          <p className="text-sm font-semibold text-[var(--color-ink)]">{errorMsg}</p>
          <Button variant="secondary" size="sm" onClick={() => void fetchActivities()}>
            Retry
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyStateCard
          title="No administrative activity recorded yet"
          description="Actions performed by platform administrators will appear here as an append-only audit trail."
          icon={ShieldCheck}
        />
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] font-bold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {activities.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface-soft)]/50 transition-colors">
                    <td className="py-3 px-4 text-[var(--color-ink-muted)] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--color-ink)] whitespace-nowrap">
                      {item.adminEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-[var(--color-brand-deep)] border border-emerald-200 text-[11px] font-bold">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink-secondary)] capitalize whitespace-nowrap">
                      {item.entityType} {item.entityId ? `(${item.entityId.slice(0, 8)}...)` : ''}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-ink-muted)] font-mono text-[11px] max-w-xs truncate">
                      {item.details ? JSON.stringify(item.details) : 'None'}
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
                pageSize={20}
                onPageChange={setPage}
                itemLabel="actions"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
