'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BookOpen, Loader2, PlayCircle, RotateCcw } from 'lucide-react';
import type { Question, Subject, Topic } from '@/lib/schemas';
import { fetchQuestionsPage } from '@/lib/api';
import {
  buildPaginatedSearchParams,
  MCQ_DEFAULT_PAGE_SIZE,
  parsePageParam
} from '@/lib/pagination';
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider';
import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PaginationBar } from '@/components/ui/PaginationBar';

export interface McqQuestionsPreviewListProps {
  questions: Question[];
  subjects?: Subject[];
  topics?: Topic[];
  examId?: string;
  subjectId?: string;
  topicIds?: string[];
  page?: number;
  onPageChange?: (page: number) => void;
  syncUrlPage?: boolean;
  practiceHrefBase?: string;
  showAnswerKey?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick?: () => void; href?: string };
}

/**
 * Paginated MCQ preview list powered by `/api/questions` (`fetchQuestionsPage`, 20/page)
 * with client fallback, inline error retry, and accessible loading/empty states.
 */
export function McqQuestionsPreviewList({
  questions,
  subjects = [],
  topics = [],
  examId,
  subjectId,
  topicIds,
  page: controlledPage,
  onPageChange,
  syncUrlPage = false,
  practiceHrefBase = '/mcq/practice',
  showAnswerKey = true,
  emptyTitle = 'Questions Queued for Verification',
  emptyDescription = 'No published MCQs match this selection yet.',
  emptyAction
}: McqQuestionsPreviewListProps) {
  const [internalPage, setInternalPage] = useState(1);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [remoteSlice, setRemoteSlice] = useState<{
    queryKey: string;
    items: Question[];
    page: number;
    totalPages: number;
    totalItems: number;
  } | null>(null);

  const listTopRef = useRef<HTMLDivElement>(null);
  const { scrollToTarget } = useSmoothScroll();

  useEffect(() => {
    if (syncUrlPage && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      setInternalPage(parsePageParam(sp.get('page'), 1));
    }
    setHasHydrated(true);
  }, [syncUrlPage]);

  const activePage = controlledPage ?? internalPage;
  const topicIdsKey = topicIds?.join(',') ?? '';
  const queryKey = [activePage, examId ?? '', subjectId ?? '', topicIdsKey].join('|');

  useEffect(() => {
    if (!hasHydrated) return;

    const hasServerProvidedPageOne =
      activePage === 1 &&
      retryTick === 0 &&
      (questions.length <= MCQ_DEFAULT_PAGE_SIZE ||
        (!examId && !subjectId && !topicIdsKey));

    if (hasServerProvidedPageOne) {
      setRemoteSlice(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadSlice = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const parsedTopicIds = topicIdsKey ? topicIdsKey.split(',').filter(Boolean) : undefined;
        const res = await fetchQuestionsPage({
          page: activePage,
          pageSize: MCQ_DEFAULT_PAGE_SIZE,
          examId: examId || undefined,
          subjectId: subjectId || undefined,
          topicIds: parsedTopicIds && parsedTopicIds.length > 0 ? parsedTopicIds : undefined
        });
        if (!cancelled) {
          setRemoteSlice({
            queryKey,
            items: res.items,
            page: res.pagination.page,
            totalPages: res.pagination.totalPages,
            totalItems: res.pagination.totalItems
          });
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not refresh MCQ list from API.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSlice();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, queryKey, activePage, examId, subjectId, topicIdsKey, retryTick]);

  const topicMap = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const localTotalPages = Math.max(1, Math.ceil(questions.length / MCQ_DEFAULT_PAGE_SIZE));
  const safeLocalPage = Math.min(Math.max(1, activePage), localTotalPages);
  const localItems = useMemo(() => {
    const start = (safeLocalPage - 1) * MCQ_DEFAULT_PAGE_SIZE;
    return questions.slice(start, start + MCQ_DEFAULT_PAGE_SIZE);
  }, [questions, safeLocalPage]);

  const matched = remoteSlice?.queryKey === queryKey;
  const displayedItems = matched ? remoteSlice.items : localItems;
  const displayedPage = matched ? remoteSlice.page : safeLocalPage;
  const displayedTotalPages = matched ? remoteSlice.totalPages : localTotalPages;
  const displayedTotalItems = matched ? remoteSlice.totalItems : questions.length;

  const handlePageSelect = (nextPage: number) => {
    const bounded = Math.max(1, Math.min(nextPage, displayedTotalPages));
    if (onPageChange) {
      onPageChange(bounded);
    } else {
      setInternalPage(bounded);
      if (syncUrlPage && typeof window !== 'undefined') {
        const nextParams = buildPaginatedSearchParams(window.location.search, bounded);
        const qs = nextParams.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
      }
    }
    if (typeof window !== 'undefined' && listTopRef.current) {
      scrollToTarget(listTopRef.current, { offset: -80, immediate: isReducedMotionPreferred() });
    }
  };

  if (displayedTotalItems === 0 && !isLoading) {
    return (
      <EmptyStateCard
        icon={BookOpen}
        title={emptyTitle}
        description={emptyDescription}
        primaryAction={emptyAction}
      />
    );
  }

  return (
    <div ref={listTopRef} className="space-y-4 scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--dmc-ink-muted)]">
        <span aria-live="polite" className="font-semibold tabular-nums flex items-center gap-2">
          <span>
            {displayedTotalItems} published question{displayedTotalItems === 1 ? '' : 's'} in preview
          </span>
          {isLoading && (
            <Loader2
              className="w-3.5 h-3.5 animate-spin text-[var(--dmc-brand-forest)] shrink-0"
              aria-label="Loading questions"
            />
          )}
        </span>
      </div>

      {loadError && (
        <div
          role="alert"
          className="bg-[var(--dmc-status-unverified-bg)] border border-[var(--dmc-status-unverified-border)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--dmc-ink-primary)]"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-[var(--dmc-status-unverified-icon)] shrink-0" aria-hidden="true" />
            <span>{loadError} Showing local snapshot.</span>
          </span>
          <button
            type="button"
            onClick={() => setRetryTick((n) => n + 1)}
            className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg bg-white border border-[var(--dmc-border-subtle)] font-bold text-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-surface-muted)] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry Load</span>
          </button>
        </div>
      )}

      <div className={`space-y-3 transition-opacity duration-150 ${isLoading ? 'opacity-65' : 'opacity-100'}`}>
        {displayedItems.map((q, idx) => {
          const globalIndex = (displayedPage - 1) * MCQ_DEFAULT_PAGE_SIZE + idx + 1;
          const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
          const firstTopic = topicMap.get(q.topicIds[0] ?? '');
          const firstSubject = firstTopic ? subjectMap.get(firstTopic.subjectId) : undefined;
          const practiceHref = firstSubject && firstTopic
            ? `/mcq/practice?subject=${firstSubject.slug}&topic=${firstTopic.slug}`
            : practiceHrefBase;

          return (
            <article
              key={q.id}
              className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-5 elevation-1 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)] tabular-nums">
                  <span>Question {globalIndex}</span>
                  <span>&middot;</span>
                  <span>{q.difficulty}</span>
                </div>
                {firstSubject && (
                  <SubjectIconChip
                    subjectId={firstSubject.id}
                    label={firstTopic ? `${firstSubject.name} · ${firstTopic.name}` : firstSubject.name}
                    size="sm"
                  />
                )}
              </div>

              <h3 className="font-bold text-sm sm:text-base text-[var(--dmc-ink-primary)] leading-snug">
                {q.stem}
              </h3>

              {showAnswerKey && correctOpt && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--dmc-ink-muted)]">Verified Answer:</span>
                  <AnswerHighlight shape="chip">{correctOpt.text}</AnswerHighlight>
                </div>
              )}

              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                {q.explanation}
              </p>

              <div className="pt-1 flex justify-end">
                <Link
                  href={practiceHref}
                  className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-status-verified-bg)] transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Practice Interactive Quiz</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <PaginationBar
        page={displayedPage}
        totalPages={displayedTotalPages}
        totalItems={displayedTotalItems}
        pageSize={MCQ_DEFAULT_PAGE_SIZE}
        onPageChange={handlePageSelect}
        itemLabel="questions"
      />
    </div>
  );
}
