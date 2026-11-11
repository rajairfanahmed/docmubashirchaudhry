import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  PlayCircle
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { VerificationBadge } from '@/components/ui/Badge';
import { ProvenanceBox } from '@/components/ui/ProvenanceBox';
import { CorrectionTrigger } from '@/components/feedback/CorrectionTrigger';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { buildCountryPageMetadata, buildPageMetadata } from '@/lib/seo/metadata';
import { buildCountryProfileSchema } from '@/lib/seo/structured-data';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const countries = await repo.getCountries({ includeDrafts: false });
  return countries.map((country) => ({ slug: country.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const repo = getContentRepository();
  const [country, reference] = await Promise.all([
    repo.getCountry(slug),
    repo.getGeographyReference()
  ]);

  if (!country) {
    return buildPageMetadata({
      title: 'Country Not Found',
      description: 'Requested country profile was not found in the geography dataset.',
      path: `/geography/${slug}`,
      index: false
    });
  }

  return buildCountryPageMetadata({
    country,
    currencies: reference.currencies,
    languages: reference.languages
  });
}

export default async function CountryProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getContentRepository();
  const [country, reference] = await Promise.all([
    repo.getCountry(slug),
    repo.getGeographyReference()
  ]);

  if (!country) {
    notFound();
  }

  const [continent, region, sources] = await Promise.all([
    Promise.resolve(reference.continents.find((c) => c.id === country.continentId)),
    Promise.resolve(reference.regions.find((r) => r.id === country.regionId)),
    repo.getSources(country.verification.sourceIds)
  ]);

  const currencies = country.currencyIds
    .map((id) => reference.currencies.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const languages = country.officialLanguageIds
    .map((id) => reference.languages.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <>
      <JsonLd
        data={buildCountryProfileSchema({
          country,
          capitals: country.capitals,
          currencyNames: currencies.map((c) => `${c.name} (${c.code})`),
          languageNames: languages.map((l) => l.name),
          continentName: continent?.name,
          regionName: region?.name,
          sources
        })}
      />
      {/* Band 1: Country Hero Profile */}
      <SectionBand surface="ground" density="compact" labelledBy="country-profile-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Geography', href: '/geography' },
              ...(continent ? [{ label: continent.name, href: `/geography/continent/${continent.slug}` }] : []),
              { label: country.nameCommon }
            ]}
            currentPath={`/geography/${country.slug}`}
          />

          <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-6 lg:p-8 elevation-1 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
              <div className="w-24 sm:w-28 aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-1">
                <img
                  src={country.flag.svgPath}
                  alt={country.flag.alt}
                  width={112}
                  height={84}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono font-bold text-slate-800">
                    ISO {country.isoAlpha2} / {country.isoAlpha3}
                    {country.isoNumeric ? ` / ${country.isoNumeric}` : ''}
                  </span>
                  <VerificationBadge
                    status={country.verification.status}
                    date={country.verification.lastCheckedAt}
                  />
                </div>
                <h1 id="country-profile-heading" className="type-page-title text-[var(--dmc-ink-primary)] break-words">
                  {country.nameCommon}
                </h1>
                <p className="text-sm text-[var(--dmc-ink-secondary)] break-words">
                  Official Name: <strong className="text-[var(--dmc-ink-primary)]">{country.nameOfficial}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href={`/geography?country=${country.slug}#quiz-module`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                <span>Test in Quiz</span>
              </Link>
              <Link
                href="/geography"
                className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] bg-slate-100 hover:bg-slate-200 text-[var(--dmc-ink-primary)] font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>All Countries</span>
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>

      {/* Band 2: 7:5 Asymmetric Split (Canonical Record + Source Provenance) */}
      <SectionBand surface="muted" density="standard" labelledBy="country-facts-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Complete Country Fact Matrix */}
          <div className="lg:col-span-7 bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-6 lg:p-8 elevation-1 space-y-6 min-w-0">
            <h2 id="country-facts-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
              Verified Geographic Record
            </h2>

            <dl className="divide-y divide-[var(--dmc-border-subtle)] text-sm">
              <div
                className={`py-3.5 flex gap-2 ${
                  country.capitals.length > 2
                    ? 'flex-col items-start'
                    : 'flex-col sm:flex-row sm:items-center justify-between'
                }`}
              >
                <dt className="font-semibold text-[var(--dmc-ink-muted)] shrink-0">
                  Capital City{country.capitals.length > 1 ? 's (All Listed)' : ''}
                </dt>
                <dd
                  className={`flex flex-wrap gap-1.5 min-w-0 ${
                    country.capitals.length > 2 ? 'justify-start' : 'justify-start sm:justify-end'
                  }`}
                >
                  {country.capitals.length > 0 ? (
                    country.capitals.map((cap) => (
                      <AnswerHighlight
                        key={cap}
                        shape={country.capitals.length > 2 ? 'chip' : 'pill'}
                      >
                        {cap}
                      </AnswerHighlight>
                    ))
                  ) : (
                    <span className="text-[var(--dmc-ink-secondary)]">None specified</span>
                  )}
                </dd>
              </div>

              <div
                className={`py-3.5 flex gap-2 ${
                  currencies.length > 2
                    ? 'flex-col items-start'
                    : 'flex-col sm:flex-row sm:items-center justify-between'
                }`}
              >
                <dt className="font-semibold text-[var(--dmc-ink-muted)] shrink-0">
                  Official Currency{currencies.length > 1 ? 'ies (All Listed)' : ''}
                </dt>
                <dd
                  className={`flex flex-wrap gap-1.5 min-w-0 ${
                    currencies.length > 2 ? 'justify-start' : 'justify-start sm:justify-end'
                  }`}
                >
                  {currencies.length > 0 ? (
                    currencies.map((cur) => (
                      <AnswerHighlight
                        key={cur.id}
                        shape={currencies.length > 2 ? 'chip' : 'pill'}
                      >
                        {cur.name} ({cur.code}{cur.symbol ? ` · ${cur.symbol}` : ''})
                      </AnswerHighlight>
                    ))
                  ) : (
                    <span className="text-[var(--dmc-ink-secondary)]">None listed</span>
                  )}
                </dd>
              </div>

              <div
                className={`py-3.5 flex gap-2 ${
                  languages.length > 2
                    ? 'flex-col items-start'
                    : 'flex-col sm:flex-row sm:items-center justify-between'
                }`}
              >
                <dt className="font-semibold text-[var(--dmc-ink-muted)] shrink-0">
                  Official Language{languages.length > 1 ? 's (All Listed)' : ''}
                </dt>
                <dd
                  className={`flex flex-wrap gap-1.5 min-w-0 ${
                    languages.length > 2 ? 'justify-start' : 'justify-start sm:justify-end'
                  }`}
                >
                  {languages.length > 0 ? (
                    languages.map((lang) => (
                      <AnswerHighlight
                        key={lang.id}
                        shape={languages.length > 2 ? 'chip' : 'pill'}
                      >
                        {lang.name}{lang.nativeName ? ` (${lang.nativeName})` : ''}
                      </AnswerHighlight>
                    ))
                  ) : (
                    <span className="text-[var(--dmc-ink-secondary)]">None listed</span>
                  )}
                </dd>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <dt className="font-semibold text-[var(--dmc-ink-muted)] shrink-0">Continent &amp; Sub-Region</dt>
                <dd className="font-bold text-[var(--dmc-ink-primary)] min-w-0">
                  {continent?.name ?? country.continentId} &middot; {region?.name ?? country.subregion ?? country.regionId}
                </dd>
              </div>

              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <dt className="font-semibold text-[var(--dmc-ink-muted)] shrink-0">Recognition &amp; Difficulty</dt>
                <dd className="font-semibold text-[var(--dmc-ink-primary)] capitalize min-w-0">
                  {country.isSovereign ? 'UN Sovereign State Record' : 'Territory / Non-Member Entity'} &middot; {country.difficulty}
                </dd>
              </div>
            </dl>

            {country.disputed?.disputedNote && (
              <div role="note" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5 text-amber-950 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider">Disputed / Dual-Status Geography Note</div>
                  <p className="leading-relaxed">{country.disputed.disputedNote}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Provenance Citations & Correction Link */}
          <aside className="lg:col-span-5 space-y-4">
            <ProvenanceBox
              title="Sources & Verification"
              verification={country.verification}
              sources={sources}
              summary={`Verified geographic profile for ${country.nameCommon} (${country.isoAlpha3}).`}
            />

            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-5 elevation-1 space-y-2">
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Spot an updated capital name, currency transition, or official language amendment?
              </p>
              <CorrectionTrigger
                referenceTitle={`${country.nameCommon} (${country.isoAlpha3})`}
                category="geography"
                label="Report a correction"
              />
            </div>
          </aside>
        </div>
      </SectionBand>
    </>
  );
}
