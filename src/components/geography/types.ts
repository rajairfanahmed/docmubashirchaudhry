import type { Continent, CountryEntity, Currency, Language, Region, Source } from '@/lib/schemas';

export interface GeographyFilterState {
  search: string;
  continentId: string;
  regionId: string;
  letter: string;
}

export interface GeographyWorkbenchProps {
  countries: CountryEntity[];
  continents: Continent[];
  regions: Region[];
  currencies: Currency[];
  languages: Language[];
  datasetVersion: string;
}

export interface CountryProfileProps {
  country: CountryEntity;
  continent?: Continent;
  region?: Region;
  currencies: Currency[];
  languages: Language[];
  sources: Source[];
}

