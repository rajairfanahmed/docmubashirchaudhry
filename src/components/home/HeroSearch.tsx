'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Globe, HelpCircle, Loader2, RotateCcw, Search, Shield } from 'lucide-react';
import { PortalSearchEngine, type SearchHit } from '@/lib/search';
import { DATA_ENDPOINTS, fetchStaticData } from '@/lib/data/client-fetch';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { Button } from '@/components/ui/Button';

export interface HeroSearchProps {
  quickQueries?: string[];
  placeholder?: string;
}

export function HeroSearch({
  quickQueries = ['Intelligence Officer BS-14', 'Pakistan', 'General Ability', 'PPSC'],
  placeholder = 'Search exams, countries, capitals, PDFs, or MCQ topics...'
}: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const router = useRouter();
  const engineRef = useRef<PortalSearchEngine | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const inputId = useId();

  const ensureIndex = useCallback(async (bypassCache = false): Promise<PortalSearchEngine | null> => {
    if (engineRef.current && !bypassCache) return engineRef.current;

    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetchStaticData<unknown>(DATA_ENDPOINTS.searchIndex, { bypassCache });
      if (!res.ok) {
        setHasError(true);
        return null;
      }
      const serialized = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      const loaded = PortalSearchEngine.fromSerializedJson(serialized);
      engineRef.current = loaded;
      return loaded;
    } catch {
      setHasError(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const runInstantSearch = useCallback(
    async (rawText: string, bypassCache = false) => {
      const trimmed = rawText.trim();
      if (trimmed.length < 2) {
        setHits([]);
        setIsOpen(false);
        return;
      }

      if (!engineRef.current || bypassCache) {
        setIsOpen(true);
      }

      const engine = await ensureIndex(bypassCache);
      if (engine) {
        setHits(engine.search(trimmed, undefined, 6));
      }
      setIsOpen(true);
    },
    [ensureIndex]
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setIsOpen(false);
      return;
    }
    debounceTimerRef.current = window.setTimeout(() => {
      void runInstantSearch(value);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen || hits.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? hits.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && hits[activeIndex]) {
      e.preventDefault();
      setIsOpen(false);
      notifyNavigationStart();
      router.push(hits[activeIndex].url);
    }
  };

  const renderIcon = (type: SearchHit['type']) => {
    if (type === 'pdf') return <FileText className="w-4 h-4 text-[var(--dmc-accent-gold-hover)] shrink-0" aria-hidden="true" />;
    if (type === 'country') return <Globe className="w-4 h-4 text-[var(--dmc-brand-emerald)] shrink-0" aria-hidden="true" />;
    if (type === 'exam' || type === 'post') return <Shield className="w-4 h-4 text-[var(--dmc-brand-forest)] shrink-0" aria-hidden="true" />;
    return <HelpCircle className="w-4 h-4 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />;
  };

  return (
    <div ref={rootRef} className="w-full max-w-2xl mx-auto space-y-3 relative">
      <form
        action="/search"
        method="GET"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setIsOpen(false);
          const trimmed = query.trim();
          notifyNavigationStart();
          router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
        }}
        className="flex flex-col sm:flex-row gap-2.5 bg-white p-1.5 rounded-2xl elevation-2 border-2 border-transparent focus-within:border-[var(--dmc-accent-gold)] transition-colors"
      >
        <div className="relative flex-1 flex items-center">
          <Search
            className="w-5 h-5 text-[var(--dmc-ink-muted)] absolute left-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="search"
            enterKeyHint="search"
            name="q"
            value={query}
            onFocus={() => {
              void ensureIndex();
              if (hits.length > 0) setIsOpen(true);
            }}
            onChange={(e) => void handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            aria-label="Search competitive exam notes, countries, and PDF booklets"
            placeholder={placeholder}
            className="w-full h-12 pl-11 pr-9 rounded-xl bg-transparent text-sm sm:text-base text-[var(--dmc-ink-primary)] placeholder:text-[var(--dmc-ink-muted)] focus:outline-none"
          />
          {isLoading && (
            <Loader2
              className="w-4 h-4 text-[var(--dmc-brand-emerald)] animate-spin absolute right-3"
              aria-label="Loading search index"
            />
          )}
        </div>

        <Button type="submit" variant="gold" size="lg" className="rounded-xl shrink-0">
          Search
        </Button>
      </form>

      {isOpen && query.trim().length >= 2 && (
        <div
          id={listboxId}
          data-lenis-prevent
          role="listbox"
          aria-label="Instant search suggestions"
          className="dmc-drawer-enter absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-[var(--dmc-border-subtle)] rounded-2xl elevation-3 p-2 text-left max-h-[min(20rem,60dvh)] overflow-y-auto overscroll-contain"
        >
          {isLoading && hits.length === 0 ? (
            <div className="p-2 space-y-2" aria-busy="true" aria-label="Loading search suggestions">
              <div className="dmc-skeleton h-11 rounded-xl w-full" />
              <div className="dmc-skeleton h-11 rounded-xl w-full" />
              <div className="dmc-skeleton h-11 rounded-xl w-5/6" />
            </div>
          ) : hasError ? (
            <div className="px-3 py-2.5 text-xs text-[var(--dmc-ink-secondary)] flex flex-wrap items-center justify-between gap-2">
              <span>Instant suggestions unavailable right now. Press Search to browse full results.</span>
              <button
                type="button"
                onClick={() => void runInstantSearch(query, true)}
                className="inline-flex items-center gap-1 min-h-[44px] px-2 font-bold text-[var(--dmc-brand-forest)] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-3 text-xs text-[var(--dmc-ink-secondary)] flex items-center justify-between gap-2">
              <span>No instant preview match for &ldquo;{query.trim()}&rdquo;.</span>
              <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="inline-flex items-center min-h-[44px] font-bold text-[var(--dmc-brand-forest)] hover:underline">
                Full search
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <ul className="divide-y divide-[var(--dmc-border-subtle)]/60">
                {hits.map((hit, idx) => (
                  <li key={hit.id} id={`${listboxId}-opt-${idx}`} role="option" aria-selected={idx === activeIndex}>
                    <Link
                      href={hit.url}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        idx === activeIndex ? 'bg-emerald-50' : 'hover:bg-[var(--dmc-surface-muted)]'
                      }`}
                    >
                      <span className="mt-0.5">{renderIcon(hit.type)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-[var(--dmc-ink-primary)] truncate">
                          {hit.title}
                        </span>
                        <span className="block text-xs text-[var(--dmc-ink-muted)] truncate">
                          {hit.subtitle}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[var(--dmc-ink-secondary)] shrink-0">
                        {hit.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="pt-1 border-t border-[var(--dmc-border-subtle)]">
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-[var(--dmc-brand-forest)] hover:bg-emerald-50 transition-colors"
                >
                  <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {quickQueries.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-emerald-100/90">
          <span className="font-semibold text-emerald-200">Popular:</span>
          {quickQueries.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="inline-flex items-center min-h-[44px] sm:min-h-[34px] px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

