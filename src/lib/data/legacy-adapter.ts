import type { Continent, CountryEntity, Currency, Language } from '@/lib/schemas';
import type { Country } from '@/types/country';

/**
 * Converts canonical CountryEntity + lookup dictionaries into the flat Country view model
 * expected by existing Geography Reference cards and scoped quiz hooks.
 */
export function toLegacyCountry(
  entity: CountryEntity,
  maps: {
    continentsById: Map<string, Continent>;
    currenciesById: Map<string, Currency>;
    languagesById: Map<string, Language>;
  }
): Country {
  const continentName = maps.continentsById.get(entity.continentId)?.name ?? 'Global';

  const currenciesRecord: Record<string, { name: string; symbol?: string }> = {};
  let primaryCurrencyText = 'N/A';

  entity.currencyIds.forEach((cid, idx) => {
    const cur = maps.currenciesById.get(cid);
    const code = cur?.code ?? cid.toUpperCase();
    const name = cur?.name ?? cid.toUpperCase();
    currenciesRecord[code] = { name, symbol: cur?.symbol };
    if (idx === 0) {
      primaryCurrencyText = `${name} (${code})`;
    }
  });

  const allLanguages = entity.officialLanguageIds.map(
    (lid) => maps.languagesById.get(lid)?.name ?? lid
  );

  return {
    code: entity.isoAlpha2,
    name: entity.nameCommon,
    officialName: entity.nameOfficial,
    capital: entity.capitals[0] ?? 'N/A',
    allCapitals: entity.capitals,
    currency: primaryCurrencyText,
    currencies: currenciesRecord,
    language: allLanguages[0] ?? 'N/A',
    allLanguages,
    region: continentName,
    subregion: entity.subregion ?? '',
    flagSvg: entity.flag.svgPath,
    flagEmoji: entity.flag.emoji
  };
}

