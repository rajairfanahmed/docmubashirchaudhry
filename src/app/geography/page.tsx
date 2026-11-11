import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { GeographyWorkbench } from '@/components/geography/GeographyWorkbench';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { getServerDatasetVersion } from '@/lib/data/server-manifest';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildQuizResourceSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'World Geography Reference Guide & Interactive Quiz',
  description:
    'Browse verified sovereign countries with A-Z navigation, continent filters, capitals, currencies, and official languages in high-contrast pills, plus a 4-option interactive recall quiz.',
  path: '/geography'
});

export default async function GeographyWorkbenchPage() {
  const repo = getContentRepository();
  const [countries, reference] = await Promise.all([
    repo.getCountries({ includeDrafts: false }),
    repo.getGeographyReference()
  ]);
  const datasetVersion = getServerDatasetVersion();

  return (
    <>
      <JsonLd
        data={buildQuizResourceSchema({
          title: 'World Geography Reference Guide & Interactive Recall Quiz',
          description:
            'Browsable sovereign country reference and 4-option self-test quiz covering capitals, ISO 4217 currencies, and official languages.',
          path: '/geography',
          about: ['World Geography', 'Country Capitals', 'World Currencies', 'Official Languages'],
          questionCount: countries.length * 3
        })}
      />
      {/* Band 1: Header & Continent Hub Links */}
      <SectionBand surface="ground" density="compact" labelledBy="geography-heading">
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'Geography' }]} currentPath="/geography" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-amber-50 text-amber-900 border border-amber-200">
                <Globe className="w-3 h-3 mr-1" aria-hidden="true" />
                TIER 1 REFERENCE + TIER 2 INTERACTIVE QUIZ
              </span>
              <h1 id="geography-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                World Geography &amp; Nations Workbench
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)]">
                Explore {countries.length} curated countries and territories by continent, region, or A-Z index, then test recall directly in the interactive quiz below.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {reference.continents.map((cont) => (
                <Link
                  key={cont.id}
                  href={`/geography/continent/${cont.slug}`}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-primary)] hover:border-[var(--dmc-brand-emerald)] hover:text-[var(--dmc-brand-emerald)] transition-colors"
                >
                  {cont.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SectionBand>

      <GeographyWorkbench
        countries={countries}
        continents={reference.continents}
        regions={reference.regions}
        currencies={reference.currencies}
        languages={reference.languages}
        datasetVersion={datasetVersion}
      />
    </>
  );
}
