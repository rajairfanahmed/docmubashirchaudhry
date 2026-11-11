'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Globe, HelpCircle, Loader2, RotateCcw } from 'lucide-react';
import type { CountryEntity } from '@/lib/schemas';
import type { GeographyFilterState, GeographyWorkbenchProps } from './types';
import { SectionBand } from '@/components/layout/SectionBand';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider';
import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';
import { fetchCountriesPage } from '@/lib/api';
import {
  buildPaginatedSearchParams,
  COUNTRY_DEFAULT_PAGE_SIZE,
  parsePageParam,
  resetPageOnFilterChange
} from '@/lib/pagination';
import {
  generateGeographyQuestion,
  generateGeographyQuizSet,
  isAnswerCorrect,
  isCountryEligibleForFact,
  type GeneratedGeographyQuestion,
  type GeographyFactType
} from '@/lib/quiz';
import { createVersionedStorage, STORAGE_KEYS } from '@/lib/storage/persistence';
import { CountryCard } from './CountryCard';
import { GeographyFilterBar } from './GeographyFilterBar';
import { GeographyQuizCard } from './GeographyQuizCard';
import { GeographyScoreModal } from './GeographyScoreModal';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;
const FACT_SEQUENCE: GeographyFactType[] = ['capital', 'currency', 'language'];

const EMPTY_FILTER: GeographyFilterState = {
  search: '',
  continentId: '',
  regionId: '',
  letter: ''
};

interface QuizQuestionEntry {
  question: GeneratedGeographyQuestion;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
}

interface ActiveQuizDeck {
  mode: 'country' | 'selection';
  label: string;
  targetCountryId?: string;
  entries: QuizQuestionEntry[];
}

interface StoredGeoQuizState {
  mode: 'country' | 'selection';
  label: string;
  targetCountryId?: string;
  roundSeed: number;
  currentIndex: number;
  answersByIndex: Record<number, string>;
  filter: GeographyFilterState;
}

function isStoredGeoQuizState(value: unknown): value is StoredGeoQuizState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredGeoQuizState>;
  return (
    (candidate.mode === 'country' || candidate.mode === 'selection') &&
    typeof candidate.currentIndex === 'number' &&
    typeof candidate.roundSeed === 'number' &&
    typeof candidate.answersByIndex === 'object'
  );
}

function toQuizEntry(question: GeneratedGeographyQuestion): QuizQuestionEntry {
  const options = question.options.slice(0, 4).map((label, idx) => ({
    id: OPTION_IDS[idx] ?? `opt-${idx}`,
    label
  }));
  const matchedCorrect =
    options.find((opt) => isAnswerCorrect(opt.label, question.acceptedAnswers)) ?? options[0];

  return {
    question,
    options,
    correctOptionId: matchedCorrect?.id ?? 'a'
  };
}

