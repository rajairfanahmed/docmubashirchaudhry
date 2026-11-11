'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCountriesPage } from '@/lib/api';
import type { PaginatedCountryFilter, PaginatedResult } from '@/lib/data';
import type { CountryEntity } from '@/lib/schemas';
import { COUNTRY_DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export interface UsePaginatedCountriesOptions {
  filter: PaginatedCountryFilter;
  initialData?: PaginatedResult<CountryEntity>;
  enabled?: boolean;
}

export function getPaginatedCountriesQueryKey(filter: PaginatedCountryFilter) {
  return [
    'countries',
    'paginated',
    {
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? COUNTRY_DEFAULT_PAGE_SIZE,
      continentId: filter.continentId ?? '',
      regionId: filter.regionId ?? '',
      letter: filter.letter ?? '',
      search: filter.search ?? '',
      onlyVerified: Boolean(filter.onlyVerified),
      sort: filter.sort ?? 'default'
    }
  ] as const;
}

/**
 * Architectural TanStack Query hook wrapping GET /api/countries (24/page default)
 * with static /data/v1/geography/pages/ fallback via fetchCountriesPage.
 */
export function usePaginatedCountries({
  filter,
  initialData,
  enabled = true
}: UsePaginatedCountriesOptions) {
  const normalizedFilter: PaginatedCountryFilter = {
    pageSize: COUNTRY_DEFAULT_PAGE_SIZE,
    ...filter
  };

  return useQuery<PaginatedResult<CountryEntity>>({
    queryKey: getPaginatedCountriesQueryKey(normalizedFilter),
    queryFn: () => fetchCountriesPage(normalizedFilter),
    initialData,
    placeholderData: keepPreviousData,
    enabled
  });
}

