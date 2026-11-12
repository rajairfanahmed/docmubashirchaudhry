'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  ClipboardCheck,
  Edit3,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { QuizFormModal } from '@/components/admin/QuizFormModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import type { QuizRow } from '@/lib/supabase/database.types';
import { v3Api } from '@/lib/v3/client';
import type {
  AdminQuizAnalyticsResponse,
  AdminQuizInventoryResponse,
  CreateQuizInput,
  UpdateQuizInput
} from '@/lib/v3/types';

export function AdminQuizzesClient() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [inventory, setInventory] = useState<AdminQuizInventoryResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminQuizAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [invRes, anaRes] = await Promise.all([
          v3Api.admin.quizzes.list({ page: targetPage, pageSize }, signal),
          v3Api.admin.analytics.quizzes(signal)
        ]);
        setInventory(invRes);
        setAnalytics(anaRes);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load quizzes and analytics.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchAll(page, controller.signal);
    return () => controller.abort();
  }, [page, fetchAll]);

  const analyticsByQuizId = useMemo(() => {
    const map = new Map<string, AdminQuizAnalyticsResponse['perQuiz'][number]>();
    for (const row of analytics?.perQuiz ?? []) {
      map.set(row.quizId, row);
    }
    return map;
  }, [analytics]);

  const handleSaveQuiz = async (
    payload:
      | { mode: 'create'; data: CreateQuizInput }
      | { mode: 'edit'; id: string; data: UpdateQuizInput }
  ) => {
    if (payload.mode === 'create') {
      await v3Api.admin.quizzes.create(payload.data);
      showToast({ title: 'Quiz created', tone: 'success' });
    } else {
      await v3Api.admin.quizzes.update(payload.id, payload.data);
      showToast({ title: 'Quiz updated', tone: 'success' });
    }
    await fetchAll(page);
  };

  const handleTogglePublished = async (quiz: QuizRow) => {
    try {
      await v3Api.admin.quizzes.update(quiz.id, { isPublished: !quiz.is_published });
      showToast({
        title: quiz.is_published ? 'Quiz unpublished' : 'Quiz published',
        tone: 'info'
      });
      await fetchAll(page);
    } catch (err) {
      showToast({
        title: 'Status update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error'
      });
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await v3Api.admin.quizzes.remove(deleteTarget.id);
      showToast({ title: 'Quiz deleted', tone: 'info' });
      setDeleteTarget(null);
      await fetchAll(page);
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete quiz.',
        tone: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const quizzes = inventory?.items ?? [];
  const totalQuizzes = inventory?.pagination.totalItems ?? quizzes.length;
  const totalAttempts = (analytics?.perQuiz ?? []).reduce((sum, q) => sum + q.attemptCount, 0);
  const avgPassRate = useMemo(() => {
    const active = (analytics?.perQuiz ?? []).filter((q) => q.attemptCount > 0);
    if (active.length === 0) {
      return 0;
    }
    const totalRate = active.reduce((sum, q) => sum + q.passRatePercentage, 0);
    return Math.round(totalRate / active.length);
  }, [analytics]);

  const kpis = [
    { label: 'Total Quizzes', value: String(totalQuizzes), icon: ClipboardCheck },
    { label: 'Total Student Attempts', value: totalAttempts.toLocaleString(), icon: Award },
    { label: 'Average Pass Rate', value: `${avgPassRate}%`, icon: ShieldAlert }
  ];

  const missedQuestions = analytics?.mostMissedQuestions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={() => void fetchAll(page)}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Refresh</span>
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            setEditingQuiz(null);
            setFormModalOpen(true);
          }}
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>New Quiz / Mock</span>
        </Button>
      </div>

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
                {loading && !inventory ? '...' : item.value}
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
                Could not load quizzes
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)]">{errorMsg}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void fetchAll(page)}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 space-y-4">
            {loading && !inventory ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 space-y-3">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
              </div>
            ) : quizzes.length === 0 ? (
              <EmptyStateCard
                icon={ClipboardCheck}
                title="No quizzes configured yet"
                description="Create your first Practice Quiz or Timed Full-Length Mock Exam to begin assigning questions."
                primaryAction={{
                  label: 'Create First Quiz',
                  onClick: () => {
                    setEditingQuiz(null);
                    setFormModalOpen(true);
                  }
                }}
              />
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
                  <h2 className="type-card-title text-[var(--color-ink)]">
                    Quiz Catalog &amp; Score Breakdown
                  </h2>
                  <span className="text-xs text-[var(--color-ink-muted)] font-semibold">
                    {quizzes.length} on page
                  </span>
                </div>

                <div className="md:hidden px-4 py-2 text-[11px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-surface-soft)] border-b border-[var(--color-border)]">
                  Swipe horizontally to view all quiz columns and actions
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                        <th scope="col" className="py-3 px-4">Quiz Title</th>
                        <th scope="col" className="py-3 px-4">Mode / Rules</th>
                        <th scope="col" className="py-3 px-4">Attempts</th>
                        <th scope="col" className="py-3 px-4">Avg Score</th>
                        <th scope="col" className="py-3 px-4">Pass Rate</th>
                        <th scope="col" className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {quizzes.map((quiz) => {
                        const stats = analyticsByQuizId.get(quiz.id);
                        return (
                          <tr
                            key={quiz.id}
                            className="hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[var(--color-ink)]">
                                  {quiz.title}
                                </span>
                                {!quiz.is_published ? (
                                  <Badge variant="neutral">Draft</Badge>
                                ) : null}
                              </div>
                              <div className="text-xs text-[var(--color-ink-muted)]">
                                {quiz.subject} - {quiz.exam_tag} ({quiz.language.toUpperCase()})
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[var(--color-ink-secondary)]">
                              <div className="mb-1">
                                <Badge variant={quiz.type === 'mock' ? 'prepare' : 'feature'}>
                                  {quiz.type === 'mock' ? 'Mock Exam' : 'Practice'}
                                </Badge>
                              </div>
                              <div>
                                {quiz.time_limit_seconds
                                  ? `${Math.round(quiz.time_limit_seconds / 60)}m timer`
                                  : 'Untimed'}
                                {quiz.negative_marking
                                  ? `, -${quiz.negative_marking_value} neg`
                                  : ''}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[var(--color-ink)] tabular-nums">
                              {stats?.attemptCount ?? 0}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[var(--color-brand-deep)] tabular-nums">
                              {stats ? `${Math.round(stats.averageScorePercentage)}%` : '0%'}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-[var(--color-ink-secondary)] tabular-nums">
                              {stats ? `${Math.round(stats.passRatePercentage)}%` : '0%'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void handleTogglePublished(quiz)}
                                  title={quiz.is_published ? 'Unpublish quiz' : 'Publish quiz'}
                                  aria-label={
                                    quiz.is_published
                                      ? `Unpublish ${quiz.title}`
                                      : `Publish ${quiz.title}`
                                  }
                                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] cursor-pointer"
                                >
                                  {quiz.is_published ? (
                                    <Eye className="w-4 h-4 text-[var(--color-brand-deep)]" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuiz(quiz);
                                    setFormModalOpen(true);
                                  }}
                                  title="Edit quiz"
                                  aria-label={`Edit ${quiz.title}`}
                                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(quiz)}
                                  title="Delete quiz"
                                  aria-label={`Delete ${quiz.title}`}
                                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-[var(--radius-control)] text-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)] cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <PaginationBar
              page={page}
              totalPages={inventory?.pagination.totalPages ?? 1}
              totalItems={totalQuizzes}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="quizzes"
            />
          </div>

          <aside className="xl:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="type-card-title text-[var(--color-ink)]">
                Most Commonly Missed Questions
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Top items ranked by wrong-answer rate across student attempts
              </p>
            </div>

            {missedQuestions.length === 0 ? (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                No missed-question patterns recorded yet. This list updates automatically as students
                submit quizzes.
              </div>
            ) : (
              <ul className="space-y-3">
                {missedQuestions.slice(0, 8).map((q, idx) => (
                  <li
                    key={q.questionId}
                    className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                        #{idx + 1} {q.subject ? `- ${q.subject}` : ''}
                      </span>
                      <Badge variant="error">{Math.round(q.missRatePercentage)}% missed</Badge>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-ink)] line-clamp-2">
                      {q.textEn || q.textUr || 'Question text unavailable'}
                    </p>
                    <div className="text-[11px] text-[var(--color-ink-muted)] tabular-nums">
                      {q.timesMissed} wrong out of {q.timesAnswered} answers
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      <QuizFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initialQuiz={editingQuiz}
        onSave={handleSaveQuiz}
      />

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quiz Permanently?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-[var(--color-ink)]">{deleteTarget?.title}</strong>?
            Linked questions or historical attempts referencing this quiz may be affected.
          </p>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={deleting}
              onClick={() => void handleDeleteQuiz()}
            >
              Delete Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
