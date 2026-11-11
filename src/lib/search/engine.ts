import MiniSearch, { type Options as MiniSearchOptions } from 'minisearch';
import type {
  CountryEntity,
  Currency,
  Exam,
  Language,
  PdfResource,
  Question,
  RecruitmentPost,
  Region
} from '@/lib/schemas';

export type SearchEntityType = 'country' | 'exam' | 'post' | 'pdf' | 'question';

export interface SearchDocument {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  keywords: string;
  url: string;
  badge?: string;
}

export interface SearchHit {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
  score: number;
}

export const MINISEARCH_CONFIG: MiniSearchOptions<SearchDocument> = {
  fields: ['title', 'subtitle', 'keywords'],
  storeFields: ['type', 'title', 'subtitle', 'url', 'badge'],
  searchOptions: {
    boost: { title: 2.5, keywords: 1.5, subtitle: 1 },
    fuzzy: 0.2,
    prefix: true
  }
};

export interface SearchableDatasetSlice {
  countries: CountryEntity[];
  regions: Region[];
  currencies: Currency[];
  languages: Language[];
  exams: Exam[];
  recruitmentPosts: RecruitmentPost[];
  pdfResources: PdfResource[];
  questions: Question[];
}

export function buildSearchDocuments(data: SearchableDatasetSlice): SearchDocument[] {
  const regionMap = new Map(data.regions.map((r) => [r.id, r]));
  const currencyMap = new Map(data.currencies.map((c) => [c.id, c]));
  const languageMap = new Map(data.languages.map((l) => [l.id, l]));

  const docs: SearchDocument[] = [];

  for (const c of data.countries) {
    if (c.status !== 'published') continue;
    const regionName = regionMap.get(c.regionId)?.name ?? c.subregion ?? '';
    const currencyNames = c.currencyIds
      .map((id) => {
        const cur = currencyMap.get(id);
        return cur ? `${cur.name} ${cur.code}` : id;
      })
      .join(' ');
    const languageNames = c.officialLanguageIds
      .map((id) => {
        const lang = languageMap.get(id);
        return lang ? `${lang.name} ${lang.nativeName ?? ''}` : id;
      })
      .join(' ');

    docs.push({
      id: `country:${c.id}`,
      type: 'country',
      title: c.nameCommon,
      subtitle:
        c.capitals.length > 0
          ? `Capital: ${c.capitals.join(', ')}${regionName ? ` - ${regionName}` : ''}`
          : regionName,
      keywords: [c.nameOfficial, c.isoAlpha2, c.isoAlpha3, ...c.capitals, currencyNames, languageNames, ...c.tags].join(
        ' '
      ),
      url: `/geography/${c.slug}`,
      badge: c.isoAlpha2
    });
  }

  for (const exam of data.exams) {
    if (exam.status !== 'published') continue;
    docs.push({
      id: `exam:${exam.id}`,
      type: 'exam',
      title: exam.title,
      subtitle: `${exam.jurisdiction} (${exam.bodyCode})`,
      keywords: `${exam.fullName} ${exam.bodyCode} ${exam.summary}`,
      url: `/${exam.slug}`,
      badge: exam.bodyCode
    });
  }

  for (const post of data.recruitmentPosts) {
    // Include published and explicitly labeled draft recruitment tracks if linked to verified materials
    docs.push({
      id: `post:${post.id}`,
      type: 'post',
      title: post.title,
      subtitle: `${post.department} (${post.basicScale})`,
      keywords: `${post.advertisementNo ?? ''} ${post.syllabusSummary}`,
      url: `/ppsc/${post.slug}`,
      badge: post.basicScale
    });
  }

  for (const pdf of data.pdfResources) {
    if (pdf.status !== 'published') continue;
    docs.push({
      id: `pdf:${pdf.id}`,
      type: 'pdf',
      title: pdf.title,
      subtitle: `${pdf.gradeLabel} - ${pdf.author}`,
      keywords: `${pdf.edition} ${pdf.summary} ${pdf.highlights.join(' ')}`,
      url: pdf.filePath,
      badge: 'PDF'
    });
  }

  for (const q of data.questions) {
    if (q.status !== 'published') continue;
    docs.push({
      id: `question:${q.id}`,
      type: 'question',
      title: q.stem,
      subtitle: q.explanation,
      keywords: q.options.map((o) => o.text).join(' '),
      url: '/mcq/practice',
      badge: q.difficulty.toUpperCase()
    });
  }

  return docs;
}

export class PortalSearchEngine {
  private readonly miniSearch: MiniSearch<SearchDocument>;

  private constructor(miniSearch: MiniSearch<SearchDocument>) {
    this.miniSearch = miniSearch;
  }

  static fromDataset(data: SearchableDatasetSlice): PortalSearchEngine {
    const ms = new MiniSearch<SearchDocument>(MINISEARCH_CONFIG);
    ms.addAll(buildSearchDocuments(data));
    return new PortalSearchEngine(ms);
  }

  static fromSerializedJson(jsonStr: string): PortalSearchEngine {
    const ms = MiniSearch.loadJSON<SearchDocument>(jsonStr, MINISEARCH_CONFIG);
    return new PortalSearchEngine(ms);
  }

  toJSON(): string {
    return JSON.stringify(this.miniSearch.toJSON());
  }

  search(
    query: string,
    types?: readonly SearchEntityType[],
    limit = 20
  ): SearchHit[] {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const typeFilter = types && types.length > 0 ? new Set(types) : null;
    const rawResults = this.miniSearch.search(trimmed, {
      filter: typeFilter
        ? (result) => typeFilter.has(result.type as SearchEntityType)
        : undefined
    });

    return rawResults.slice(0, limit).map((hit) => ({
      id: String(hit.id),
      type: hit.type as SearchEntityType,
      title: String(hit.title),
      subtitle: String(hit.subtitle ?? ''),
      url: String(hit.url ?? '/'),
      badge: hit.badge ? String(hit.badge) : undefined,
      score: hit.score
    }));
  }
}

