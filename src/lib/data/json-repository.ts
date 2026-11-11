import sourcesData from '@/data/sources.json';
import continentsData from '@/data/geography/continents.json';
import regionsData from '@/data/geography/regions.json';
import currenciesData from '@/data/geography/currencies.json';
import languagesData from '@/data/geography/languages.json';
import countriesData from '@/data/geography/countries.json';
import questionRulesData from '@/data/questions/geography/question-rules.json';
import examsData from '@/data/examinations/exams.json';
import ppscPostsData from '@/data/examinations/ppsc/recruitment-posts.json';
import ppscBlueprintsData from '@/data/examinations/ppsc/blueprints.json';
import subjectsData from '@/data/taxonomy/subjects.json';
import topicsData from '@/data/taxonomy/topics.json';
import ppscQuestionsData from '@/data/questions/ppsc/general-knowledge.json';
import pdfResourcesData from '@/data/resources/pdf-resources.json';

import type {
  Blueprint,
  CountryEntity,
  Exam,
  PdfResource,
  Question,
  RecruitmentPost,
  RecruitmentPostState,
  Source,
  Subject,
  Topic
} from '@/lib/schemas';
import { PortalSearchEngine, type SearchEntityType, type SearchHit } from '@/lib/search';
import {
  paginateItems,
  type ContentRepository,
  type CountryFilter,
  type PaginatedCountryFilter,
  type PaginatedQuestionFilter,
  type PaginatedResult,
  type PdfFilter,
  type QuestionFilter,
  type RelatedItem,
  type RepositoryDataSnapshot
} from './repository';

export function loadDefaultSnapshot(): RepositoryDataSnapshot {
  return {
    sources: sourcesData.sources as Source[],
    continents: continentsData.continents,
    regions: regionsData.regions,
    currencies: currenciesData.currencies,
    languages: languagesData.languages,
    countries: countriesData.countries as CountryEntity[],
    questionRules: questionRulesData as RepositoryDataSnapshot['questionRules'],
    exams: examsData.exams as Exam[],
    recruitmentPosts: ppscPostsData.posts as RecruitmentPost[],
    blueprints: ppscBlueprintsData.blueprints as Blueprint[],
    subjects: subjectsData.subjects,
    topics: topicsData.topics,
    questions: ppscQuestionsData.questions as Question[],
    pdfResources: pdfResourcesData.pdfResources as PdfResource[]
  };
}

/**
 * In-memory ContentRepository backed by version-controlled JSON snapshots.
 * Runs identically in Node build scripts, React Server Components, Browser Client Components, and Vitest.
 */
export class JsonContentRepository implements ContentRepository {
  private readonly data: RepositoryDataSnapshot;
  private searchEngine: PortalSearchEngine | null = null;

  constructor(data: RepositoryDataSnapshot = loadDefaultSnapshot()) {
    this.data = data;
  }

  getSnapshot(): RepositoryDataSnapshot {
    return this.data;
  }

  private getSearchEngine(): PortalSearchEngine {
    if (!this.searchEngine) {
      this.searchEngine = PortalSearchEngine.fromDataset({
        countries: this.data.countries,
        regions: this.data.regions,
        currencies: this.data.currencies,
        languages: this.data.languages,
        exams: this.data.exams,
        recruitmentPosts: this.data.recruitmentPosts,
        pdfResources: this.data.pdfResources,
        questions: this.data.questions
      });
    }
    return this.searchEngine;
  }

  async getExams(): Promise<Exam[]> {
    return [...this.data.exams];
  }

  async getExam(slug: string): Promise<Exam | null> {
    return this.data.exams.find((e) => e.slug === slug) ?? null;
  }

  async getSubjects(): Promise<Subject[]> {
    return [...this.data.subjects];
  }

  async getTopics(subjectId?: string): Promise<Topic[]> {
    if (!subjectId) return [...this.data.topics];
    return this.data.topics.filter((t) => t.subjectId === subjectId);
  }

  async getTopicBySlugs(
    subjectSlug: string,
    topicSlug: string
  ): Promise<{ subject: Subject; topic: Topic } | null> {
    const subject = this.data.subjects.find((s) => s.slug === subjectSlug);
    if (!subject) return null;
    const topic = this.data.topics.find((t) => t.subjectId === subject.id && t.slug === topicSlug);
    if (!topic) return null;
    return { subject, topic };
  }