export function GeographyWorkbench({
  countries,
  continents,
  regions,
  currencies,
  languages,
  datasetVersion
}: GeographyWorkbenchProps) {
  const { showToast } = useToast();
  const refGuideRef = useRef<HTMLDivElement>(null);
  const quizHeadingRef = useRef<HTMLHeadingElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  const currenciesById = useMemo(() => new Map(currencies.map((c) => [c.id, c])), [currencies]);
  const languagesById = useMemo(() => new Map(languages.map((l) => [l.id, l])), [languages]);
  const continentsById = useMemo(() => new Map(continents.map((c) => [c.id, c])), [continents]);
  const regionsById = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const lookupMaps = useMemo(
    () => ({ currenciesById, languagesById }),
    [currenciesById, languagesById]
  );

  const storage = useMemo(
    () =>
      createVersionedStorage<StoredGeoQuizState>({
        key: STORAGE_KEYS.GEOGRAPHY_QUIZ,
        datasetVersion,
        validate: isStoredGeoQuizState
      }),
    [datasetVersion]
  );

  const [filter, setFilter] = useState<GeographyFilterState>(EMPTY_FILTER);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  const [roundSeed, setRoundSeed] = useState<number>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>({});
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [remoteSlice, setRemoteSlice] = useState<{
    queryKey: string;
    items: CountryEntity[];
    page: number;
    totalPages: number;
    totalItems: number;
  } | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState<number>(0);

  const buildCountryDeck = useCallback(
    (country: CountryEntity, seed: number): ActiveQuizDeck => {
      const entries: QuizQuestionEntry[] = [];
      for (const factType of FACT_SEQUENCE) {
        const q = generateGeographyQuestion(
          country,
          factType,
          countries,
          lookupMaps,
          `country-${country.id}-${factType}-${seed}`
        );
        if (q) entries.push(toQuizEntry(q));
      }
      return {
        mode: 'country',
        label: country.nameCommon,
        targetCountryId: country.id,
        entries
      };
    },
    [countries, lookupMaps]
  );

  const buildSelectionDeck = useCallback(
    (pool: readonly CountryEntity[], label: string, seed: number): ActiveQuizDeck => {
      const generated = generateGeographyQuizSet({
        countries: pool,
        allCountries: countries,
        factTypes: FACT_SEQUENCE,
        limit: Math.min(Math.max(pool.length * 3, 10), 20),
        seed: `selection-${label}-${seed}`,
        maps: lookupMaps
      });
      return {
        mode: 'selection',
        label,
        entries: generated.map(toQuizEntry)
      };
    },
    [countries, lookupMaps]
  );

  const [quizDeck, setQuizDeck] = useState<ActiveQuizDeck>(() =>
    buildSelectionDeck(countries, 'All Verified Nations', 1)
  );

  const { scrollToTarget } = useSmoothScroll();

  const scrollAndFocusQuiz = useCallback(() => {
    if (typeof window === 'undefined' || !quizSectionRef.current) return;
    const reduced = isReducedMotionPreferred();
    scrollToTarget(quizSectionRef.current, { offset: -72, immediate: reduced });
    window.setTimeout(() => {
      quizHeadingRef.current?.focus({ preventScroll: true });
    }, reduced ? 0 : 250);
  }, [scrollToTarget]);

  const launchCountryQuiz = useCallback(
    (country: CountryEntity, options: { shouldScroll?: boolean; seed?: number } = {}) => {
      const nextSeed = options.seed ?? roundSeed;
      const deck = buildCountryDeck(country, nextSeed);
      if (deck.entries.length === 0) {
        showToast({
          tone: 'warning',
          title: 'Country facts pending verification and excluded from scored quiz',
          description: `${country.nameCommon} holds pending or disputed fields under review.`
        });
        return;
      }

      setQuizDeck(deck);
      setCurrentIndex(0);
      setAnswersByIndex({});
      setIsScoreModalOpen(false);
      storage.save({
        mode: 'country',
        label: deck.label,
        targetCountryId: country.id,
        roundSeed: nextSeed,
        currentIndex: 0,
        answersByIndex: {},
        filter
      });

      if (options.shouldScroll) {
        scrollAndFocusQuiz();
      }
    },
    [roundSeed, buildCountryDeck, showToast, storage, filter, scrollAndFocusQuiz]
  );

  // Hydrate incoming URL deep links (?country=, ?continent=, ?region=, ?letter=, ?q=, ?page=) OR saved browser progress once on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        const countrySlug = sp.get('country')?.trim().toLowerCase();
        const urlPage = parsePageParam(sp.get('page'), 1);
        const continentParam = sp.get('continent')?.trim().toLowerCase() ?? '';
        const regionParam = sp.get('region')?.trim().toLowerCase() ?? '';
        const letterParam = sp.get('letter')?.trim().toUpperCase() ?? '';
        const searchParam = (sp.get('q') ?? sp.get('search') ?? '').trim();

        const matchedContinent = continentParam
          ? continents.find(
              (c) => c.slug.toLowerCase() === continentParam || c.id.toLowerCase() === continentParam
            )
          : undefined;
        const matchedRegion = regionParam
          ? regions.find(
              (r) => r.slug.toLowerCase() === regionParam || r.id.toLowerCase() === regionParam
            )
          : undefined;
        const validLetter = /^[A-Z]$/.test(letterParam) ? letterParam : '';

        if (matchedContinent || matchedRegion || validLetter || searchParam || urlPage > 1) {
          const urlFilter: GeographyFilterState = {
            search: searchParam,
            continentId: matchedContinent?.id ?? matchedRegion?.continentId ?? '',
            regionId: matchedRegion?.id ?? '',
            letter: validLetter
          };
          setFilter(urlFilter);
          setCurrentPage(urlPage);

          if (!countrySlug && window.location.hash === '#quiz-module') {
            const matchingPool = countries.filter((c) => {
              if (urlFilter.continentId && c.continentId !== urlFilter.continentId) return false;
              if (urlFilter.regionId && c.regionId !== urlFilter.regionId) return false;
              if (urlFilter.letter && !c.nameCommon.toUpperCase().startsWith(urlFilter.letter)) {
                return false;
              }
              return true;
            });
            const deckLabel =
              matchedRegion?.name ??
              matchedContinent?.name ??
              (validLetter ? `Letter "${validLetter}"` : 'Filtered Selection');
            const deck = buildSelectionDeck(matchingPool, deckLabel, 1);
            if (deck.entries.length > 0) {
              setQuizDeck(deck);
              setCurrentIndex(0);
              setAnswersByIndex({});
              scrollAndFocusQuiz();
              return;
            }
          }
        }

        if (countrySlug) {
          const matchedCountry = countries.find((c) => c.slug.toLowerCase() === countrySlug);
          if (matchedCountry) {
            launchCountryQuiz(matchedCountry, {
              shouldScroll: window.location.hash === '#quiz-module'
            });
            return;
          }
        }

        if (matchedContinent || matchedRegion || validLetter || searchParam || urlPage > 1) {
          return;
        }
      }

      const saved = storage.load();
      if (!saved) return;

      const restoredFilter = saved.filter ?? EMPTY_FILTER;
      setFilter(restoredFilter);
      setRoundSeed(saved.roundSeed);

      if (saved.mode === 'country' && saved.targetCountryId) {
        const target = countries.find((c) => c.id === saved.targetCountryId);
        if (target) {
          const deck = buildCountryDeck(target, saved.roundSeed);
          if (deck.entries.length > 0) {
            setQuizDeck(deck);
            setCurrentIndex(Math.min(saved.currentIndex, deck.entries.length - 1));
            setAnswersByIndex(saved.answersByIndex ?? {});
            return;
          }
        }
      }

      // Recompute selection deck with matching scope
      const matchingPool = countries.filter((c) => {
        if (restoredFilter.continentId && c.continentId !== restoredFilter.continentId) return false;
        if (restoredFilter.regionId && c.regionId !== restoredFilter.regionId) return false;
        if (
          restoredFilter.letter &&
          !c.nameCommon.toUpperCase().startsWith(restoredFilter.letter.toUpperCase())
        ) {
          return false;
        }
        return true;
      });
      const deck = buildSelectionDeck(matchingPool, saved.label || 'Saved Selection', saved.roundSeed);
      if (deck.entries.length > 0) {
        setQuizDeck(deck);
        setCurrentIndex(Math.min(saved.currentIndex, deck.entries.length - 1));
        setAnswersByIndex(saved.answersByIndex ?? {});
      }
    } finally {
      setHasHydrated(true);
    }
  }, [
    countries,
    continents,
    regions,
    storage,
    launchCountryQuiz,
    buildCountryDeck,
    buildSelectionDeck,
    scrollAndFocusQuiz
  ]);

  // Compute filtered list + A-Z counts
  const baseMatches = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return countries.filter((c) => {
      if (filter.continentId && c.continentId !== filter.continentId) return false;
      if (filter.regionId && c.regionId !== filter.regionId) return false;
      if (q) {
        const hay = [
          c.nameCommon,
          c.nameOfficial,
          c.isoAlpha2,
          c.isoAlpha3,
          ...c.capitals
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [countries, filter.continentId, filter.regionId, filter.search]);

  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of ALPHABET) counts[ch] = 0;
    for (const c of baseMatches) {
      const initial = c.nameCommon.charAt(0).toUpperCase();
      if (initial in counts) counts[initial] += 1;
    }
    return counts;
  }, [baseMatches]);

  const filteredCountries = useMemo(() => {
    if (!filter.letter) return baseMatches;
    const targetInitial = filter.letter.toUpperCase();
    return baseMatches.filter((c) => c.nameCommon.charAt(0).toUpperCase() === targetInitial);
  }, [baseMatches, filter.letter]);

  const eligibleQuizCountries = useMemo(
    () =>
      filteredCountries.filter((c) =>
        FACT_SEQUENCE.some((ft) => isCountryEligibleForFact(c, ft, countries, lookupMaps))
      ),
    [filteredCountries, countries, lookupMaps]
  );

  const scopeLabel = useMemo(() => {
    if (filter.letter) return `Letter "${filter.letter}"`;
    if (filter.regionId) return regionsById.get(filter.regionId)?.name ?? 'Selected Region';
    if (filter.continentId) return continentsById.get(filter.continentId)?.name ?? 'Selected Continent';
    if (filter.search.trim()) return `Search "${filter.search.trim()}"`;
    return 'All Verified Nations';
  }, [filter, regionsById, continentsById]);

  const persistSnapshot = (nextIndex: number, nextAnswers: Record<number, string>, nextDeck = quizDeck, nextSeed = roundSeed) => {
    storage.save({
      mode: nextDeck.mode,
      label: nextDeck.label,
      targetCountryId: nextDeck.targetCountryId,
      roundSeed: nextSeed,
      currentIndex: nextIndex,
      answersByIndex: nextAnswers,
      filter
    });
  };

  const handleQuizSelection = () => {
    const nextSeed = roundSeed + 1;
    const deck = buildSelectionDeck(eligibleQuizCountries, scopeLabel, nextSeed);
    if (deck.entries.length === 0) {
      showToast({
        tone: 'warning',
        title: 'No eligible countries in current selection',
        description: 'Clear or widen your filters so at least one verified country can be quizzed.'
      });
      return;
    }
    setRoundSeed(nextSeed);
    setQuizDeck(deck);
    setCurrentIndex(0);
    setAnswersByIndex({});
    setIsScoreModalOpen(false);
    persistSnapshot(0, {}, deck, nextSeed);
    scrollAndFocusQuiz();
  };

  const syncTier1Url = useCallback(
    (nextFilter: GeographyFilterState, nextPage: number) => {
      if (typeof window === 'undefined') return;
      const filterUpdated = resetPageOnFilterChange(window.location.search, {
        country: undefined,
        continent: continentsById.get(nextFilter.continentId)?.slug,
        region: regionsById.get(nextFilter.regionId)?.slug,
        letter: nextFilter.letter || undefined,
        q: nextFilter.search.trim() || undefined,
        search: undefined
      });
      const finalParams = buildPaginatedSearchParams(filterUpdated, nextPage);
      const qs = finalParams.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    },
    [continentsById, regionsById]
  );

  const handleFilterChange = (nextFilter: GeographyFilterState) => {
    setFilter(nextFilter);
    setCurrentPage(1);
    syncTier1Url(nextFilter, 1);
  };

  const handleClearFilters = () => {
    setFilter(EMPTY_FILTER);
    setCurrentPage(1);
    syncTier1Url(EMPTY_FILTER, 1);
  };

  const activeEntry = quizDeck.entries[currentIndex];
  const scoreCount = quizDeck.entries.reduce((acc, entry, idx) => {
    return answersByIndex[idx] === entry.correctOptionId ? acc + 1 : acc;
  }, 0);

  const handleSelectOption = (optionId: string) => {
    if (answersByIndex[currentIndex]) return;
    const nextAnswers = { ...answersByIndex, [currentIndex]: optionId };
    setAnswersByIndex(nextAnswers);
    persistSnapshot(currentIndex, nextAnswers);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < quizDeck.entries.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistSnapshot(nextIdx, answersByIndex);
    } else {
      setIsScoreModalOpen(true);
    }
  };

  const handleClearProgress = () => {
    const previousSnapshot = {
      filter,
      roundSeed,
      quizDeck,
      currentIndex,
      answersByIndex
    };
    storage.clear();
    const nextSeed = roundSeed + 1;
    const freshDeck = buildSelectionDeck(
      eligibleQuizCountries.length > 0 ? eligibleQuizCountries : countries,
      eligibleQuizCountries.length > 0 ? scopeLabel : 'All Verified Nations',
      nextSeed
    );
    setRoundSeed(nextSeed);
    setQuizDeck(freshDeck);
    setCurrentIndex(0);
    setAnswersByIndex({});
    setIsScoreModalOpen(false);
    showToast({
      tone: 'info',
      title: 'Saved progress cleared',
      description: 'Your World Geography quiz session has been reset.',
      action: {
        label: 'Undo',
        onClick: () => {
          setFilter(previousSnapshot.filter);
          setRoundSeed(previousSnapshot.roundSeed);
          setQuizDeck(previousSnapshot.quizDeck);
          setCurrentIndex(previousSnapshot.currentIndex);
          setAnswersByIndex(previousSnapshot.answersByIndex);
          storage.save({
            mode: previousSnapshot.quizDeck.mode,
            label: previousSnapshot.quizDeck.label,
            targetCountryId: previousSnapshot.quizDeck.targetCountryId,
            roundSeed: previousSnapshot.roundSeed,
            currentIndex: previousSnapshot.currentIndex,
            answersByIndex: previousSnapshot.answersByIndex,
            filter: previousSnapshot.filter
          });
        }
      }
    });
  };

  const handleRetake = () => {
    const nextSeed = roundSeed + 1;
    setRoundSeed(nextSeed);
    if (quizDeck.mode === 'country' && quizDeck.targetCountryId) {
      const target = countries.find((c) => c.id === quizDeck.targetCountryId);
      if (target) {
        launchCountryQuiz(target, { seed: nextSeed });
        return;
      }
    }
    const freshDeck = buildSelectionDeck(
      eligibleQuizCountries.length > 0 ? eligibleQuizCountries : countries,
      quizDeck.label,
      nextSeed
    );
    setQuizDeck(freshDeck);
    setCurrentIndex(0);
    setAnswersByIndex({});
    setIsScoreModalOpen(false);
    persistSnapshot(0, {}, freshDeck, nextSeed);
  };

  const handleNextScope = () => {
    const nextSeed = roundSeed + 1;
    setRoundSeed(nextSeed);
    setIsScoreModalOpen(false);

    if (filter.letter) {
      const verifiedInitials = ALPHABET.filter((ch) =>
        countries.some(
          (c) =>
            c.nameCommon.toUpperCase().startsWith(ch) &&
            FACT_SEQUENCE.some((ft) => isCountryEligibleForFact(c, ft, countries, lookupMaps))
        )
      );
      if (verifiedInitials.length > 0) {
        const curPos = verifiedInitials.indexOf(filter.letter.toUpperCase());
        const nextLetter = verifiedInitials[(curPos + 1) % verifiedInitials.length];
        const nextFilter: GeographyFilterState = { ...filter, letter: nextLetter };
        setFilter(nextFilter);
        setCurrentPage(1);
        syncTier1Url(nextFilter, 1);
        const nextPool = countries.filter((c) => c.nameCommon.toUpperCase().startsWith(nextLetter));
        const nextDeck = buildSelectionDeck(nextPool, `Letter "${nextLetter}"`, nextSeed);
        if (nextDeck.entries.length > 0) {
          setQuizDeck(nextDeck);
          setCurrentIndex(0);
          setAnswersByIndex({});
          storage.save({
            mode: 'selection',
            label: nextDeck.label,
            roundSeed: nextSeed,
            currentIndex: 0,
            answersByIndex: {},
            filter: nextFilter
          });
          return;
        }
      }
    }

    if (filter.continentId && continents.length > 1) {
      const curIdx = continents.findIndex((c) => c.id === filter.continentId);
      const nextContinent = continents[(curIdx + 1) % continents.length];
      if (nextContinent) {
        const nextFilter: GeographyFilterState = {
          ...filter,
          continentId: nextContinent.id,
          regionId: ''
        };
        setFilter(nextFilter);
        setCurrentPage(1);
        syncTier1Url(nextFilter, 1);
        const nextPool = countries.filter((c) => c.continentId === nextContinent.id);
        const nextDeck = buildSelectionDeck(nextPool, nextContinent.name, nextSeed);
        if (nextDeck.entries.length > 0) {
          setQuizDeck(nextDeck);
          setCurrentIndex(0);
          setAnswersByIndex({});
          storage.save({
            mode: 'selection',
            label: nextDeck.label,
            roundSeed: nextSeed,
            currentIndex: 0,
            answersByIndex: {},
            filter: nextFilter
          });
          return;
        }
      }
    }

    // Fallback: advance global verified batch
    const freshDeck = buildSelectionDeck(countries, 'Next Global Batch', nextSeed);
    setQuizDeck(freshDeck);
    setCurrentIndex(0);
    setAnswersByIndex({});
    persistSnapshot(0, {}, freshDeck, nextSeed);
  };

  const subStepperSteps =
    quizDeck.mode === 'country'
      ? quizDeck.entries.map((entry, idx) => ({
          key: entry.question.factType,
          label: `${idx + 1}. ${
            entry.question.factType.charAt(0).toUpperCase() + entry.question.factType.slice(1)
          }`
        }))
      : undefined;

  const activeSubStepKey =
    quizDeck.mode === 'country' && activeEntry ? activeEntry.question.factType : undefined;

  const totalCountryPages = Math.max(
    1,
    Math.ceil(filteredCountries.length / COUNTRY_DEFAULT_PAGE_SIZE)
  );
  const safeCountryPage = Math.min(currentPage, totalCountryPages);
  const currentQueryKey = [
    safeCountryPage,
    filter.continentId,
    filter.regionId,
    filter.letter,
    filter.search.trim()
  ].join('|');

  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    const delayMs = filter.search.trim() ? 180 : 0;

    const timer = window.setTimeout(async () => {
      setIsPageLoading(true);
      setPageError(null);
      try {
        const res = await fetchCountriesPage({
          page: safeCountryPage,
          pageSize: COUNTRY_DEFAULT_PAGE_SIZE,
          continentId: filter.continentId || undefined,
          regionId: filter.regionId || undefined,
          letter: filter.letter || undefined,
          search: filter.search.trim() || undefined
        });
        if (!cancelled) {
          setRemoteSlice({
            queryKey: currentQueryKey,
            items: res.items,
            page: res.pagination.page,
            totalPages: res.pagination.totalPages,
            totalItems: res.pagination.totalItems
          });
        }
      } catch {
        if (!cancelled) {
          setPageError('Could not load updated country page from API.');
        }
      } finally {
        if (!cancelled) {
          setIsPageLoading(false);
        }
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasHydrated, currentQueryKey, safeCountryPage, filter, retryTick]);

  const localPaginatedCountries = useMemo(() => {
    const start = (safeCountryPage - 1) * COUNTRY_DEFAULT_PAGE_SIZE;
    return filteredCountries.slice(start, start + COUNTRY_DEFAULT_PAGE_SIZE);
  }, [filteredCountries, safeCountryPage]);

  const activeSliceMatched = remoteSlice?.queryKey === currentQueryKey;
  const displayedCountries = activeSliceMatched ? remoteSlice.items : localPaginatedCountries;
  const displayedPage = activeSliceMatched ? remoteSlice.page : safeCountryPage;
  const displayedTotalPages = activeSliceMatched ? remoteSlice.totalPages : totalCountryPages;
  const displayedTotalItems = activeSliceMatched ? remoteSlice.totalItems : filteredCountries.length;
  const rangeStart = displayedTotalItems === 0 ? 0 : (displayedPage - 1) * COUNTRY_DEFAULT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(displayedTotalItems, displayedPage * COUNTRY_DEFAULT_PAGE_SIZE);

  const handlePageChange = (nextPage: number) => {
    const bounded = Math.max(1, Math.min(nextPage, displayedTotalPages));
    setCurrentPage(bounded);
    syncTier1Url(filter, bounded);
    if (typeof window !== 'undefined' && refGuideRef.current) {
      const reduced = isReducedMotionPreferred();
      scrollToTarget(refGuideRef.current, { offset: -72, immediate: reduced });
    }
  };

  return (
    <>
      {/* Tier 1: Reference Guide (#reference-guide) */}
      <div ref={refGuideRef} className="scroll-mt-16">
        <SectionBand id="reference-guide" surface="muted" density="standard" labelledBy="ref-guide-heading">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="ref-guide-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
                Tier 1: World Nations Reference Guide
              </h2>
              <p aria-live="polite" className="type-body-sm text-[var(--dmc-ink-secondary)] mt-0.5 tabular-nums flex items-center gap-2">
                <span>
                  Showing {rangeStart}-{rangeEnd} of {displayedTotalItems} matching countries ({countries.length} total).
                </span>
                {isPageLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--dmc-brand-forest)] shrink-0" aria-label="Updating countries list" />
                )}
              </p>
            </div>
          </div>

          <div id="geography-filter-slot">
            <GeographyFilterBar
              continents={continents}
              regions={regions}
              filter={filter}
              onChangeFilter={handleFilterChange}
              onClearFilters={handleClearFilters}
              filteredCount={filteredCountries.length}
              eligibleQuizCount={eligibleQuizCountries.length}
              onQuizSelection={handleQuizSelection}
              letterCounts={letterCounts}
            />
          </div>

          {pageError && (
            <div
              role="alert"
              className="bg-[var(--dmc-status-unverified-bg)] border border-[var(--dmc-status-unverified-border)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--dmc-ink-primary)]"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-[var(--dmc-status-unverified-icon)] shrink-0" aria-hidden="true" />
                <span>{pageError} Showing local cached page.</span>
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

          {displayedTotalItems === 0 ? (
            <EmptyStateCard
              icon={Globe}
              title="No Countries Match Active Filters"
              description="Try clearing your search term, A-Z index, or continent/region filters to display all curated countries."
              primaryAction={{
                label: 'Clear filters',
                onClick: handleClearFilters
              }}
            />
          ) : (
            <div className="space-y-6">
              <div
                id="geography-cards-slot"
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-150 ${
                  isPageLoading ? 'opacity-65' : 'opacity-100'
                }`}
              >
                {displayedCountries.map((country) => {
                  const countryCurrencies = country.currencyIds
                    .map((id) => currenciesById.get(id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c));
                  const countryLanguages = country.officialLanguageIds
                    .map((id) => languagesById.get(id))
                    .filter((l): l is NonNullable<typeof l> => Boolean(l));
                  const continent = continentsById.get(country.continentId);
                  const region = regionsById.get(country.regionId);

                  return (
                    <CountryCard
                      key={country.id}
                      country={country}
                      currencies={countryCurrencies}
                      languages={countryLanguages}
                      continentName={continent?.name}
                      regionName={region?.name}
                      onTestInQuiz={(c) => launchCountryQuiz(c, { shouldScroll: true })}
                      isCurrentQuizTarget={
                        quizDeck.mode === 'country' && quizDeck.targetCountryId === country.id
                      }
                    />
                  );
                })}
              </div>

              <PaginationBar
                page={displayedPage}
                totalPages={displayedTotalPages}
                totalItems={displayedTotalItems}
                pageSize={COUNTRY_DEFAULT_PAGE_SIZE}
                onPageChange={handlePageChange}
                itemLabel="countries"
              />
            </div>
          )}
        </div>
      </SectionBand>
      </div>

      {/* Full-Width Emerald Mode Divider Bar (#0D4A28) */}
      <div ref={quizSectionRef} id="quiz-divider" className="scroll-mt-16">
        <SectionBand surface="emerald" density="compact" labelledBy="quiz-divider-heading">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-center sm:justify-start gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>TIER 2 ACTIVE RECALL ENGINE &middot; {quizDeck.label}</span>
              </div>
              <h2
                ref={quizHeadingRef}
                tabIndex={-1}
                id="quiz-divider-heading"
                className="text-lg sm:text-xl font-extrabold text-white focus:outline-none"
              >
                Interactive World Geography Quiz
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 text-xs">
              <span
                aria-live="polite"
                className="inline-flex items-center min-h-[44px] bg-white/10 border border-white/25 rounded-full px-3.5 font-bold text-white tabular-nums"
              >
                Live Score: {scoreCount} / {quizDeck.entries.length}
              </span>
              <button
                type="button"
                onClick={handleClearProgress}
                className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl px-4 py-2 font-semibold text-emerald-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear my progress</span>
              </button>
            </div>
          </div>
        </SectionBand>
      </div>

      {/* Tier 2: Interactive Quiz Module (#quiz-module) */}
      <SectionBand id="quiz-module" surface="ground" size="reading" density="standard" labelledBy="quiz-stage-title">
        <div className="space-y-6">
          <h2 id="quiz-stage-title" className="sr-only">
            Interactive Country Recall Quiz Stage
          </h2>

          <div id="geography-quiz-slot">
            {activeEntry ? (
              <GeographyQuizCard
                questionIndex={currentIndex}
                totalQuestions={quizDeck.entries.length}
                prompt={activeEntry.question.prompt}
                subLabel={`${activeEntry.question.countryName} (${activeEntry.question.factType.toUpperCase()})`}
                options={activeEntry.options}
                correctOptionId={activeEntry.correctOptionId}
                selectedOptionId={answersByIndex[currentIndex] ?? null}
                explanation={activeEntry.question.explanation}
                subStepperSteps={subStepperSteps}
                activeSubStepKey={activeSubStepKey}
                onSelectOption={handleSelectOption}
                onNext={handleNextQuestion}
              />
            ) : (
              <EmptyStateCard
                icon={Globe}
                title="No Verified Quiz Items Loaded"
                description="Select verified countries above or reset filters to generate an A-D geography recall quiz."
                primaryAction={{
                  label: 'Load All Verified Countries',
                  onClick: handleClearProgress
                }}
              />
            )}
          </div>

          <div id="geography-results-modal-slot">
            <GeographyScoreModal
              isOpen={isScoreModalOpen}
              onClose={() => setIsScoreModalOpen(false)}
              score={scoreCount}
              total={quizDeck.entries.length}
              onRetake={handleRetake}
              onNextScope={handleNextScope}
              onClearProgress={handleClearProgress}
              nextScopeLabel={
                filter.letter
                  ? 'Next Alphabet'
                  : filter.continentId
                    ? 'Next Continent'
                    : 'Next Global Batch'
              }
            />
          </div>
        </div>
      </SectionBand>
    </>
  );
}

