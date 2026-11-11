/**
 * Typed same-origin client data layer reading pre-built /data/v1/*.json artifacts.
 * Complies strictly with connect-src 'self' CSP rules and avoids dynamic runtime APIs.
 */

export const DATA_ENDPOINTS = {
  manifest: '/data/v1/manifest.json',
  sources: '/data/v1/sources.json',
  geographyReference: '/data/v1/geography/reference.json',
  countries: '/data/v1/geography/countries.json',
  countriesQuiz: '/data/v1/geography/countries-quiz-v1.json',
  countriesPagesIndex: '/data/v1/geography/pages/index.json',
  exams: '/data/v1/examinations/exams.json',
  examinationsBranding: '/data/v1/examinations/branding.json',
  ppscPosts: '/data/v1/examinations/posts-ppsc.json',
  ppscBlueprints: '/data/v1/examinations/blueprints-ppsc.json',
  subjects: '/data/v1/taxonomy/subjects.json',
  topics: '/data/v1/taxonomy/topics.json',
  ppscSampleQuestions: '/data/v1/questions/ppsc-samples.json',
  questionsPagesIndex: '/data/v1/questions/pages/index.json',
  pdfs: '/data/v1/resources/pdfs.json',
  searchIndex: '/data/v1/search-index/all.json'
} as const;

export type DataEndpointUrl = (typeof DATA_ENDPOINTS)[keyof typeof DATA_ENDPOINTS];

export type StaticFetchResult<T> =
  | { ok: true; data: T; cached: boolean }
  | { ok: false; error: string; status?: number };

export interface StaticFetchOptions {
  timeoutMs?: number;
  bypassCache?: boolean;
  signal?: AbortSignal;
}

const inFlightRequests = new Map<string, Promise<StaticFetchResult<unknown>>>();
const resolvedPayloadCache = new Map<string, unknown>();

export function clearStaticDataCache(): void {
  inFlightRequests.clear();
  resolvedPayloadCache.clear();
}

function isAllowedSameOriginDataPath(endpoint: string): boolean {
  return endpoint.startsWith('/data/v1/') && !endpoint.includes('..');
}

export async function fetchStaticData<T>(
  endpoint: string,
  options: StaticFetchOptions = {}
): Promise<StaticFetchResult<T>> {
  const { timeoutMs = 6000, bypassCache = false, signal } = options;

  if (!isAllowedSameOriginDataPath(endpoint)) {
    return {
      ok: false,
      error: `Blocked non-standard data path "${endpoint}". Only same-origin /data/v1/ assets are permitted.`
    };
  }

  if (!bypassCache && resolvedPayloadCache.has(endpoint)) {
    return {
      ok: true,
      data: resolvedPayloadCache.get(endpoint) as T,
      cached: true
    };
  }

  if (!bypassCache && inFlightRequests.has(endpoint)) {
    return inFlightRequests.get(endpoint) as Promise<StaticFetchResult<T>>;
  }

  if (typeof fetch !== 'function') {
    return {
      ok: false,
      error: 'Fetch API unavailable in current execution environment.'
    };
  }

  const requestPromise = (async (): Promise<StaticFetchResult<T>> => {
    const controller = new AbortController();
    const abortHandler = () => controller.abort();
    signal?.addEventListener('abort', abortHandler, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status} while loading ${endpoint}`,
          status: response.status
        };
      }

      const data = (await response.json()) as T;
      resolvedPayloadCache.set(endpoint, data);
      return {
        ok: true,
        data,
        cached: false
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? `Request timed out after ${timeoutMs}ms for ${endpoint}`
          : err instanceof Error
          ? err.message
          : 'Network error while fetching static data';
      return {
        ok: false,
        error: message
      };
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortHandler);
      inFlightRequests.delete(endpoint);
    }
  })();

  if (!bypassCache) {
    inFlightRequests.set(endpoint, requestPromise as Promise<StaticFetchResult<unknown>>);
  }

  return requestPromise;
}

