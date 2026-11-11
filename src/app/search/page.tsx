import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { SearchResultsGroup } from '@/components/search/SearchResultsGroup';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Search Repository | PDFs, Countries, Exams & Topics',
  description:
    'Search across downloadable solved MCQ PDF booklets, verified sovereign countries, PPSC exams, and subject study topics.',
  path: '/search',
  index: false,
  follow: true
});

function firstString(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = firstString(sp.q).trim();

  const repo = getContentRepository();
  const [hits, topics, subjects] = await Promise.all([
    query ? repo.search(query) : Promise.resolve([]),
    repo.getTopics(),
    repo.getSubjects()
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicHits = query
    ? topics
        .filter(
          (t) =>
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.description.toLowerCase().includes(query.toLowerCase())
        )
        .map((t) => {
          const subj = subjectMap.get(t.subjectId);
          return {
            id: t.id,
            title: t.name,
            subtitle: t.description,
            url: `/topics/${subj?.slug ?? 'general-knowledge'}/${t.slug}`
          };
        })
    : [];

  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="search-heading">
        <div className="space-y-5">
          <Breadcrumbs items={[{ label: 'Search' }]} currentPath="/search" />

          <div className="space-y-2">
            <h1 id="search-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Search Repository
            </h1>
            <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
              Query solved PDFs, World Geography countries, PPSC/FPSC exam records, and syllabus topics in one search box.
            </p>
          </div>

          <form action="/search" method="GET" role="search" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon
                className="w-5 h-5 text-[var(--dmc-ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                enterKeyHint="search"
                name="q"
                defaultValue={query}
                aria-label="Search site directory"
                placeholder="Search e.g. Pakistan, Intelligence Officer, PPSC, Capital..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-[var(--dmc-border-subtle)] bg-white text-sm text-[var(--dmc-ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--dmc-brand-emerald)]"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm transition-colors shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="search-results-heading">
        <div className="space-y-8">
          {!query ? (
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-8 elevation-1 space-y-4">
              <h2 id="search-results-heading" className="type-card-title text-[var(--dmc-ink-primary)]">
                Quick Discovery Terms
              </h2>
              <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                Enter a country name, exam body, recruitment cadre, or topic keyword above, or select a sample query below.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Intelligence Officer', 'Pakistan', 'General Ability', 'PPSC'].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-[var(--dmc-ink-primary)] hover:text-[var(--dmc-brand-emerald)] border border-slate-200 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h2 id="search-results-heading" className="sr-only">
                Search Results
              </h2>
              <SearchResultsGroup
                query={query}
                hits={hits}
                topicHits={topicHits}
              />
            </>
          )}
        </div>
      </SectionBand>
    </>
  );
}
