import fs from 'node:fs';
import path from 'node:path';
import {
  CountryEntitySchema,
  CurrencySchema,
  LanguageSchema,
  RegionSchema,
  SourceSchema,
  type Continent,
  type CountryEntity,
  type Currency,
  type Language,
  type Region,
  type Source
} from '../src/lib/schemas';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');
const PUBLIC_FALLBACK_PATH = path.join(ROOT, 'public', 'data', 'countries-fallback.json');

const DEFAULT_MLEDOZE_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';
const TODAY = '2026-11-11';

interface RawUpstreamCountry {
  name?: {
    common?: string;
    official?: string;
  };
  cca2?: string;
  cca3?: string;
  ccn3?: string;
  independent?: boolean | null;
  region?: string;
  subregion?: string;
  capital?: string[];
  currencies?: Record<string, { name?: string; symbol?: string }>;
  languages?: Record<string, string>;
  flags?: {
    svg?: string;
  };
}

const CONTINENT_BY_REGION_NAME: Record<string, string> = {
  Asia: 'cont-asia',
  Europe: 'cont-europe',
  Africa: 'cont-africa',
  Americas: 'cont-americas',
  Oceania: 'cont-oceania',
  Antarctic: 'cont-antarctica',
  Antarctica: 'cont-antarctica'
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF'
]);

const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD',
  'IQD',
  'JOD',
  'KWD',
  'LYD',
  'OMR',
  'TND'
]);

const EXTRA_FALLBACK_CURRENCIES_BY_CCA2: Record<string, string[]> = {
  FM: ['usd']
};

const DISPUTED_NOTES_BY_CCA2: Record<
  string,
  NonNullable<CountryEntity['disputed']>
> = {
  TW: {
    sovereignty: true,
    disputedNote:
      'Sovereignty and UN representation status of Taiwan remain subjects of international dispute.'
  },
  XK: {
    sovereignty: true,
    disputedNote:
      'Diplomatic recognition and UN membership of Kosovo remain partially recognized and disputed internationally.'
  },
  EH: {
    sovereignty: true,
    disputedNote:
      'Sovereignty over Western Sahara is listed as a non-self-governing territory by the UN and remains disputed.'
  }
};

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function slugify(input: string): string {
  const folded = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ø/g, 'o')
    .replace(/Ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/ß/g, 'ss')
    .replace(/&/g, ' and ')
    .toLowerCase();

  return folded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countryFlagEmoji(cca2: string): string {
  const upper = cca2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '🏳️';
  return Array.from(upper)
    .map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
    .join('');
}

function inferMinorUnit(code: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.trim().length > 0))];
}

async function loadUpstreamCountries(): Promise<{
  rawCountries: RawUpstreamCountry[];
  sourceLabel: string;
}> {
  const cliInputArg = process.argv.find((arg) => arg.startsWith('--input='));
  if (cliInputArg) {
    const localPath = path.resolve(ROOT, cliInputArg.slice('--input='.length));
    const parsed = readJsonFile<RawUpstreamCountry[]>(localPath);
    return { rawCountries: parsed, sourceLabel: `local:${localPath}` };
  }

  const v5Key = process.env.REST_COUNTRIES_V5_API_KEY?.trim();
  const v5Url = process.env.REST_COUNTRIES_V5_BASE_URL?.trim();
  if (v5Key && v5Url) {
    const res = await fetch(v5Url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${v5Key}`
      }
    });
    if (!res.ok) {
      throw new Error(`REST Countries v5 fetch failed (${res.status}) from ${v5Url}`);
    }
    const payload = (await res.json()) as RawUpstreamCountry[];
    return { rawCountries: payload, sourceLabel: v5Url };
  }

  const sourceUrl = process.env.COUNTRIES_SYNC_SOURCE_URL?.trim() || DEFAULT_MLEDOZE_URL;
  const res = await fetch(sourceUrl, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Upstream countries fetch failed (${res.status}) from ${sourceUrl}`);
  }
  const payload = (await res.json()) as RawUpstreamCountry[];
  return { rawCountries: payload, sourceLabel: sourceUrl };
}

