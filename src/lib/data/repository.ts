import type {
  Blueprint,
  Continent,
  CountryEntity,
  CountryQuizRule,
  Currency,
  Exam,
  Language,
  PdfResource,
  Question,
  RecruitmentPost,
  RecruitmentPostState,
  Region,
  Source,
  Subject,
  Topic
} from '@/lib/schemas';
import type { SearchEntityType, SearchHit } from '@/lib/search';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function paginateItems<T>(
  items: T[],
  params: PaginationParams = {},
  defaultPageSize = 24
): PaginatedResult<T> {
  const requestedPage =
    typeof params.page === 'number' && Number.isFinite(params.page)
      ? Math.max(1, Math.trunc(params.page))
      : 1;
  const requestedPageSize =
    typeof params.pageSize === 'number' && Number.isFinite(params.pageSize)
      ? Math.trunc(params.pageSize)
      : defaultPageSize;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));

  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const start = (requestedPage - 1) * pageSize;
  const pageItems = start >= totalItems ? [] : items.slice(start, start + pageSize);

  return {
    items: pageItems,
    pagination: {
      page: requestedPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: totalPages > 0 && requestedPage < totalPages,
      hasPreviousPage: totalPages > 0 && requestedPage > 1
    }
  };
}

export interface CountryFilter {
  continentId?: string;
  regionId?: string;
  letter?: string;
  search?: string;
  onlyVerified?: boolean;
  includeDrafts?: boolean;
}

export interface PaginatedCountryFilter extends CountryFilter, PaginationParams {
  sort?: 'default' | 'alphabetical';
}

export interface QuestionFilter {
  examId?: string;
  subjectId?: string;
  postId?: string;
  topicIds?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  onlyVerified?: boolean;
  includeDrafts?: boolean;
}

export interface PaginatedQuestionFilter extends QuestionFilter, PaginationParams {}

export interface PdfFilter {
  examSlug?: string;
  subjectId?: string;
  postId?: string;
  topicId?: string;
  year?: string;
  sort?: 'newest' | 'title' | 'size' | 'questions';
  includeDrafts?: boolean;
}

export interface RelatedItem {
  type: 'exam' | 'post' | 'blueprint' | 'pdf' | 'question' | 'topic';
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
}

/**
 * Abstract ContentRepository contract specified in PRD Section 7.2.
 * Decouples UI/domain services from JSON files, future static endpoints, or CMS adapters.
 */
export interface ContentRepository {
  getExams(): Promise<Exam[]>;
  getExam(slug: string): Promise<Exam | null>;
  getSubjects(): Promise<Subject[]>;
  getTopics(subjectId?: string): Promise<Topic[]>;
  getTopicBySlugs(subjectSlug: string, topicSlug: string): Promise<{ subject: Subject; topic: Topic } | null>;
  getRecruitmentPosts(examSlug: string, status?: RecruitmentPostState): Promise<RecruitmentPost[]>;
  getRecruitmentPost(slug: string): Promise<RecruitmentPost | null>;
  getBlueprint(postSlug: string, version?: number): Promise<Blueprint | null>;
  getBlueprintVersions(postSlug: string): Promise<Blueprint[]>;
  getCountries(filter?: CountryFilter): Promise<CountryEntity[]>;
  getCountriesPaginated(filter?: PaginatedCountryFilter): Promise<PaginatedResult<CountryEntity>>;
  getCountry(slug: string): Promise<CountryEntity | null>;
  getGeographyReference(): Promise<{
    continents: Continent[];
    regions: Region[];
    currencies: Currency[];
    languages: Language[];
  }>;
  getQuestions(filter: QuestionFilter): Promise<Question[]>;
  getQuestionsPaginated(filter?: PaginatedQuestionFilter): Promise<PaginatedResult<Question>>;
  getPdfResources(filter?: PdfFilter): Promise<PdfResource[]>;
  getPdfResource(slug: string): Promise<PdfResource | null>;
  getRelated(entity: { type: string; id: string }): Promise<RelatedItem[]>;
  getSources(ids: string[]): Promise<Source[]>;
  search(query: string, types?: SearchEntityType[]): Promise<SearchHit[]>;
}

export interface RepositoryDataSnapshot {
  sources: Source[];
  continents: Continent[];
  regions: Region[];
  currencies: Currency[];
  languages: Language[];
  countries: CountryEntity[];
  questionRules: CountryQuizRule;
  exams: Exam[];
  recruitmentPosts: RecruitmentPost[];
  blueprints: Blueprint[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  pdfResources: PdfResource[];
}

