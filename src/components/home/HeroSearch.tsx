'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { ArrowRight, FileText, Globe, HelpCircle, Loader2, RotateCcw, Search, Shield } from 'lucide-react';
import type { PortalSearchEngine, SearchHit } from '@/lib/search';
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
  const prefersReduced = useReducedMotion();

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
      const [res, { PortalSearchEngine }] = await Promise.all([
        fetchStaticData<unknown>(DATA_ENDPOINTS.searchIndex, { bypassCache }),
        import('@/lib/search')
      ]);
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
    <div ref={rootRef} className="w-full max-w-2xl space-y-3 relative">
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
        className="flex flex-col sm:flex-row gap-2 bg-[var(--color-surface)] p-1.5 rounded-[var(--radius-panel)] elevation-1 border border-[var(--color-border-strong)] focus-within:border-[var(--color-brand-deep)] transition-colors"
      >
        <div className="relative flex-1 flex items-center">
          <Search
            className="w-5 h-5 text-[var(--color-ink-muted)] absolute left-3.5 pointer-events-none"
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
            className="w-full h-12 pl-11 pr-9 rounded-[var(--radius-control)] bg-transparent text-sm sm:text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
          {isLoading && (
            <Loader2
              className="w-4 h-4 text-[var(--color-brand-deep)] animate-spin absolute right-3"
              aria-label="Loading search index"
            />
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="rounded-[var(--radius-control)] shrink-0">
          Search
        </Button>
      </form>

      <AnimatePresence>
        {isOpen && query.trim().length >= 2 && (
          <m.div
            id={listboxId}
            role="listbox"
            aria-label="Instant search suggestions"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.08 : 0.17, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full mt-2 z-30 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] elevation-3 p-2 text-left max-h-[min(20rem,60dvh)] overflow-y-auto overscroll-contain"
          >
          {isLoading && hits.length === 0 ? (
            <div className="p-2 space-y-2" aria-busy="true" aria-label="Loading search suggestions">
              <div className="dmc-skeleton h-11 rounded-xl w-full" />
              <div className="dmc-skeleton h-11 rounded-xl w-full" />
              <div className="dmc-skeleton h-11 rounded-xl w-5/6" />
            </div>
          ) : hasError ? (
            <div className="px-3 py-2.5 text-xs text-[var(--color-ink-secondary)] flex flex-wrap items-center justify-between gap-2">
              <span>Instant suggestions unavailable right now. Press Search to browse full results.</span>
              <button
                type="button"
                onClick={() => void runInstantSearch(query, true)}
                className="inline-flex items-center gap-1 min-h-[44px] px-2 font-semibold text-[var(--color-brand-deep)] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : hits.length === 0 ? (
            <div className="px-3 py-3 text-xs text-[var(--color-ink-secondary)] flex items-center justify-between gap-2">
              <span>No instant preview match for &ldquo;{query.trim()}&rdquo;.</span>
              <Link href={`/search?q=${encodeURIComponent(query.trim())}`} className="inline-flex items-center min-h-[44px] font-semibold text-[var(--color-brand-deep)] hover:underline">
                Full search
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <ul className="divide-y divide-[var(--color-border)]/70">
                {hits.map((hit, idx) => (
                  <li key={hit.id} id={`${listboxId}-opt-${idx}`} role="option" aria-selected={idx === activeIndex}>
                    <Link
                      href={hit.url}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-control)] transition-colors ${
                        idx === activeIndex ? 'bg-[var(--color-surface-soft)]' : 'hover:bg-[var(--color-surface-soft)]'
                      }`}
                    >
                      <span className="mt-0.5">{renderIcon(hit.type)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-[var(--color-ink)] truncate">
                          {hit.title}
                        </span>
                        <span className="block text-xs text-[var(--color-ink-muted)] truncate">
                          {hit.subtitle}
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border border-[var(--color-border)] shrink-0">
                        {hit.type}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="pt-1 border-t border-[var(--color-border)]">
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold text-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] transition-colors"
                >
                  <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
          </m.div>
        )}
      </AnimatePresence>

      {quickQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
          <span className="font-semibold text-[var(--color-ink-muted)]">Popular:</span>
          {quickQueries.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="inline-flex items-center min-h-[44px] sm:min-h-[34px] px-3 py-1 rounded-full bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand-deep)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