  async getRecruitmentPosts(examSlug: string, status?: RecruitmentPostState): Promise<RecruitmentPost[]> {
    const exam = await this.getExam(examSlug);
    if (!exam) return [];
    return this.data.recruitmentPosts.filter(
      (post) => post.examId === exam.id && (!status || post.postStatus === status)
    );
  }

  async getRecruitmentPost(slug: string): Promise<RecruitmentPost | null> {
    return this.data.recruitmentPosts.find((p) => p.slug === slug) ?? null;
  }

  async getBlueprint(postSlug: string, version?: number): Promise<Blueprint | null> {
    const candidates = await this.getBlueprintVersions(postSlug);
    if (candidates.length === 0) return null;
    if (version !== undefined) {
      return candidates.find((b) => b.version === version) ?? null;
    }
    return candidates[0];
  }

  async getBlueprintVersions(postSlug: string): Promise<Blueprint[]> {
    const post = await this.getRecruitmentPost(postSlug);
    if (!post) return [];
    return this.data.blueprints
      .filter((b) => b.postId === post.id)
      .sort((a, b) => b.version - a.version);
  }

  async getCountries(filter: CountryFilter = {}): Promise<CountryEntity[]> {
    const { continentId, regionId, letter, search, onlyVerified, includeDrafts } = filter;
    const needle = search?.trim().toLowerCase();
    const letterUpper = letter?.trim().toUpperCase();

    return this.data.countries.filter((c) => {
      if (!includeDrafts && c.status !== 'published') return false;
      if (onlyVerified && c.verification.status !== 'verified') return false;
      if (continentId && c.continentId !== continentId) return false;
      if (regionId && c.regionId !== regionId) return false;
      if (letterUpper && letterUpper !== 'ALL' && !c.nameCommon.toUpperCase().startsWith(letterUpper)) {
        return false;
      }
      if (needle) {
        const hay = `${c.nameCommon} ${c.nameOfficial} ${c.capitals.join(' ')} ${c.isoAlpha2} ${c.isoAlpha3}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }

  async getCountry(slug: string): Promise<CountryEntity | null> {
    return this.data.countries.find((c) => c.slug === slug) ?? null;
  }

  async getCountriesPaginated(
    filter: PaginatedCountryFilter = {}
  ): Promise<PaginatedResult<CountryEntity>> {
    const { page, pageSize, sort = 'default', ...countryFilter } = filter;
    const filtered = await this.getCountries(countryFilter);
    const ordered =
      sort === 'alphabetical'
        ? [...filtered].sort((a, b) => a.nameCommon.localeCompare(b.nameCommon, 'en'))
        : filtered;
    return paginateItems(ordered, { page, pageSize }, 24);
  }

  async getGeographyReference() {
    return {
      continents: [...this.data.continents],
      regions: [...this.data.regions],
      currencies: [...this.data.currencies],
      languages: [...this.data.languages]
    };
  }

  async getQuestions(filter: QuestionFilter = {}): Promise<Question[]> {
    const { examId, subjectId, postId, topicIds, difficulty, onlyVerified, includeDrafts } = filter;
    const topicSet = topicIds && topicIds.length > 0 ? new Set(topicIds) : null;
    const subjectTopicSet = subjectId
      ? new Set(this.data.topics.filter((t) => t.subjectId === subjectId).map((t) => t.id))
      : null;
    const examPostSet = examId
      ? new Set(this.data.recruitmentPosts.filter((p) => p.examId === examId).map((p) => p.id))
      : null;

    return this.data.questions.filter((q) => {
      if (!includeDrafts && q.status !== 'published') return false;
      if (onlyVerified && q.verification.status !== 'verified') return false;
      if (postId && !q.postIds.includes(postId)) return false;
      if (examPostSet && !q.postIds.some((pid) => examPostSet.has(pid))) return false;
      if (difficulty && q.difficulty !== difficulty) return false;
      if (topicSet && !q.topicIds.some((tid) => topicSet.has(tid))) return false;
      if (subjectTopicSet && !q.topicIds.some((tid) => subjectTopicSet.has(tid))) return false;
      return true;
    });
  }

  async getQuestionsPaginated(
    filter: PaginatedQuestionFilter = {}
  ): Promise<PaginatedResult<Question>> {
    const { page, pageSize, ...questionFilter } = filter;
    const filtered = await this.getQuestions(questionFilter);
    return paginateItems(filtered, { page, pageSize }, 20);
  }

  async getPdfResources(filter: PdfFilter = {}): Promise<PdfResource[]> {
    const { examSlug, subjectId, postId, topicId, year, sort, includeDrafts } = filter;
    const subjectTopicSet = subjectId
      ? new Set(this.data.topics.filter((t) => t.subjectId === subjectId).map((t) => t.id))
      : null;
    const exam = examSlug ? this.data.exams.find((e) => e.slug === examSlug) : undefined;
    const examPostSet = examSlug
      ? new Set(
          this.data.recruitmentPosts
            .filter((p) => exam && p.examId === exam.id)
            .map((p) => p.id)
        )
      : null;

    const filtered = this.data.pdfResources.filter((pdf) => {
      if (!includeDrafts && pdf.status !== 'published') return false;
      if (postId && !pdf.postIds.includes(postId)) return false;
      if (examPostSet && !pdf.postIds.some((pid) => examPostSet.has(pid))) return false;
      if (topicId && !pdf.topicIds.includes(topicId)) return false;
      if (subjectTopicSet && !pdf.topicIds.some((tid) => subjectTopicSet.has(tid))) return false;
      if (year) {
        const pdfYear = (pdf.verification.verifiedAt ?? pdf.verification.lastCheckedAt ?? '').slice(0, 4);
        if (pdfYear !== year) return false;
      }
      return true;
    });

    if (sort === 'title') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sort === 'size') {
      return [...filtered].sort((a, b) => b.fileSizeBytes - a.fileSizeBytes);
    }
    if (sort === 'questions') {
      return [...filtered].sort((a, b) => (b.questionCount ?? 0) - (a.questionCount ?? 0));
    }
    if (sort === 'newest') {
      return [...filtered].sort((a, b) =>
        (b.verification.verifiedAt ?? b.verification.lastCheckedAt).localeCompare(
          a.verification.verifiedAt ?? a.verification.lastCheckedAt
        )
      );
    }
    return filtered;
  }

  async getPdfResource(slug: string): Promise<PdfResource | null> {
    return this.data.pdfResources.find((p) => p.slug === slug) ?? null;
  }

  async getRelated(entity: { type: string; id: string }): Promise<RelatedItem[]> {
    const related: RelatedItem[] = [];
    if (entity.type === 'post') {
      const post = this.data.recruitmentPosts.find((p) => p.id === entity.id || p.slug === entity.id);
      if (!post) return [];
      for (const pdfId of post.pdfResourceIds) {
        const pdf = this.data.pdfResources.find((x) => x.id === pdfId);
        if (pdf) {
          related.push({
            type: 'pdf',
            id: pdf.id,
            slug: pdf.slug,
            title: pdf.title,
            subtitle: `${pdf.gradeLabel} Booklet`
          });
        }
      }
      if (post.blueprintId) {
        const bp = this.data.blueprints.find((b) => b.id === post.blueprintId);
        if (bp) {
          related.push({
            type: 'blueprint',
            id: bp.id,
            title: bp.title,
            subtitle: `${bp.totalMarks} Marks - ${bp.durationMinutes} Mins`
          });
        }
      }
      for (const q of this.data.questions.filter((x) => x.postIds.includes(post.id))) {
        related.push({
          type: 'question',
          id: q.id,
          slug: q.slug,
          title: q.stem,
          subtitle: q.difficulty.toUpperCase()
        });
      }
    }
    return related;
  }

  async getSources(ids: string[]): Promise<Source[]> {
    const idSet = new Set(ids);
    return this.data.sources.filter((s) => idSet.has(s.id));
  }

  async search(query: string, types?: SearchEntityType[]): Promise<SearchHit[]> {
    return this.getSearchEngine().search(query, types);
  }
}

let singletonRepo: JsonContentRepository | null = null;

export function getContentRepository(): JsonContentRepository {
  if (!singletonRepo) {
    singletonRepo = new JsonContentRepository();
  }
  return singletonRepo;
}

