'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Globe, HelpCircle, Loader2, RotateCcw, Search, Shield, X } from 'lucide-react';
import type { PortalSearchEngine, SearchHit } from '@/lib/search';
import { DATA_ENDPOINTS, fetchStaticData } from '@/lib/data/client-fetch';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';

export interface NavbarSearchProps {
  mode?: 'desktop' | 'mobile';
  autoFocus?: boolean;
  onActionComplete?: () => void;
}

export function NavbarSearch({
  mode = 'desktop',
  autoFocus = false,
  onActionComplete
}: NavbarSearchProps = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingIndex, setIsLoadingIndex] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const engineRef = useRef<PortalSearchEngine | null>(null);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ensureIndexLoaded = useCallback(async (bypassCache = false): Promise<PortalSearchEngine | null> => {
    if (engineRef.current && !bypassCache) return engineRef.current;

    setIsLoadingIndex(true);
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
      setIsLoadingIndex(false);
    }
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const runSearch = useCallback(
    async (value: string, bypassCache = false) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      if (!engineRef.current || bypassCache) {
        setIsOpen(true);
      }
      const engine = await ensureIndexLoaded(bypassCache);
      if (engine) {
        setResults(engine.search(trimmed, undefined, 6));
      }
      setIsOpen(true);
    },
    [ensureIndexLoaded]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void runSearch(value);
    }, 150);
  };

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (mode === 'mobile') {
        onActionComplete?.();
      }
      return;
    }
    if (e.key === 'ArrowDown' && isOpen && results.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }
    if (e.key === 'ArrowUp' && isOpen && results.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }
    if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        setIsOpen(false);
        onActionComplete?.();
        notifyNavigationStart();
        router.push(results[activeIndex].url);
      } else if (query.trim().length > 0) {
        e.preventDefault();
        setIsOpen(false);
        onActionComplete?.();
        notifyNavigationStart();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const renderIcon = (type: SearchHit['type']) => {
    if (type === 'pdf') return <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />;
    if (type === 'country') return <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />;
    if (type === 'exam' || type === 'post') return <Shield className="w-3.5 h-3.5 text-[#0d4a28] shrink-0" aria-hidden="true" />;
    return <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />;
  };

  const isMobile = mode === 'mobile';

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        action="/search"
        method="GET"
        role="search"
        onSubmit={(e) => {
          if (query.trim().length > 0) {
            e.preventDefault();
            setIsOpen(false);
            onActionComplete?.();
            notifyNavigationStart();
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        className={
          isMobile
            ? 'flex items-center gap-2 w-full'
            : 'flex items-center'
        }
      >
        <div
          className={
            isMobile
              ? 'flex-1 flex items-center bg-[var(--dmc-surface-muted)] border border-[var(--dmc-border-strong)] focus-within:border-[var(--dmc-brand-forest)] focus-within:ring-2 focus-within:ring-[var(--dmc-brand-forest)]/15 rounded-xl h-12 px-3 text-sm text-[var(--dmc-ink-primary)] transition-[border-color,box-shadow,background-color] duration-150 min-w-0'
              : 'flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 min-h-[38px] text-xs text-slate-500 w-48 max-w-[200px] lg:w-64 lg:max-w-[256px] focus-within:border-[var(--dmc-brand-forest)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--dmc-brand-forest)]/15 transition-[border-color,box-shadow,background-color] duration-150'
          }
        >
          <Search className="w-4 h-4 mr-2 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            name="q"
            value={query}
            onFocus={() => {
              void ensureIndexLoaded();
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleQueryChange(e.target.value)}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            placeholder={isMobile ? 'Search PPSC, countries, MCQs, PDFs...' : 'Search syllabus, notes...'}
            aria-label="Search syllabus, countries, booklets, and MCQs"
            className={
              isMobile
                ? 'bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none w-full min-w-0 text-[var(--dmc-ink-primary)] placeholder-[var(--dmc-ink-muted)]'
                : 'bg-transparent border-none p-0 text-xs focus:ring-0 focus:outline-none w-full min-w-0 text-[var(--dmc-ink-primary)] placeholder-[var(--dmc-ink-muted)]'
            }
          />
          {isLoadingIndex && (
            <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin ml-1 shrink-0" aria-label="Loading index" />
          )}
          {query && !isLoadingIndex && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] text-[var(--dmc-ink-muted)] hover:text-[var(--dmc-ink-primary)] -mr-2 md:-mr-1.5 cursor-pointer shrink-0 rounded-md"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {isMobile && (
          <button
            type="submit"
            className="dmc-press min-h-[48px] px-3 min-[360px]:px-4 rounded-xl bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Search
          </button>
        )}
      </form>

      {isOpen && (
        <div
          id={listboxId}
          data-lenis-prevent
          role="listbox"
          aria-label="Search results"
          className={`dmc-drawer-enter absolute mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-[70dvh] overflow-y-auto overscroll-contain ${
            isMobile ? 'left-0 right-0 w-full' : 'right-0 w-80'
          }`}
        >
          {isLoadingIndex && results.length === 0 ? (
            <div className="p-3 space-y-2.5" aria-busy="true" aria-label="Loading search suggestions">
              <div className="dmc-skeleton h-9 rounded-lg w-full" />
              <div className="dmc-skeleton h-9 rounded-lg w-full" />
              <div className="dmc-skeleton h-9 rounded-lg w-4/5" />
            </div>
          ) : hasError ? (
            <div className="p-3.5 text-xs text-[var(--dmc-ink-secondary)] space-y-2">
              <div>Instant suggestions unavailable right now.</div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void runSearch(query, true)}
                  className="inline-flex items-center gap-1 min-h-[44px] font-bold text-[var(--dmc-brand-forest)] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Retry</span>
                </button>
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => {
                    setIsOpen(false);
                    onActionComplete?.();
                  }}
                  className="inline-flex items-center min-h-[44px] font-bold text-[var(--dmc-brand-forest)] hover:underline"
                >
                  Open full search
                </Link>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-3.5 text-xs text-[var(--dmc-ink-muted)] text-center space-y-1">
              <div>No matching records found for &quot;{query.trim()}&quot;.</div>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setIsOpen(false);
                  onActionComplete?.();
                }}
                className="inline-flex items-center min-h-[44px] font-bold text-[var(--dmc-brand-forest)] hover:underline"
              >
                Search all repository pages
              </Link>
            </div>
          ) : (
            <div>
              <ul
                data-lenis-prevent
                className="divide-y divide-slate-100 max-h-72 overflow-y-auto overscroll-contain"
              >
                {results.map((hit, idx) => {
                  const isPdf = hit.type === 'pdf';
                  const inner = (
                    <div
                      className={`flex items-start gap-2.5 p-3 min-h-[48px] transition-colors ${
                        idx === activeIndex ? 'bg-emerald-50' : 'hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="mt-0.5">{renderIcon(hit.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--dmc-ink-primary)] truncate">{hit.title}</span>
                          {hit.badge && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                              {hit.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--dmc-ink-muted)] truncate mt-0.5">{hit.subtitle}</p>
                      </div>
                    </div>
                  );

                  return (
                    <li
                      key={hit.id}
                      id={`${listboxId}-opt-${idx}`}
                      role="option"
                      aria-selected={idx === activeIndex}
                    >
                      {isPdf ? (
                        <a
                          href={hit.url}
                          download
                          onClick={() => {
                            setIsOpen(false);
                            onActionComplete?.();
                          }}
                          className="block"
                        >
                          {inner}
                        </a>
                      ) : (
                        <Link
                          href={hit.url}
                          onClick={() => {
                            setIsOpen(false);
                            onActionComplete?.();
                          }}
                          className="block"
                        >
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setIsOpen(false);
                  onActionComplete?.();
                }}
                className="flex items-center justify-between px-3 min-h-[44px] bg-slate-50 border-t border-slate-100 text-xs font-bold text-[var(--dmc-brand-forest)] hover:bg-emerald-50"
              >
                <span>See all results</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
