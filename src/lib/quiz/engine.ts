import type { CountryEntity, Currency, Language } from '@/lib/schemas';

export type GeographyFactType = 'capital' | 'currency' | 'language';

export interface GeneratedGeographyQuestion {
  countryId: string;
  countryIsoAlpha2: string;
  countryName: string;
  factType: GeographyFactType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation: string;
  distractorSources: Array<'sameRegion' | 'sameContinent' | 'global'>;
}

export interface GeographyLookupMaps {
  currenciesById?: Map<string, Currency>;
  languagesById?: Map<string, Language>;
}

/**
 * Unicode NFD + diacritic removal + case/whitespace normalization per PRD Section 3.2/8.4.
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Computes a deterministic 32-bit seed from numeric or string seed input using FNV-1a.
 */
export function hashSeed(seed: string | number): number {
  const str = String(seed);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic PRNG (Mulberry32) so quiz runs are reproducible when seeded.
 */
export function createSeededRng(seed: string | number): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates shuffle without mutating input array.
 */
export function deterministicShuffle<T>(items: readonly T[], seed: string | number): T[] {
  const copy = [...items];
  const rng = createSeededRng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getCountryAcceptedValues(
  country: CountryEntity,
  factType: GeographyFactType,
  maps: GeographyLookupMaps
): { displayPrimary: string; accepted: string[]; exclusiveKeys: Set<string> } {
  if (factType === 'capital') {
    const capitals = country.capitals.filter((c) => c.trim().length > 0);
    return {
      displayPrimary: capitals[0] ?? '',
      accepted: capitals,
      exclusiveKeys: new Set(capitals.map(normalizeAnswer))
    };
  }

  if (factType === 'currency') {
    const accepted: string[] = [];
    const exclusiveKeys = new Set<string>();
    let displayPrimary = '';

    for (const cid of country.currencyIds) {
      const currency = maps.currenciesById?.get(cid);
      const formatted = currency ? `${currency.name} (${currency.code})` : cid.toUpperCase();
      if (!displayPrimary) displayPrimary = formatted;
      accepted.push(formatted);
      if (currency) {
        accepted.push(currency.name);
        accepted.push(currency.code);
        exclusiveKeys.add(normalizeAnswer(currency.name));
        exclusiveKeys.add(normalizeAnswer(currency.code));
      }
      exclusiveKeys.add(normalizeAnswer(formatted));
      exclusiveKeys.add(normalizeAnswer(cid));
    }

    return { displayPrimary, accepted, exclusiveKeys };
  }

  // language
  const accepted: string[] = [];
  const exclusiveKeys = new Set<string>();
  let displayPrimary = '';
  for (const lid of country.officialLanguageIds) {
    const lang = maps.languagesById?.get(lid);
    const label = lang ? lang.name : lid;
    if (!displayPrimary) displayPrimary = label;
    accepted.push(label);
    exclusiveKeys.add(normalizeAnswer(label));
    exclusiveKeys.add(normalizeAnswer(lid));
  }
  return { displayPrimary, accepted, exclusiveKeys };
}

function isFactDisputed(country: CountryEntity, factType: GeographyFactType): boolean {
  if (country.verification.status === 'disputed') {
    return true;
  }
  if (!country.disputed) return false;
  if (country.disputed.sovereignty) return true;
  if (factType === 'capital' && country.disputed.capital) return true;
  if (factType === 'currency' && country.disputed.currency) return true;
  if (factType === 'language' && country.disputed.language) return true;
  return false;
}

function collectOrderedDistractors(
  target: CountryEntity,
  targetMeta: ReturnType<typeof getCountryAcceptedValues>,
  allCountries: readonly CountryEntity[],
  factType: GeographyFactType,
  maps: GeographyLookupMaps,
  seed: string | number
): Array<{ label: string; tier: 'sameRegion' | 'sameContinent' | 'global' }> {
  const sameRegion: CountryEntity[] = [];
  const sameContinent: CountryEntity[] = [];
  const globalPool: CountryEntity[] = [];

  for (const candidate of allCountries) {
    if (candidate.id === target.id) continue;
    if (candidate.status !== 'published' || candidate.verification.status !== 'verified') continue;
    if (isFactDisputed(candidate, factType)) continue;

    if (candidate.regionId === target.regionId) {
      sameRegion.push(candidate);
    } else if (candidate.continentId === target.continentId) {
      sameContinent.push(candidate);
    } else {
      globalPool.push(candidate);
    }
  }

  const picked: Array<{ label: string; tier: 'sameRegion' | 'sameContinent' | 'global' }> = [];
  const seenLabels = new Set<string>(targetMeta.exclusiveKeys);

  const scanTier = (
    tierCountries: CountryEntity[],
    tierName: 'sameRegion' | 'sameContinent' | 'global'
  ) => {
    const shuffled = deterministicShuffle(tierCountries, `${seed}:${tierName}`);
    for (const candidate of shuffled) {
      if (picked.length >= 3) break;
      const candMeta = getCountryAcceptedValues(candidate, factType, maps);
      if (!candMeta.displayPrimary) continue;

      // Reject candidate if ANY of its accepted keys overlaps with target's accepted keys
      let overlapsTarget = false;
      for (const k of candMeta.exclusiveKeys) {
        if (targetMeta.exclusiveKeys.has(k)) {
          overlapsTarget = true;
          break;
        }
      }
      if (overlapsTarget) continue;

      const normLabel = normalizeAnswer(candMeta.displayPrimary);
      if (seenLabels.has(normLabel)) continue;

      seenLabels.add(normLabel);
      picked.push({ label: candMeta.displayPrimary, tier: tierName });
    }
  };

  scanTier(sameRegion, 'sameRegion');
  scanTier(sameContinent, 'sameContinent');
  scanTier(globalPool, 'global');

  return picked;
}

/**
 * Checks whether a country is eligible to generate a verified, unambiguous MCQ for `factType`.
 */
export function isCountryEligibleForFact(
  country: CountryEntity,
  factType: GeographyFactType,
  allCountries: readonly CountryEntity[],
  maps: GeographyLookupMaps = {}
): boolean {
  if (country.status !== 'published' || country.verification.status !== 'verified') {
    return false;
  }
  if (isFactDisputed(country, factType)) {
    return false;
  }
  const meta = getCountryAcceptedValues(country, factType, maps);
  if (!meta.displayPrimary) {
    return false;
  }
  const distractors = collectOrderedDistractors(country, meta, allCountries, factType, maps, `${country.id}:${factType}`);
  return distractors.length >= 3;
}

/**
 * Generates a single deterministic 4-option Geography MCQ honoring multi-answer exclusions,
 * disputed fact exclusion, and hierarchical distractors (sameRegion -> sameContinent -> global).
 */
export function generateGeographyQuestion(
  target: CountryEntity,
  factType: GeographyFactType,
  allCountries: readonly CountryEntity[],
  maps: GeographyLookupMaps = {},
  seed: string | number = `${target.id}:${factType}`
): GeneratedGeographyQuestion | null {
  if (target.status !== 'published' || target.verification.status !== 'verified') {
    return null;
  }
  if (isFactDisputed(target, factType)) {
    return null;
  }

  const targetMeta = getCountryAcceptedValues(target, factType, maps);
  if (!targetMeta.displayPrimary) {
    return null;
  }

  const distractors = collectOrderedDistractors(target, targetMeta, allCountries, factType, maps, seed);
  if (distractors.length < 3) {
    return null;
  }

  const options = deterministicShuffle(
    [targetMeta.displayPrimary, ...distractors.map((d) => d.label)],
    `${seed}:options`
  );

  const promptMap: Record<GeographyFactType, string> = {
    capital: `What is the official capital of ${target.nameCommon}?`,
    currency: `Which national currency is officially used in ${target.nameCommon}?`,
    language: `Which official language is spoken in ${target.nameCommon}?`
  };

  const explanation =
    factType === 'capital' && targetMeta.accepted.length > 1
      ? `${target.nameCommon} recognizes multiple official capitals: ${targetMeta.accepted.join(', ')}.`
      : factType === 'capital'
      ? `The official capital of ${target.nameCommon} is ${targetMeta.displayPrimary}.`
      : factType === 'currency'
      ? `The official currency of ${target.nameCommon} is ${targetMeta.accepted[0]}.`
      : `The official language reference lists ${Array.from(new Set(targetMeta.accepted)).join(', ')} for ${target.nameCommon}.`;

  return {
    countryId: target.id,
    countryIsoAlpha2: target.isoAlpha2,
    countryName: target.nameCommon,
    factType,
    prompt: promptMap[factType],
    options,
    correctAnswer: targetMeta.displayPrimary,
    acceptedAnswers: Array.from(new Set(targetMeta.accepted)),
    explanation,
    distractorSources: distractors.map((d) => d.tier)
  };
}

/**
 * Generates an ordered set of Geography questions for a subset/scope and fact type(s).
 * When `onePerCountry` is true, produces up to one verified question per country in `countries`
 * (cycling deterministically across `factTypes`) so the deck length matches the selected country count.
 */
export function generateGeographyQuizSet(params: {
  countries: readonly CountryEntity[];
  allCountries: readonly CountryEntity[];
  factTypes?: readonly GeographyFactType[];
  limit?: number;
  onePerCountry?: boolean;
  seed?: string | number;
  maps?: GeographyLookupMaps;
}): GeneratedGeographyQuestion[] {
  const {
    countries,
    allCountries,
    factTypes = ['capital', 'currency', 'language'],
    onePerCountry = false,
    limit = onePerCountry ? countries.length : countries.length * factTypes.length,
    seed = 'dmc-quiz-v1',
    maps = {}
  } = params;

  const shuffledCountries = deterministicShuffle(countries, `${seed}:countries`);
  const results: GeneratedGeographyQuestion[] = [];

  for (const country of shuffledCountries) {
    if (results.length >= limit) return results;
    const orderedFacts = onePerCountry
      ? deterministicShuffle(factTypes, `${seed}:${country.id}:facts`)
      : factTypes;

    for (const factType of orderedFacts) {
      if (results.length >= limit) return results;
      const q = generateGeographyQuestion(
        country,
        factType,
        allCountries,
        maps,
        `${seed}:${country.id}:${factType}`
      );
      if (q) {
        results.push(q);
        if (onePerCountry) break;
      }
    }
  }
  return results;
}

/**
 * Evaluates a candidate answer against all accepted answers case- and diacritic-insensitively.
 */
export function isAnswerCorrect(selected: string, acceptedAnswers: readonly string[]): boolean {
  const normSelected = normalizeAnswer(selected);
  if (!normSelected) return false;
  return acceptedAnswers.some((ans) => normalizeAnswer(ans) === normSelected);
}

