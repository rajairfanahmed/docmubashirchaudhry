import {
  getContentRepository,
  toLegacyCountry,
  type PaginatedCountryFilter,
  type PaginatedQuestionFilter,
  type PaginatedResult
} from '@/lib/data';
import type { Country } from '@/types/country';
import type { CountryEntity, DatasetManifest, Question } from '@/lib/schemas';

export interface FetchResult {
  countries: Country[];
  source: 'static-v1' | 'fallback' | 'repository';
  isFallback: boolean;
  datasetVersion?: string;
  error?: string;
}

/**
 * Normalizes a legacy REST-Countries-style JSON record into the flat Country interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCountry(raw: any): Country {
  const cca2 = String(raw?.cca2 || raw?.code || 'XX').toUpperCase();
  const capitalsArray: string[] = Array.isArray(raw?.capital)
    ? raw.capital
    : Array.isArray(raw?.allCapitals)
    ? raw.allCapitals
    : raw?.capital
    ? [String(raw.capital)]
    : [];

  const currenciesObj: Record<string, { name: string; symbol?: string }> =
    raw?.currencies && typeof raw.currencies === 'object' ? raw.currencies : {};
  const firstCurrencyCode = Object.keys(currenciesObj)[0];
  const primaryCurrency =
    typeof raw?.currency === 'string'
      ? raw.currency
      : firstCurrencyCode
      ? `${currenciesObj[firstCurrencyCode]?.name ?? firstCurrencyCode} (${firstCurrencyCode})`
      : 'N/A';

  const languagesList: string[] = Array.isArray(raw?.allLanguages)
    ? raw.allLanguages
    : raw?.languages && typeof raw.languages === 'object'
    ? Object.values(raw.languages).map(String)
    : raw?.language
    ? [String(raw.language)]
    : [];

  return {
    code: cca2,
    name: String(raw?.name?.common || raw?.name || 'Unknown'),
    officialName: String(raw?.name?.official || raw?.officialName || raw?.name?.common || raw?.name || 'Unknown'),
    capital: capitalsArray[0] || 'N/A',
    allCapitals: capitalsArray,
    currency: primaryCurrency,
    currencies: currenciesObj,
    language: languagesList[0] || 'N/A',
    allLanguages: languagesList,
    region: String(raw?.region || 'Global'),
    subregion: String(raw?.subregion || ''),
    flagSvg: String(raw?.flagSvg || raw?.flags?.svg || `https://flagcdn.com/${cca2.toLowerCase()}.svg`),
    flagEmoji: String(
      raw?.flagEmoji ||
        raw?.flag ||
        cca2.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    )
  };
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  if (typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPortalManifest(): Promise<DatasetManifest | null> {
  return fetchJsonWithTimeout<DatasetManifest>('/data/v1/manifest.json', 4000);
}

export async function fetchPortalSearchIndex(): Promise<string | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch('/data/v1/search-index/all.json');
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Loads country reference and quiz data strictly from static same-origin JSON artifacts
 * or the built-in verified ContentRepository (no exposed third-party API credentials).
 */
export async function fetchAllCountries(): Promise<FetchResult> {
  const staticV1 = await fetchJsonWithTimeout<Country[]>('/data/v1/geography/countries-quiz-v1.json', 5000);
  if (Array.isArray(staticV1) && staticV1.length > 0) {
    const manifest = await fetchPortalManifest();
    return {
      countries: staticV1,
      source: 'static-v1',
      isFallback: false,
      datasetVersion: manifest?.datasetVersion
    };
  }

  const fallback = await fetchJsonWithTimeout<unknown[]>('/data/countries-fallback.json', 4000);
  if (Array.isArray(fallback) && fallback.length > 0) {
    return {
      countries: fallback.map(normalizeCountry),
      source: 'fallback',
      isFallback: true
    };
  }

  // Final deterministic fallback directly from version-controlled ContentRepository JSON bundle
  const repo = getContentRepository();
  const [entities, ref] = await Promise.all([
    repo.getCountries({ includeDrafts: false }),
    repo.getGeographyReference()
  ]);

  const continentsById = new Map(ref.continents.map((c) => [c.id, c]));
  const currenciesById = new Map(ref.currencies.map((c) => [c.id, c]));
  const languagesById = new Map(ref.languages.map((l) => [l.id, l]));

  return {
    countries: entities.map((e) => toLegacyCountry(e, { continentsById, currenciesById, languagesById })),
    source: 'repository',
    isFallback: true
  };
}

