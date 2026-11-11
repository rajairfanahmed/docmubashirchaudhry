import { describe, it, expect } from 'vitest';
import {
  COUNTRY_DEFAULT_PAGE_SIZE,
  MCQ_DEFAULT_PAGE_SIZE,
  parsePageParam,
  clampPageNumber,
  buildPaginatedSearchParams,
  resetPageOnFilterChange
} from '@/lib/pagination';

describe('Step 1 Pagination URL State Helpers', () => {
  it('defines expected canonical page sizes for countries and MCQs', () => {
    expect(COUNTRY_DEFAULT_PAGE_SIZE).toBe(24);
    expect(MCQ_DEFAULT_PAGE_SIZE).toBe(20);
  });

  it('parses and clamps page query parameters safely', () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('')).toBe(1);
    expect(parsePageParam('-3')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam(['4', '9'])).toBe(4);
    expect(parsePageParam('11')).toBe(11);

    expect(clampPageNumber(0, 11)).toBe(1);
    expect(clampPageNumber(99, 11)).toBe(11);
    expect(clampPageNumber(5, 0)).toBe(1);
  });

  it('omits page=1 in buildPaginatedSearchParams while preserving active filters', () => {
    const initial = new URLSearchParams('continent=cont-asia&letter=P&page=3');

    const backToOne = buildPaginatedSearchParams(initial, 1);
    expect(backToOne.get('page')).toBeNull();
    expect(backToOne.get('continent')).toBe('cont-asia');
    expect(backToOne.get('letter')).toBe('P');

    const toFive = buildPaginatedSearchParams(initial, 5);
    expect(toFive.get('page')).toBe('5');
    expect(toFive.get('continent')).toBe('cont-asia');
  });

  it('resets page parameter back to omitted page 1 when filters change', () => {
    const current = new URLSearchParams('continent=cont-asia&page=7&search=pak');
    const updated = resetPageOnFilterChange(current, {
      continent: 'cont-europe',
      search: undefined
    });

    expect(updated.get('page')).toBeNull();
    expect(updated.get('continent')).toBe('cont-europe');
    expect(updated.get('search')).toBeNull();
  });
});

