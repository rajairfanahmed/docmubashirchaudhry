'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Filter, RotateCcw, Search } from 'lucide-react';
import type { QuizType } from '@/lib/supabase/database.types';
import type { PaginationMeta, QuizSummaryItem } from '@/lib/v3/types';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { SelectField, SkeletonBlock, TextInput } from '@/components/ui/FormPrimitives';
import { Button } from '@/components/ui/Button';
import { QuizCatalogCard } from '@/components/quizzes/QuizCatalogCard';
import { cn } from '@/lib/utils';

export interface QuizCatalogClientProps {
  initialItems: QuizSummaryItem[];
  initialPagination: PaginationMeta;
  initialConfigured?: boolean;
}

const EXAM_TAGS = ['PPSC', 'FPSC', 'CSS', 'PMS', 'NTS', 'FIA', 'PERA'];

export function QuizCatalogClient({
  initialItems,
  initialPagination,
  initialConfigured = true
}: QuizCatalogClientProps) {
  const [items, setItems] = useState<QuizSummaryItem[]>(initialItems);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [configured, setConfigured] = useState(initialConfigured);

  const [typeFilter, setTypeFilter] = useState<'' | QuizType>('');
  const [examTagFilter, setExamTagFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const urlType = sp.get('type');
    const urlExam = sp.get('exam') ?? '';
    const urlSubject = sp.get('subject') ?? '';
    const urlQuery = sp.get('q') ?? '';
    const rawPage = Number(sp.get('page') ?? '1');
    const urlPage = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : 1;

    const validType: '' | QuizType = urlType === 'practice' || urlType === 'mock' ? urlType : '';
    if (validType || urlExam || urlSubject || urlQuery || urlPage > 1) {
      setTypeFilter(validType);
      setExamTagFilter(urlExam);
      setSubjectFilter(urlSubject);
      setSearchInput(urlQuery);
      setPage(urlPage);
      setHasInteracted(true);
    }
  }, []);

  useEffect(() => {
    if (!hasInteracted || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (examTagFilter) params.set('exam', examTagFilter);
    if (subjectFilter.trim()) params.set('subject', subjectFilter.trim());
    if (searchInput.trim()) params.set('q', searchInput.trim());
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [hasInteracted, page, typeFilter, examTagFilter, subjectFilter, searchInput]);

  useEffect(() => {
    if (!hasInteracted && reloadNonce === 0) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await v3Api.quizzes.list(
          {
            page,
            pageSize: 12,
            type: typeFilter || undefined,
            examTag: examTagFilter || undefined,
            subject: subjectFilter.trim() || undefined,
            search: searchInput.trim() || undefined
          },
          controller.signal
        );
        setConfigured(res.configured !== false);
        setItems(res.items);
        setPagination(res.pagination);
      } catch (err) {
        if (!controller.signal.aborted) {
          setErrorMsg(
            isV3ClientError(err) ? err.message : 'Unable to load quizzes right now.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hasInteracted, page, typeFilter, examTagFilter, subjectFilter, searchInput, reloadNonce]);

  const handleModeChange = (nextType: '' | QuizType) => {
    setHasInteracted(true);
    setTypeFilter(nextType);
    setPage(1);
  };

  const handleResetFilters = () => {
    setHasInteracted(true);
    setTypeFilter('');
    setExamTagFilter('');
    setSubjectFilter('');
    setSearchInput('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(typeFilter || examTagFilter || subjectFilter || searchInput);

  return (
    <div className="space-y-6">
      {/* Interactive Filter Toolbar */}
      <div
        aria-label="Quiz Catalog Filter Controls"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Quiz mode filter">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mr-1">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mode</span>
            </span>

            {(
              [
                { value: '', label: 'All Quizzes' },
                { value: 'practice', label: 'Practice Quizzes' },
                { value: 'mock', label: 'Timed Mock Exams' }
              ] as const
            ).map((option) => {
              const active = typeFilter === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleModeChange(option.value)}
                  className={cn(
                    'dmc-press inline-flex items-center min-h-[44px] sm:min-h-[38px] px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]',
                    active
                      ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                      : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-auto lg:min-w-[520px]">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <TextInput
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setHasInteracted(true);
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search quizzes..."
                aria-label="Search quizzes by keyword"
                className="pl-9"
              />
            </div>

            <SelectField
              aria-label="Filter by exam commission"
              value={examTagFilter}
              onChange={(e) => {
                setHasInteracted(true);
                setExamTagFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Exam: All Tags</option>
              {EXAM_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </SelectField>

            <TextInput
              type="text"
              value={subjectFilter}
              onChange={(e) => {
                setHasInteracted(true);
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter subject..."
              aria-label="Filter quizzes by subject"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)] text-xs">
          <span aria-live="polite" className="font-semibold text-[var(--color-ink)] tabular-nums">
            {pagination.totalItems} quiz{pagination.totalItems === 1 ? '' : 'zes'} available
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-[36px] px-2 font-semibold text-[var(--color-brand-deep)] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-[var(--radius-panel)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-danger-ink)]"
        >
          <span>{errorMsg}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadNonce((n) => n + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <SkeletonBlock className="h-60" />
          <SkeletonBlock className="h-60" />
          <SkeletonBlock className="h-60" />
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((quiz) => (
              <QuizCatalogCard key={quiz.id} quiz={quiz} />
            ))}
          </div>

          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={(nextPage) => {
              setHasInteracted(true);
              setPage(nextPage);
            }}
            itemLabel="quizzes"
          />
        </>
      ) : hasActiveFilters ? (
        <EmptyStateCard
          icon={ClipboardCheck}
          title="No quizzes matched your filters"
          description="Try clearing the exam tag, subject, or search keyword filters to view all published quizzes."
          primaryAction={{
            label: 'Reset Filters',
            onClick: handleResetFilters
          }}
          secondaryAction={{
            label: 'Topic MCQ Practice',
            href: '/mcq'
          }}
        />
      ) : (
        <EmptyStateCard
          icon={ClipboardCheck}
          title={configured ? 'No published quizzes loaded yet' : 'Quizzes catalog initializing'}
          description="Published practice drills and timed PPSC/FPSC mock exams authored in the admin workspace appear here automatically. Meanwhile, practice with the open Geography Recall Quiz or Topic MCQ Bank."
          primaryAction={{ label: 'Topic MCQ Practice', href: '/mcq' }}
          secondaryAction={{ label: 'World Geography Quiz', href: '/geography#quiz-module' }}
        />
      )}
    </div>
  );
}