/**
 * Fetches a paginated slice of published countries via `/api/countries`,
 * falling back to prebuilt static `/data/v1/geography/pages/` or in-memory ContentRepository.
 */
export async function fetchCountriesPage(
  filter: PaginatedCountryFilter = {}
): Promise<PaginatedResult<CountryEntity>> {
  const params = new URLSearchParams();
  if (filter.page !== undefined) params.set('page', String(filter.page));
  if (filter.pageSize !== undefined) params.set('pageSize', String(filter.pageSize));
  if (filter.continentId) params.set('continentId', filter.continentId);
  if (filter.regionId) params.set('regionId', filter.regionId);
  if (filter.letter) params.set('letter', filter.letter);
  if (filter.search) params.set('search', filter.search);
  if (filter.onlyVerified !== undefined) params.set('onlyVerified', String(filter.onlyVerified));
  if (filter.sort) params.set('sort', filter.sort);

  const apiPayload = await fetchJsonWithTimeout<PaginatedResult<CountryEntity>>(
    `/api/countries?${params.toString()}`,
    5000
  );
  if (apiPayload && Array.isArray(apiPayload.items) && apiPayload.pagination) {
    return apiPayload;
  }

  const hasDynamicFilters = Boolean(
    filter.continentId ||
      filter.regionId ||
      filter.letter ||
      filter.search ||
      filter.onlyVerified ||
      (filter.sort && filter.sort !== 'default')
  );
  const page = Math.max(1, Math.trunc(filter.page ?? 1));
  const pageSize = filter.pageSize ?? 24;

  if (!hasDynamicFilters && pageSize === 24) {
    const staticSlice = await fetchJsonWithTimeout<PaginatedResult<CountryEntity>>(
      `/data/v1/geography/pages/page-${page}.json`,
      4000
    );
    if (staticSlice && Array.isArray(staticSlice.items) && staticSlice.pagination) {
      return staticSlice;
    }
  }

  return getContentRepository().getCountriesPaginated({ ...filter, includeDrafts: false });
}

/**
 * Fetches a paginated slice of published MCQs via `/api/questions`,
 * falling back to prebuilt static `/data/v1/questions/pages/` or in-memory ContentRepository.
 */
export async function fetchQuestionsPage(
  filter: PaginatedQuestionFilter = {}
): Promise<PaginatedResult<Question>> {
  const params = new URLSearchParams();
  if (filter.page !== undefined) params.set('page', String(filter.page));
  if (filter.pageSize !== undefined) params.set('pageSize', String(filter.pageSize));
  if (filter.examId) params.set('examId', filter.examId);
  if (filter.subjectId) params.set('subjectId', filter.subjectId);
  if (filter.postId) params.set('postId', filter.postId);
  if (filter.topicIds && filter.topicIds.length > 0) {
    params.set('topicIds', filter.topicIds.join(','));
  }
  if (filter.difficulty) params.set('difficulty', filter.difficulty);
  if (filter.onlyVerified !== undefined) params.set('onlyVerified', String(filter.onlyVerified));

  const apiPayload = await fetchJsonWithTimeout<PaginatedResult<Question>>(
    `/api/questions?${params.toString()}`,
    5000
  );
  if (apiPayload && Array.isArray(apiPayload.items) && apiPayload.pagination) {
    return apiPayload;
  }

  const hasDynamicFilters = Boolean(
    filter.examId ||
      filter.subjectId ||
      filter.postId ||
      (filter.topicIds && filter.topicIds.length > 0) ||
      filter.difficulty ||
      filter.onlyVerified
  );
  const page = Math.max(1, Math.trunc(filter.page ?? 1));
  const pageSize = filter.pageSize ?? 20;

  if (!hasDynamicFilters && pageSize === 20) {
    const staticSlice = await fetchJsonWithTimeout<PaginatedResult<Question>>(
      `/data/v1/questions/pages/page-${page}.json`,
      4000
    );
    if (staticSlice && Array.isArray(staticSlice.items) && staticSlice.pagination) {
      return staticSlice;
    }
  }

  return getContentRepository().getQuestionsPaginated({ ...filter, includeDrafts: false });
}
