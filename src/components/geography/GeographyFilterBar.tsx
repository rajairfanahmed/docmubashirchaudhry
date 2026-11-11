'use client';

import React, { useMemo } from 'react';
import { PlayCircle, RotateCcw, Search } from 'lucide-react';
import type { Continent, Region } from '@/lib/schemas';
import type { GeographyFilterState } from './types';
import { AlphabetRail } from './AlphabetRail';
import { Button } from '@/components/ui/Button';

export interface GeographyFilterBarProps {
  continents: Continent[];
  regions: Region[];
  filter: GeographyFilterState;
  onChangeFilter: (next: GeographyFilterState) => void;
  onClearFilters: () => void;
  filteredCount: number;
  eligibleQuizCount: number;
  onQuizSelection?: () => void;
  letterCounts?: Record<string, number>;
}

export function GeographyFilterBar({
  continents,
  regions,
  filter,
  onChangeFilter,
  onClearFilters,
  filteredCount,
  eligibleQuizCount,
  onQuizSelection,
  letterCounts
}: GeographyFilterBarProps) {
  const visibleRegions = useMemo(() => {
    if (!filter.continentId) return regions;
    return regions.filter((r) => r.continentId === filter.continentId);
  }, [regions, filter.continentId]);

  const hasActiveFilter = Boolean(
    filter.search || filter.continentId || filter.regionId || filter.letter
  );

  return (
    <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-5 elevation-1 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search
            className="w-4 h-4 text-[var(--dmc-ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filter.search}
            onChange={(e) => onChangeFilter({ ...filter, search: e.target.value })}
            aria-label="Search country name, capital, or ISO code"
            placeholder="Search country, capital, currency..."
            className="w-full h-11 pl-10 pr-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs sm:text-sm text-[var(--dmc-ink-primary)] placeholder:text-[var(--dmc-ink-muted)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          />
        </div>

        {/* Continent Select */}
        <div className="lg:col-span-2">
          <select
            aria-label="Filter by continent"
            value={filter.continentId}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                continentId: e.target.value,
                regionId: ''
              })
            }
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs sm:text-sm text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="">All Continents</option>
            {continents.map((cont) => (
              <option key={cont.id} value={cont.id}>
                {cont.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region Select */}
        <div className="lg:col-span-3">
          <select
            aria-label="Filter by region"
            value={filter.regionId}
            onChange={(e) => onChangeFilter({ ...filter, regionId: e.target.value })}
            className="w-full h-11 px-3 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-muted)] text-xs sm:text-sm text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)]"
          >
            <option value="">All Regions ({visibleRegions.length})</option>
            {visibleRegions.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Count, Clear Filters & Quiz Selection */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between lg:justify-end gap-2">
          <div className="flex items-center justify-between gap-2">
            <span
              aria-live="polite"
              className="text-xs font-bold text-[var(--dmc-ink-primary)] tabular-nums"
            >
              {filteredCount} countr{filteredCount === 1 ? 'y' : 'ies'}
            </span>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 min-h-[44px] px-2.5 text-xs font-bold text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {onQuizSelection && (
            <Button
              type="button"
              variant="gold"
              size="md"
              className="w-full md:w-auto"
              disabled={eligibleQuizCount < 1}
              title={
                eligibleQuizCount < 1
                  ? 'Select at least 1 verified country to quiz this filter.'
                  : `Launch interactive quiz for ${eligibleQuizCount} matching countries`
              }
              onClick={onQuizSelection}
            >
              <PlayCircle className="w-4 h-4" aria-hidden="true" />
              <span>Quiz this selection ({eligibleQuizCount})</span>
            </Button>
          )}
        </div>
      </div>

      <AlphabetRail
        selectedLetter={filter.letter}
        onSelectLetter={(letter) => onChangeFilter({ ...filter, letter })}
        letterCounts={letterCounts}
      />
    </div>
  );
}

