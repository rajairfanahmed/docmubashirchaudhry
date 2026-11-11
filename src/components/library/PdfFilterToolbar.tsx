'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileSearch, RotateCcw, Search } from 'lucide-react';
import type { LibraryCatalogProps, PdfFilterState, PdfSortOption } from './types';
import { derivePdfYear } from '@/lib/format';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PdfResourceCard } from './PdfResourceCard';

const INITIAL_FILTER = (scopedExamSlug = ''): PdfFilterState => ({
  search: '',
  examSlug: scopedExamSlug,
  subjectId: '',
  topicId: '',
  year: '',
  resourceType: '',
  sort: 'newest'
});

export function PdfFilterToolbar({
  resources,
  exams,
  subjects,
  topics,
  scopedExamSlug
}: LibraryCatalogProps) {
  const [filter, setFilter] = useState<PdfFilterState>(() => INITIAL_FILTER(scopedExamSlug ?? ''));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q') ?? '';
    const exam = scopedExamSlug ?? (sp.get('exam') ?? '');
    const subject = sp.get('subject') ?? '';
    const topic = sp.get('topic') ?? '';
    const year = sp.get('year') ?? '';
    const typeParam = sp.get('type');
    const sortParam = sp.get('sort');
    const resourceType =
      typeParam === 'solved' || typeParam === 'syllabus' ? typeParam : '';
    const sort: PdfSortOption =
      sortParam === 'newest' ||
      sortParam === 'questions' ||
      sortParam === 'size' ||
      sortParam === 'title'
        ? sortParam
        : 'newest';

    setFilter({
      search: q,
      examSlug: exam,
      subjectId: subject,
      topicId: topic,
      year,
      resourceType,
      sort
    });
  }, [scopedExamSlug]);

  const updateFilter = (next: PdfFilterState) => {
    setFilter(next);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const assignOrDelete = (key: string, val: string) => {
      if (val) url.searchParams.set(key, val);
      else url.searchParams.delete(key);
    };
    assignOrDelete('q', next.search.trim());
    if (!scopedExamSlug) assignOrDelete('exam', next.examSlug);
    assignOrDelete('subject', next.subjectId);
    assignOrDelete('topic', next.topicId);
    assignOrDelete('year', next.year);
    assignOrDelete('type', next.resourceType);
    assignOrDelete('sort', next.sort !== 'newest' ? next.sort : '');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const topicMap = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    for (const r of resources) {
      const y = derivePdfYear(r);
      if (y) yrs.add(String(y));
    }
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a));
  }, [resources]);

  const visibleTopics = useMemo(() => {
    if (!filter.subjectId) return topics;
    return topics.filter((t) => t.subjectId === filter.subjectId);
  }, [topics, filter.subjectId]);

  const filteredResources = useMemo(() => {
    const q = filter.search.trim().toLowerCase();

    const list = resources.filter((pdf) => {
      if (q) {
        const hay = `${pdf.title} ${pdf.summary} ${pdf.author} ${pdf.edition} ${pdf.gradeLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (filter.examSlug) {
        const matchesExam =
          pdf.slug.includes(filter.examSlug) ||
          pdf.postIds.some((pid) => pid.includes(filter.examSlug)) ||
          (filter.examSlug === 'ppsc' && pdf.postIds.length > 0);
        if (!matchesExam) return false;
      }

      if (filter.topicId && !pdf.topicIds.includes(filter.topicId)) {
        return false;
      }

      if (filter.subjectId) {
        const matchesSubject = pdf.topicIds.some((tid) => {
          const t = topicMap.get(tid);
          return t?.subjectId === filter.subjectId;
        });
        if (!matchesSubject) return false;
      }

      if (filter.year) {
        const derived = derivePdfYear(pdf);
        if (String(derived ?? '') !== filter.year) return false;
      }

      if (filter.resourceType === 'solved' && !(pdf.questionCount && pdf.questionCount > 0)) {
        return false;
      }
      if (filter.resourceType === 'syllabus' && Boolean(pdf.questionCount && pdf.questionCount > 0)) {
        return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (filter.sort === 'title') return a.title.localeCompare(b.title);
      if (filter.sort === 'size') return b.fileSizeBytes - a.fileSizeBytes;
      if (filter.sort === 'questions') return (b.questionCount ?? 0) - (a.questionCount ?? 0);
      const yrDiff = Number(derivePdfYear(b) ?? 0) - Number(derivePdfYear(a) ?? 0);
      if (yrDiff !== 0) return yrDiff;
      return b.verification.lastCheckedAt.localeCompare(a.verification.lastCheckedAt);
    });
  }, [resources, filter, topicMap]);

  const hasFilters = Boolean(
    filter.search ||
      (!scopedExamSlug && filter.examSlug) ||
      filter.subjectId ||
      filter.topicId ||
      filter.year ||
      filter.resourceType ||
      filter.sort !== 'newest'
  );

  const handleReset = () => updateFilter(INITIAL_FILTER(scopedExamSlug ?? ''));

  return (
    <div className="space-y-8">
      <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-5 elevation-1 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="lg:col-span-2 relative">
            <Search
              className="w-4 h-4 text-[var(--dmc-ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filter.search}
              onChange={(e) => updateFilter({ ...filter, search: e.target.value })}
              aria-label="Search PDF titles and authors"
              placeholder="Search booklet title, scale, or author..."
              className="w-full h-11 pl-10 pr-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs sm:text-sm text-[var(--dmc-ink-primary)] placeholder:text-[var(--dmc-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
            />
          </div>

          {!scopedExamSlug && (
            <select
              aria-label="Filter by exam"
              value={filter.examSlug}
              onChange={(e) => updateFilter({ ...filter, examSlug: e.target.value })}
              className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.slug}>
                  {exam.bodyCode}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Filter by subject"
            value={filter.subjectId}
            onChange={(e) => updateFilter({ ...filter, subjectId: e.target.value, topicId: '' })}
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by topic"
            value={filter.topicId}
            onChange={(e) => updateFilter({ ...filter, topicId: e.target.value })}
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="">All Topics ({visibleTopics.length})</option>
            {visibleTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by year"
            value={filter.year}
            onChange={(e) => updateFilter({ ...filter, year: e.target.value })}
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort PDF booklets"
            value={filter.sort}
            onChange={(e) => updateFilter({ ...filter, sort: e.target.value as PdfSortOption })}
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs font-semibold text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="newest">Sort: Newest</option>
            <option value="questions">Sort: Most Questions</option>
            <option value="size">Sort: File Size</option>
            <option value="title">Sort: Title A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="library-type-filter" className="text-[var(--dmc-ink-muted)] font-semibold">
              Type:
            </label>
            <select
              id="library-type-filter"
              value={filter.resourceType}
              onChange={(e) => updateFilter({ ...filter, resourceType: e.target.value })}
              className="h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
            >
              <option value="">All Resource Types</option>
              <option value="solved">Solved MCQ Compilations</option>
              <option value="syllabus">Reference / Guides</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span aria-live="polite" className="font-bold text-[var(--dmc-ink-primary)] tabular-nums">
              {filteredResources.length} booklet{filteredResources.length === 1 ? '' : 's'}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 min-h-[44px] px-2 font-bold text-[var(--dmc-brand-forest)] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <EmptyStateCard
          icon={FileSearch}
          title="No PDF Booklets Match Current Filters"
          description="Try resetting your subject, year, or search keyword filters to view all free open-access booklets."
          primaryAction={{
            label: 'Reset Filters',
            onClick: handleReset
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((pdf) => {
            const firstTopic = topicMap.get(pdf.topicIds[0] ?? '');
            const firstSubject = firstTopic ? subjectMap.get(firstTopic.subjectId) : undefined;
            return (
              <PdfResourceCard
                key={pdf.id}
                pdf={pdf}
                subjectLabel={firstSubject?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
