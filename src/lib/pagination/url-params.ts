export const COUNTRY_DEFAULT_PAGE_SIZE = 24 as const;
export const MCQ_DEFAULT_PAGE_SIZE = 20 as const;

/**
 * Parses a URL query parameter into a positive 1-based page number,
 * returning fallback (1) for empty, NaN, or non-positive values.
 */
export function parsePageParam(
  raw: string | string[] | null | undefined,
  fallback = 1
): number {
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token) return fallback;
  const parsed = Number.parseInt(token.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

/**
 * Clamps a 1-based page number inside [1, Math.max(1, totalPages)].
 */
export function clampPageNumber(page: number, totalPages: number): number {
  const safeMax = Math.max(1, totalPages);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.trunc(page), safeMax);
}

/**
 * Updates `page` inside URLSearchParams while omitting `?page=1` for clean canonical links.
 */
export function buildPaginatedSearchParams(
  current: URLSearchParams | string,
  nextPage: number
): URLSearchParams {
  const params =
    typeof current === 'string'
      ? new URLSearchParams(current)
      : new URLSearchParams(current.toString());

  if (!Number.isFinite(nextPage) || nextPage <= 1) {
    params.delete('page');
  } else {
    params.set('page', String(Math.trunc(nextPage)));
  }

  return params;
}

/**
 * Applies filter key updates and clears stale `page` state back to page 1.
 */
export function resetPageOnFilterChange(
  current: URLSearchParams | string,
  updates: Record<string, string | undefined>
): URLSearchParams {
  const params =
    typeof current === 'string'
      ? new URLSearchParams(current)
      : new URLSearchParams(current.toString());

  params.delete('page');
  for (const [key, value] of Object.entries(updates)) {
    const trimmed = value?.trim();
    if (trimmed) {
      params.set(key, trimmed);
    } else {
      params.delete(key);
    }
  }

  return params;
}

