'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileQuestion,
  Filter,
  Flag,
  MessageSquare,
  RefreshCw,
  User,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import { v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

type ReportStatusFilter = 'all' | 'new' | 'looked_at' | 'fixed' | 'not_an_issue';

interface ReportItem {
  id: string;
  questionId: string;
  reportedBy: string;
  reporterEmail: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export function AdminReportsClient() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await v3Api.admin.reports.list(
        {
          page,
          pageSize: 15,
          status: statusFilter === 'all' ? undefined : statusFilter
        },
        signal
      );
      setReports(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load question reports.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchReports(controller.signal);
    return () => controller.abort();
  }, [fetchReports]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await v3Api.admin.reports.update(id, {
        status: newStatus,
        adminNote: adminNoteInput.trim() || undefined
      });
      showToast({
        title: 'Report Updated',
        description: `Status changed to ${newStatus.replace('_', ' ')}.`,
        tone: 'success'
      });
      setEditingId(null);
      setAdminNoteInput('');
      void fetchReports();
    } catch {
      showToast({
        title: 'Update Failed',
        description: 'Unable to update report status right now.',
        tone: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3" />
            New
          </span>
        );
      case 'looked_at':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Eye className="w-3 h-3" />
            Under Review
          </span>
        );
      case 'fixed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Fixed
          </span>
        );
      case 'not_an_issue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="w-3 h-3" />
            Resolved (Not an Issue)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="text-[var(--color-ink-muted)] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {(
            [
              { id: 'all', label: 'All Reports' },
              { id: 'new', label: 'New' },
              { id: 'looked_at', label: 'Under Review' },
              { id: 'fixed', label: 'Fixed' },
              { id: 'not_an_issue', label: 'Not an Issue' }
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
          variant="secondary"
          size="sm"
          isLoading={loading}
          onClick={() => void fetchReports()}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 space-y-3"
            >
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-10 w-full" />
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
          <Button variant="secondary" size="sm" onClick={() => void fetchReports()}>
            Retry
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <EmptyStateCard
          title="No question reports found"
          description="Candidates have not flagged any questions matching this filter."
          icon={Flag}
        />
      ) : (
        <div className="space-y-3.5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] flex items-center justify-center">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
                      Question ID: {report.questionId}
                    </span>
                    <div className="text-[11px] text-[var(--color-ink-muted)] flex items-center gap-2 mt-0.5">
                      <span>Reporter: {report.reporterEmail || 'Anonymous'}</span>
                      <span>&bull;</span>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {statusBadge(report.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (editingId === report.id) {
                        setEditingId(null);
                      } else {
                        setEditingId(report.id);
                        setAdminNoteInput(report.adminNote || '');
                      }
                    }}
                  >
                    {editingId === report.id ? 'Close' : 'Moderate'}
                  </Button>
                </div>
              </div>

              {/* Candidate Error Message */}
              <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-ink)] leading-relaxed">
                <span className="font-semibold text-[var(--color-ink-secondary)] block mb-1">
                  Candidate Report Note:
                </span>
                {report.message}
              </div>

              {/* Admin Note if present and not editing */}
              {report.adminNote && editingId !== report.id && (
                <div className="p-2.5 rounded-[var(--radius-control)] bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-950">
                  <span className="font-semibold block mb-0.5">Admin Note:</span>
                  {report.adminNote}
                </div>
              )}

              {/* Inline Moderation Form */}
              {editingId === report.id && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`admin-note-${report.id}`}
                      className="text-xs font-semibold text-[var(--color-ink)]"
                    >
                      Admin Note (Optional):
                    </label>
                    <input
                      id={`admin-note-${report.id}`}
                      type="text"
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="e.g. Corrected key in question bank to Option B."
                      className="w-full px-3 py-1.5 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-deep)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--color-ink-secondary)] mr-1">
                      Set Status:
                    </span>
                    {(['new', 'looked_at', 'fixed', 'not_an_issue'] as const).map((st) => (
                      <Button
                        key={st}
                        variant={report.status === st ? 'primary' : 'outline'}
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => void handleUpdateStatus(report.id, st)}
                      >
                        {st === 'looked_at'
                          ? 'Under Review'
                          : st === 'not_an_issue'
                          ? 'Not an Issue'
                          : st.charAt(0).toUpperCase() + st.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pt-3">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={15}
                onPageChange={setPage}
                itemLabel="reports"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
