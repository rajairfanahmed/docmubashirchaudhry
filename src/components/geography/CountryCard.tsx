import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import type { CountryEntity, Currency, Language } from '@/lib/schemas';
import { VerificationBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface CanonicalCountryCardProps {
  country: CountryEntity;
  currencies: Currency[];
  languages: Language[];
  continentName?: string;
  regionName?: string;
  onTestInQuiz?: (country: CountryEntity) => void;
  isCurrentQuizTarget?: boolean;
  priority?: boolean;
  className?: string;
}

const CAPITAL_CARD_CAP = 2;
const CURRENCY_CARD_CAP = 2;
const LANGUAGE_CARD_CAP = 3;

interface FactRowProps {
  label: string;
  items: string[];
  cap: number;
  fallbackText: string;
  countrySlug: string;
  countryName: string;
  isDisputed?: boolean;
}

function FactChipRow({
  label,
  items,
  cap,
  fallbackText,
  countrySlug,
  countryName,
  isDisputed
}: FactRowProps) {
  const visibleItems = items.slice(0, cap);
  const remainingCount = Math.max(0, items.length - visibleItems.length);
  const chipCount = visibleItems.length + (remainingCount > 0 ? 1 : 0) + (isDisputed ? 1 : 0);
  const stackRow = chipCount > 1;

  return (
    <div
      className={cn(
        'min-w-0',
        stackRow
          ? 'flex flex-col items-start gap-1'
          : 'flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3'
      )}
    >
      <dt className="text-[var(--color-ink-secondary)] font-medium shrink-0">{label}</dt>
      <dd
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-1 m-0 min-w-0 text-[var(--color-ink)] font-semibold',
          stackRow ? 'w-full justify-start' : 'w-full sm:w-auto sm:justify-end sm:text-right'
        )}
      >
        {visibleItems.length > 0 ? (
          <span className="break-words [overflow-wrap:anywhere]">
            {visibleItems.join(', ')}
          </span>
        ) : (
          <span className="text-[var(--color-ink-muted)] font-medium">{fallbackText}</span>
        )}

        {remainingCount > 0 && (
          <Link
            href={`/geography/${countrySlug}`}
            className="inline-flex items-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] hover:border-[var(--color-brand-deep)] hover:text-[var(--color-brand-deep)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-secondary)] transition-colors"
          >
            +{remainingCount} more
            <span className="sr-only">
              {' '}({items.length} total {label.toLowerCase()} for {countryName})
            </span>
          </Link>
        )}

        {isDisputed && <VerificationBadge status="disputed" label="Disputed" />}
      </dd>
    </div>
  );
}

export function CountryCard({
  country,
  currencies,
  languages,
  continentName,
  regionName,
  onTestInQuiz,
  isCurrentQuizTarget = false,
  priority = false,
  className
}: CanonicalCountryCardProps) {
  const capitalItems = country.capitals;
  const currencyItems = currencies.map((c) => `${c.name} (${c.code})`);
  const languageItems = languages.map((l) => l.name);

  return (
    <article
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 elevation-1 flex flex-col justify-between space-y-4 min-w-0 overflow-hidden',
        isCurrentQuizTarget && 'ring-2 ring-[var(--color-brand-deep)]/25 border-[var(--color-brand-deep)]',
        className
      )}
    >
      <div className="space-y-3.5 min-w-0">
        <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-[var(--color-border)] min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 aspect-[3/2] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={country.flag.svgPath}
                alt={country.flag.alt}
                width={40}
                height={27}
                className="w-full h-full object-contain"
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : undefined}
                decoding="async"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--color-ink)] leading-tight line-clamp-2 sm:truncate">
                <Link
                  href={`/geography/${country.slug}`}
                  className="hover:text-[var(--color-brand-deep)] hover:underline"
                >
                  {country.nameCommon}
                </Link>
              </h3>
              <div className="text-[11px] text-[var(--color-ink-muted)] truncate mt-0.5 tabular-nums">
                {continentName ?? 'World'}
                {regionName ? ` · ${regionName}` : ''} · {country.isoAlpha3}
              </div>
            </div>
          </div>

          <VerificationBadge status={country.verification.status} className="shrink-0" />
        </div>

        <dl className="space-y-2 text-xs min-w-0">
          <FactChipRow
            label={capitalItems.length > 1 ? 'Capitals' : 'Capital'}
            items={capitalItems}
            cap={CAPITAL_CARD_CAP}
            fallbackText="Not listed"
            countrySlug={country.slug}
            countryName={country.nameCommon}
            isDisputed={country.disputed?.capital}
          />

          <FactChipRow
            label={currencyItems.length > 1 ? 'Currencies' : 'Currency'}
            items={currencyItems}
            cap={CURRENCY_CARD_CAP}
            fallbackText="Varies"
            countrySlug={country.slug}
            countryName={country.nameCommon}
            isDisputed={country.disputed?.currency}
          />

          <FactChipRow
            label={languageItems.length > 1 ? 'Official Languages' : 'Official Language'}
            items={languageItems}
            cap={LANGUAGE_CARD_CAP}
            fallbackText="Varies"
            countrySlug={country.slug}
            countryName={country.nameCommon}
            isDisputed={country.disputed?.language}
          />
        </dl>
      </div>

      <div className="pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          href={`/geography/${country.slug}`}
          className="inline-flex items-center min-h-[44px] font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-brand-deep)] hover:underline"
        >
          Country Profile
          <span className="sr-only"> for {country.nameCommon}</span>
        </Link>

        {onTestInQuiz ? (
          <button
            type="button"
            onClick={() => onTestInQuiz(country)}
            className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] hover:bg-[var(--color-success-bg)] text-[var(--color-brand-deep)] border border-[var(--color-border)] font-semibold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Test in Quiz
              <span className="sr-only"> ({country.nameCommon})</span>
            </span>
          </button>
        ) : (
          <Link
            href={`/geography?country=${country.slug}#quiz-module`}
            className="dmc-press inline-flex items-center gap-1.5 min-h-[44px] px-2 font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Test in Quiz
              <span className="sr-only"> ({country.nameCommon})</span>
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}

