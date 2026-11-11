import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Globe, PlayCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const ref = await repo.getGeographyReference();
  return ref.continents.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const repo = getContentRepository();
  const ref = await repo.getGeographyReference();
  const continent = ref.continents.find((c) => c.slug === slug);

  if (!continent) {
    return buildPageMetadata({
      title: 'Continent Not Found',
      description: 'Requested continent directory was not found.',
      path: `/geography/continent/${slug}`,
      index: false
    });
  }

  const countries = await repo.getCountries({ continentId: continent.id, includeDrafts: false });

  return buildPageMetadata({
    title: `${continent.name} Countries, Capitals & Sub-Regions`,
    description: `Explore every region and verified sovereign country profile in ${continent.name} with capitals, currencies, and direct quiz links.`,
    path: `/geography/continent/${continent.slug}`,
    index: countries.length > 0
  });
}

export default async function ContinentDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const repo = getContentRepository();
  const reference = await repo.getGeographyReference();
  const continent = reference.continents.find((c) => c.slug === slug);

  if (!continent) {
    notFound();
  }

  const countries = await repo.getCountries({
    continentId: continent.id,
    includeDrafts: false
  });
  const continentRegions = reference.regions.filter((r) => r.continentId === continent.id);

  return (
    <>
      <SectionBand surface="ground" density="compact" labelledBy="continent-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Geography', href: '/geography' },
              { label: continent.name }
            ]}
            currentPath={`/geography/continent/${continent.slug}`}
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2 max-w-3xl">
              <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
                <Globe className="w-3 h-3 mr-1" aria-hidden="true" />
                CONTINENT INDEX &middot; {continent.code}
              </span>
              <h1 id="continent-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                {continent.name} Regions &amp; Countries
              </h1>
              <p className="type-body-base text-[var(--dmc-ink-secondary)] tabular-nums">
                {countries.length} countries grouped across {continentRegions.length} geographic sub-region{continentRegions.length === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/geography"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-white border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-primary)] text-xs font-bold px-4 py-2 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>All Continents</span>
              </Link>
              <Link
                href={`/geography?continent=${continent.slug}#quiz-module`}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                <span>Quiz {continent.name}</span>
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="standard" labelledBy="regions-list-heading">
        <div className="space-y-10">
          <h2 id="regions-list-heading" className="sr-only">
            Sub-Regions in {continent.name}
          </h2>

          {continentRegions.map((region) => {
            const regionCountries = countries.filter((c) => c.regionId === region.id);
            if (regionCountries.length === 0) return null;

            return (
              <section key={region.id} aria-labelledby={`region-${region.slug}`} className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--dmc-border-subtle)] pb-2">
                  <h3 id={`region-${region.slug}`} className="type-section-heading text-[var(--dmc-ink-primary)]">
                    {region.name}
                  </h3>
                  <span className="text-xs font-bold text-[var(--dmc-ink-muted)] tabular-nums">
                    {regionCountries.length} Countries
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionCountries.map((country) => (
                    <Link
                      key={country.id}
                      href={`/geography/${country.slug}`}
                      className="bg-white border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-emerald)] rounded-2xl p-4 elevation-1 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-7 rounded border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                          <img
                            src={country.flag.svgPath}
                            alt={country.flag.alt}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--dmc-ink-primary)] group-hover:text-[var(--dmc-brand-emerald)] truncate">
                            {country.nameCommon}
                          </div>
                          <div className="text-xs text-[var(--dmc-ink-muted)] truncate">
                            Capital: <span className="font-semibold text-[var(--dmc-ink-primary)]">{country.capitals[0] ?? 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--dmc-ink-muted)] group-hover:text-[var(--dmc-brand-emerald)] shrink-0" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </SectionBand>
    </>
  );
}