async function main(): Promise<void> {
  const { rawCountries, sourceLabel } = await loadUpstreamCountries();
  if (!Array.isArray(rawCountries) || rawCountries.length === 0) {
    throw new Error('Upstream countries dataset returned empty or non-array payload.');
  }

  const sourcesFile = readJsonFile<{ schemaVersion: 1; sources: Source[] }>(
    path.join(DATA_DIR, 'sources.json')
  );
  const continentsFile = readJsonFile<{ schemaVersion: 1; continents: Continent[] }>(
    path.join(DATA_DIR, 'geography', 'continents.json')
  );
  const regionsFile = readJsonFile<{ schemaVersion: 1; regions: Region[] }>(
    path.join(DATA_DIR, 'geography', 'regions.json')
  );
  const currenciesFile = readJsonFile<{ schemaVersion: 1; currencies: Currency[] }>(
    path.join(DATA_DIR, 'geography', 'currencies.json')
  );
  const languagesFile = readJsonFile<{ schemaVersion: 1; languages: Language[] }>(
    path.join(DATA_DIR, 'geography', 'languages.json')
  );
  const existingCountriesFile = readJsonFile<{ schemaVersion: 1; countries: CountryEntity[] }>(
    path.join(DATA_DIR, 'geography', 'countries.json')
  );

  const continentsById = new Map(continentsFile.continents.map((c) => [c.id, c]));

  // Preserve curated regions first (e.g. reg-australia-nz)
  const regionsList: Region[] = [...regionsFile.regions];
  const regionsByKey = new Map<string, Region>();
  for (const r of regionsList) {
    regionsByKey.set(`${r.continentId}:${r.name.toLowerCase()}`, r);
    regionsByKey.set(`${r.continentId}:${r.slug}`, r);
  }

  // Preserve curated currencies first, ensure USD exists for Micronesia fallback
  const currenciesList: Currency[] = [...currenciesFile.currencies];
  const currenciesById = new Map(currenciesList.map((c) => [c.id, c]));
  if (!currenciesById.has('usd')) {
    const usd = CurrencySchema.parse({
      id: 'usd',
      code: 'USD',
      name: 'United States dollar',
      symbol: '$',
      minorUnit: 2
    });
    currenciesList.push(usd);
    currenciesById.set('usd', usd);
  }

  // Preserve curated languages first (with nativeName / iso639_1 / family)
  const languagesList: Language[] = [...languagesFile.languages];
  const languagesById = new Map(languagesList.map((l) => [l.id, l]));

  const existingById = new Map(existingCountriesFile.countries.map((c) => [c.id, c]));
  const existingIndexById = new Map(
    existingCountriesFile.countries.map((c, idx) => [c.id, idx])
  );
  const usedSlugs = new Set(existingCountriesFile.countries.map((c) => c.slug));

  const syncedCountries: CountryEntity[] = [];

  for (const raw of rawCountries) {
    const cca2 = raw.cca2?.trim().toUpperCase();
    const cca3 = raw.cca3?.trim().toUpperCase();
    if (!cca2 || !/^[A-Z]{2}$/.test(cca2) || !cca3 || !/^[A-Z]{3}$/.test(cca3)) {
      continue;
    }

    const id = cca3.toLowerCase();
    const existing = existingById.get(id);
    const nameCommon = existing?.nameCommon ?? raw.name?.common?.trim() ?? cca3;
    const nameOfficial = existing?.nameOfficial ?? raw.name?.official?.trim() ?? nameCommon;

    const continentId =
      existing?.continentId ??
      CONTINENT_BY_REGION_NAME[raw.region?.trim() ?? ''] ??
      'cont-antarctica';

    const rawSubregion =
      raw.subregion?.trim() ||
      (continentId === 'cont-antarctica' ? 'Antarctic' : `${raw.region?.trim() || 'Global'} General`);
    const subregionSlug = slugify(rawSubregion);
    let region =
      (existing ? regionsList.find((r) => r.id === existing.regionId) : undefined) ??
      regionsByKey.get(`${continentId}:${rawSubregion.toLowerCase()}`) ??
      regionsByKey.get(`${continentId}:${subregionSlug}`);

    if (!region) {
      region = RegionSchema.parse({
        id: `reg-${subregionSlug}`,
        slug: subregionSlug,
        name: rawSubregion,
        continentId
      });
      regionsList.push(region);
      regionsByKey.set(`${continentId}:${rawSubregion.toLowerCase()}`, region);
      regionsByKey.set(`${continentId}:${subregionSlug}`, region);
    }

    // Currencies
    const upstreamCurrencyIds: string[] = [];
    for (const [rawCode, meta] of Object.entries(raw.currencies ?? {})) {
      const code = rawCode.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) continue;
      const curId = code.toLowerCase();
      if (!currenciesById.has(curId)) {
        const cleanSymbol = meta?.symbol?.trim();
        const created = CurrencySchema.parse({
          id: curId,
          code,
          name: meta?.name?.trim() || code,
          ...(cleanSymbol ? { symbol: cleanSymbol } : {}),
          minorUnit: inferMinorUnit(code)
        });
        currenciesList.push(created);
        currenciesById.set(curId, created);
      }
      upstreamCurrencyIds.push(curId);
    }

    const extraCurrencyFallback = EXTRA_FALLBACK_CURRENCIES_BY_CCA2[cca2] ?? [];
    const currencyIds =
      existing && existing.currencyIds.length > 0
        ? existing.currencyIds
        : uniqueStrings(
            upstreamCurrencyIds.length > 0 ? upstreamCurrencyIds : extraCurrencyFallback
          );

    // Languages
    const upstreamLangIds: string[] = [];
    for (const [rawLangKey, rawLangName] of Object.entries(raw.languages ?? {})) {
      const key = rawLangKey.trim().toLowerCase();
      const langName = String(rawLangName ?? '').trim();
      if (!langName) continue;

      if (/^[a-z]{3}$/.test(key)) {
        if (!languagesById.has(key)) {
          const created = LanguageSchema.parse({
            id: key,
            iso639_2: key,
            name: langName
          });
          languagesList.push(created);
          languagesById.set(key, created);
        }
        upstreamLangIds.push(key);
      } else if (/^[a-z]{2}$/.test(key)) {
        if (!languagesById.has(key)) {
          const created = LanguageSchema.parse({
            id: key,
            iso639_1: key,
            name: langName
          });
          languagesList.push(created);
          languagesById.set(key, created);
        }
        upstreamLangIds.push(key);
      }
    }

    const officialLanguageIds =
      existing && existing.officialLanguageIds.length > 0
        ? existing.officialLanguageIds
        : uniqueStrings(upstreamLangIds);

    // Slug with curated stability + uniqueness
    let slug = existing?.slug ?? slugify(nameCommon);
    if (!slug) {
      slug = id;
    }
    if (!existing) {
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${id}`;
      }
      usedSlugs.add(slug);
    }

    const capitals =
      existing && existing.capitals.length > 0
        ? existing.capitals
        : uniqueStrings(Array.isArray(raw.capital) ? raw.capital : []);

    const isSovereign =
      existing !== undefined
        ? existing.isSovereign
        : raw.independent === true;

    const disputed = existing?.disputed ?? DISPUTED_NOTES_BY_CCA2[cca2];

    const ccn3 = raw.ccn3?.trim();
    const isoNumeric =
      ccn3 && /^\d{3}$/.test(ccn3) ? ccn3 : existing?.isoNumeric;

    const verificationStatus: CountryEntity['verification']['status'] = disputed
      ? 'disputed'
      : existing?.verification.status ?? 'verified';

    const sourceIds = uniqueStrings([
      ...(existing?.verification.sourceIds ?? ['src-un-geodata-m49', 'src-iso-4217']),
      'src-mledoze-countries'
    ]).filter((sid) => sid !== 'src-rest-countries-v31');

    const country = CountryEntitySchema.parse({
      id,
      slug,
      isoAlpha2: cca2,
      isoAlpha3: cca3,
      ...(isoNumeric ? { isoNumeric } : {}),
      nameCommon,
      nameOfficial,
      capitals,
      continentId,
      regionId: region.id,
      ...(rawSubregion ? { subregion: rawSubregion } : {}),
      currencyIds,
      officialLanguageIds,
      flag: existing?.flag ?? {
        svgPath: `https://flagcdn.com/${cca2.toLowerCase()}.svg`,
        emoji: countryFlagEmoji(cca2),
        alt: `National flag of ${nameCommon}`
      },
      isSovereign,
      difficulty: existing?.difficulty ?? (isSovereign ? 'standard' : 'advanced'),
      tags:
        existing?.tags ??
        uniqueStrings([
          continentsById.get(continentId)?.slug ?? slugify(raw.region ?? 'global'),
          region.slug
        ]),
      ...(disputed ? { disputed } : {}),
      status: existing?.status ?? 'published',
      verification: {
        status: verificationStatus,
        sourceIds,
        verifiedAt: existing?.verification.verifiedAt ?? TODAY,
        lastCheckedAt: TODAY,
        reviewIntervalDays: existing?.verification.reviewIntervalDays ?? 180,
        ...(existing?.verification.notes ? { notes: existing.verification.notes } : {})
      }
    });

    syncedCountries.push(country);
  }

  // Deterministic order: curated leading positions first (so pakistan stays [0]), then alphabetical by nameCommon
  syncedCountries.sort((a, b) => {
    const idxA = existingIndexById.get(a.id);
    const idxB = existingIndexById.get(b.id);
    if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
    if (idxA !== undefined) return -1;
    if (idxB !== undefined) return 1;
    return a.nameCommon.localeCompare(b.nameCommon, 'en');
  });

  // Upsert mledoze citation cleanly in sources.json
  const mledozeSource = SourceSchema.parse({
    id: 'src-mledoze-countries',
    title: 'World Countries Open Dataset (mledoze/countries)',
    authorityType: 'un_geodata',
    url: DEFAULT_MLEDOZE_URL,
    accessedAt: TODAY,
    reliability: 'primary',
    publisher: 'Open Source ISO-3166 & UN M49 Contributors',
    notes:
      'Complete 250-territory canonical ISO 3166-1, currency, language, and regional snapshot replacing deprecated REST Countries v3.1.'
  });

  const updatedSources = sourcesFile.sources.map((src) =>
    src.id === 'src-rest-countries-v31'
      ? SourceSchema.parse({
          ...src,
          notes:
            'Legacy REST Countries v3.1 endpoint deprecated upstream in favor of v5 auth; superseded by src-mledoze-countries for full 250-territory sync.'
        })
      : src
  );
  const mledozeIdx = updatedSources.findIndex((s) => s.id === 'src-mledoze-countries');
  if (mledozeIdx >= 0) {
    updatedSources[mledozeIdx] = mledozeSource;
  } else {
    updatedSources.push(mledozeSource);
  }

  // Write canonical datasets
  writeJsonFile(path.join(DATA_DIR, 'sources.json'), {
    schemaVersion: 1,
    sources: updatedSources
  });
  writeJsonFile(path.join(DATA_DIR, 'geography', 'regions.json'), {
    schemaVersion: 1,
    regions: regionsList
  });
  writeJsonFile(path.join(DATA_DIR, 'geography', 'currencies.json'), {
    schemaVersion: 1,
    currencies: currenciesList
  });
  writeJsonFile(path.join(DATA_DIR, 'geography', 'languages.json'), {
    schemaVersion: 1,
    languages: languagesList
  });
  writeJsonFile(path.join(DATA_DIR, 'geography', 'countries.json'), {
    schemaVersion: 1,
    countries: syncedCountries
  });

  // Sync legacy fallback JSON so fallback callers also receive all 250 countries
  const legacyFallback = syncedCountries.map((country) => {
    const currenciesObj: Record<string, { name: string; symbol?: string }> = {};
    for (const cid of country.currencyIds) {
      const cur = currenciesById.get(cid);
      if (cur) {
        currenciesObj[cur.code] = {
          name: cur.name,
          ...(cur.symbol ? { symbol: cur.symbol } : {})
        };
      }
    }

    const languagesObj: Record<string, string> = {};
    for (const lid of country.officialLanguageIds) {
      const lang = languagesById.get(lid);
      if (lang) {
        languagesObj[lang.iso639_2 ?? lang.id] = lang.name;
      }
    }

    return {
      name: { common: country.nameCommon, official: country.nameOfficial },
      cca2: country.isoAlpha2,
      cca3: country.isoAlpha3,
      capital: country.capitals,
      currencies: currenciesObj,
      languages: languagesObj,
      region: continentsById.get(country.continentId)?.name ?? 'Global',
      subregion: country.subregion ?? '',
      flags: { svg: country.flag.svgPath }
    };
  });

  writeJsonFile(PUBLIC_FALLBACK_PATH, legacyFallback);

  console.log(
    JSON.stringify(
      {
        source: sourceLabel,
        countriesSynced: syncedCountries.length,
        sovereignCount: syncedCountries.filter((c) => c.isSovereign).length,
        regionsCount: regionsList.length,
        currenciesCount: currenciesList.length,
        languagesCount: languagesList.length
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[sync-countries] Failed:', err);
  process.exit(1);
});

