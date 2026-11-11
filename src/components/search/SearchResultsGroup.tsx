'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Globe, Layers, Search } from 'lucide-react';
import type { SearchHit } from '@/lib/search';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export interface SearchTopicHit {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResultsGroupProps {
  query: string;
  hits: SearchHit[];
  topicHits: SearchTopicHit[];
}

type GroupFilterKey = 'all' | 'pdf' | 'country' | 'exam' | 'topics_mcqs';

export function SearchResultsGroup({
  query,
  hits,
  topicHits
}: SearchResultsGroupProps) {
  const [activeTab, setActiveTab] = useState<GroupFilterKey>('all');

  const grouped = useMemo(() => {
    const pdfs = hits.filter((h) => h.type === 'pdf');
    const countries = hits.filter((h) => h.type === 'country');
    const exams = hits.filter((h) => h.type === 'exam' || h.type === 'post');
    const questions = hits.filter((h) => h.type === 'question');
    return { pdfs, countries, exams, questions };
  }, [hits]);

  const totalCount =
    grouped.pdfs.length +
    grouped.countries.length +
    grouped.exams.length +
    topicHits.length +
    grouped.questions.length;

  const tabs: { key: GroupFilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All Results', count: totalCount },
    { key: 'pdf', label: 'PDFs', count: grouped.pdfs.length },
    { key: 'country', label: 'Countries', count: grouped.countries.length },
    { key: 'exam', label: 'Exams & Posts', count: grouped.exams.length },
    { key: 'topics_mcqs', label: 'Topics & MCQs', count: topicHits.length + grouped.questions.length }
  ];

  if (totalCount === 0) {
    return (
      <EmptyStateCard
        icon={Search}
        title={`No Matches Found for "${query}"`}
        description="Try searching with a shorter keyword, country name, PPSC cadence, or browse our direct hubs below."
        primaryAction={{ label: 'Browse Exam Hubs', href: '/exams' }}
        secondaryAction={{ label: 'Open Geography Guide', href: '/geography' }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--dmc-border-subtle)]">
        <h2 id="search-results-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
          Results for &ldquo;{query}&rdquo; ({totalCount})
        </h2>

        <div role="tablist" aria-label="Filter search results by type" className="flex flex-wrap gap-2">
          {tabs.map((tab, idx) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`search-tab-${tab.key}`}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                aria-controls="search-results-panel"
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => {
                  let targetIndex = -1;
                  if (e.key === 'ArrowRight') targetIndex = (idx + 1) % tabs.length;
                  else if (e.key === 'ArrowLeft') targetIndex = (idx - 1 + tabs.length) % tabs.length;
                  else if (e.key === 'Home') targetIndex = 0;
                  else if (e.key === 'End') targetIndex = tabs.length - 1;
                  if (targetIndex >= 0) {
                    e.preventDefault();
                    const nextTab = tabs[targetIndex];
                    setActiveTab(nextTab.key);
                    document.getElementById(`search-tab-${nextTab.key}`)?.focus();
                  }
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                  active
                    ? 'bg-[var(--dmc-brand-forest)] text-white border-[var(--dmc-brand-forest)]'
                    : 'bg-[var(--dmc-surface-card)] text-[var(--dmc-ink-secondary)] border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="search-results-panel"
        role="tabpanel"
        aria-labelledby={`search-tab-${activeTab}`}
        className="space-y-6"
      >

      {activeTab === 'all' && (
        <nav
          aria-label="Jump to search result sections"
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="font-bold text-[var(--dmc-ink-muted)] mr-1">Jump to:</span>
          {grouped.pdfs.length > 0 && (
            <a
              href="#group-pdfs"
              className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] hover:border-[var(--dmc-brand-forest)] font-semibold"
            >
              PDFs ({grouped.pdfs.length})
            </a>
          )}
          {grouped.countries.length > 0 && (
            <a
              href="#group-countries"
              className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] hover:border-[var(--dmc-brand-forest)] font-semibold"
            >
              Countries ({grouped.countries.length})
            </a>
          )}
          {grouped.exams.length > 0 && (
            <a
              href="#group-exams"
              className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] hover:border-[var(--dmc-brand-forest)] font-semibold"
            >
              Exams &amp; Posts ({grouped.exams.length})
            </a>
          )}
          {(topicHits.length > 0 || grouped.questions.length > 0) && (
            <a
              href="#group-topics"
              className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] hover:border-[var(--dmc-brand-forest)] font-semibold"
            >
              Topics &amp; MCQs ({topicHits.length + grouped.questions.length})
            </a>
          )}
        </nav>
      )}

      <div className="space-y-8">
        {(activeTab === 'all' || activeTab === 'pdf') && grouped.pdfs.length > 0 && (
          <section aria-labelledby="group-pdfs" className="space-y-3">
            <h3
              id="group-pdfs"
              className="scroll-mt-24 text-xs font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)] flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[var(--dmc-accent-gold-hover)]" aria-hidden="true" />
              <span>PDF Booklets ({grouped.pdfs.length})</span>
            </h3>
            <div className="space-y-2.5">
              {grouped.pdfs.map((hit) => (
                <Link
                  key={hit.id}
                  href={hit.url}
                  className="flex items-center justify-between gap-3 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-xl p-4 elevation-1"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--dmc-ink-primary)]">{hit.title}</div>
                    <div className="text-xs text-[var(--dmc-ink-secondary)] mt-0.5">{hit.subtitle}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'country') && grouped.countries.length > 0 && (
          <section aria-labelledby="group-countries" className="space-y-3">
            <h3
              id="group-countries"
              className="scroll-mt-24 text-xs font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)] flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>Countries ({grouped.countries.length})</span>
            </h3>
            <div className="space-y-2.5">
              {grouped.countries.map((hit) => (
                <Link
                  key={hit.id}
                  href={hit.url}
                  className="flex items-center justify-between gap-3 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-xl p-4 elevation-1"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--dmc-ink-primary)]">{hit.title}</div>
                    <div className="text-xs text-[var(--dmc-ink-secondary)] mt-0.5">{hit.subtitle}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'exam') && grouped.exams.length > 0 && (
          <section aria-labelledby="group-exams" className="space-y-3">
            <h3
              id="group-exams"
              className="scroll-mt-24 text-xs font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
              <span>Exams &amp; Recruitment Posts ({grouped.exams.length})</span>
            </h3>
            <div className="space-y-2.5">
              {grouped.exams.map((hit) => (
                <Link
                  key={hit.id}
                  href={hit.url}
                  className="flex items-center justify-between gap-3 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-xl p-4 elevation-1"
                >
                  <div>
                    <div className="font-bold text-sm text-[var(--dmc-ink-primary)]">{hit.title}</div>
                    <div className="text-xs text-[var(--dmc-ink-secondary)] mt-0.5">{hit.subtitle}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'topics_mcqs') &&
          (topicHits.length > 0 || grouped.questions.length > 0) && (
            <section aria-labelledby="group-topics" className="space-y-3">
              <h3
                id="group-topics"
                className="scroll-mt-24 text-xs font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)] flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-purple-700" aria-hidden="true" />
                <span>Topics &amp; Questions ({topicHits.length + grouped.questions.length})</span>
              </h3>
              <div className="space-y-2.5">
                {topicHits.map((t) => (
                  <Link
                    key={t.id}
                    href={t.url}
                    className="flex items-center justify-between gap-3 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-xl p-4 elevation-1"
                  >
                    <div>
                      <div className="font-bold text-sm text-[var(--dmc-ink-primary)]">{t.title}</div>
                      <div className="text-xs text-[var(--dmc-ink-secondary)] mt-0.5">{t.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
                  </Link>
                ))}
                {grouped.questions.map((hit) => (
                  <Link
                    key={hit.id}
                    href={hit.url}
                    className="flex items-center justify-between gap-3 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)] rounded-xl p-4 elevation-1"
                  >
                    <div>
                      <div className="font-bold text-sm text-[var(--dmc-ink-primary)]">{hit.title}</div>
                      <div className="text-xs text-[var(--dmc-ink-secondary)] mt-0.5">{hit.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
      </div>
      </div>
    </div>
  );
}

