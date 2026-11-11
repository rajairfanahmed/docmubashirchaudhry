# Backend Data Contract (`ContentRepository` & Static `/data/v1/` Endpoints)

> Status: Implemented  
> Base URL: Static same-origin `/data/v1/` (no secrets or dynamic backend server)  
> Last updated: 2026-11-11

## 1. Conventions
- **Authentication:** None required (100% open educational resource, zero login walls).
- **Content type:** `application/json; charset=utf-8` for `/data/v1/*.json`; `application/pdf` for `/documents/**/*.pdf`.
- **Versioning:** Immutable versioned prefix `/data/v1/` anchored by `/data/v1/manifest.json` (`datasetVersion` & SHA-256 manifest).
- **Cache semantics:** Student client `localStorage` keys store `datasetVersion`; when `manifest.json` bumps versions, outdated client state clears cleanly without crashing.

## 2. Static artifact, API route & repository catalog
| Static artifact, API route & repository catalog | Path / Signature | Purpose | Access | Status |
|---|---|---|---|---|
| Health & Manifest Check | `GET /api/health` | Serverless readiness check returning live `datasetVersion`, `siteUrl`, and published collection counts (`Cache-Control: no-store`) | Public | Implemented |
| Dataset Manifest | `GET /data/v1/manifest.json` | Version, timestamps, record counts, SHA-256 integrity map | Public | Implemented |
| Geography Reference | `GET /data/v1/geography/reference.json` | Continents (`6`), regions (`25`), currencies (`160`), languages (`154`) metadata | Public | Implemented |
| Countries Collection | `GET /data/v1/geography/countries.json` | Full published dataset of 250 countries and territories | Public | Implemented |
| Paginated Countries API | `GET /api/countries?page=1&pageSize=24&continentId=&regionId=&letter=&search=&onlyVerified=&sort=` | Zod-validated paginated countries slice (`PaginatedResult<CountryEntity>`, `pageSize` 1..100, `400` on invalid bounds) | Public | Implemented |
| Country Static Pages | `GET /data/v1/geography/pages/index.json` & `/data/v1/geography/pages/page-{n}.json` | Pre-sliced static country pages (`24` per page, `11` pages) | Public | Implemented |
| Quiz Ready Slice | `GET /data/v1/geography/countries-quiz-v1.json` | Compact country payload for Geography Reference & Quiz | Public | Implemented |
| Examinations Index | `GET /data/v1/examinations/exams.json` | Commission/exam bodies (`PPSC`, `FPSC`) with Logo.dev metadata | Public | Implemented |
| Commission Branding Catalog | `GET /data/v1/examinations/branding.json` | All 7 commissions (`PPSC`, `FPSC`, `CSS / PMS`, `NTS`, `SPSC`, `KPPSC`, `BPSC`) with Logo.dev CDN URLs & fallback monograms | Public | Implemented |
| Taxonomy Catalogs | `GET /data/v1/taxonomy/subjects.json` & `/data/v1/taxonomy/topics.json` | Canonical 9 subjects with `iconName`, `badgeLabel`, optional `iconUrl`, plus topics | Public | Implemented |
| Paginated MCQs API | `GET /api/questions?page=1&pageSize=20&examId=&subjectId=&postId=&topicIds=&difficulty=&onlyVerified=` | Zod-validated paginated MCQ bank slice (`PaginatedResult<Question>`, `pageSize` 1..100, `400` on invalid bounds) | Public | Implemented |
| Question Static Pages | `GET /data/v1/questions/pages/index.json` & `/data/v1/questions/pages/page-{n}.json` | Pre-sliced static MCQ pages (`20` per page) | Public | Implemented |
| Recruitment Posts | `GET /data/v1/examinations/posts-ppsc.json` | Data-driven PPSC posts (`basicScale`, `advertisementNo`, status) | Public | Implemented |
| Syllabus Blueprints | `GET /data/v1/examinations/blueprints-ppsc.json` | Official pattern vs labeled editorial estimates | Public | Implemented |
| PDF Catalog | `GET /data/v1/resources/pdfs.json` | Non-duplicated verified PDF booklets with SHA-256, bytes, and rights | Public | Implemented |
| Search Index | `GET /data/v1/search-index/all.json` | Pre-built MiniSearch serialized index | Public | Implemented |

## 3. TypeScript `ContentRepository` Interface (PRD Section 7.2)
Implemented by `JsonContentRepository` in `src/lib/data/`:
```ts
export interface ContentRepository {
  getExams(): Promise<Exam[]>;
  getExam(slug: string): Promise<Exam | null>;
  getRecruitmentPosts(examSlug: string, status?: 'open' | 'closed' | 'upcoming'): Promise<RecruitmentPost[]>;
  getRecruitmentPost(slug: string): Promise<RecruitmentPost | null>;
  getBlueprint(postSlug: string, version?: number): Promise<Blueprint | null>;
  getCountries(filter?: CountryFilter): Promise<Country[]>;
  getCountriesPaginated(filter?: PaginatedCountryFilter): Promise<PaginatedResult<Country>>;
  getCountry(slug: string): Promise<Country | null>;
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
  search(query: string, types?: string[]): Promise<SearchHit[]>;
}
```

## 4. Client Quiz, Storage & Feedback Contracts
- **Geography Quiz Generator (`src/lib/quiz/`):**
  - Input: `Country[]`, scope/region/difficulty filter, `seed`, requested count, fact types (`capital`, `currency`, `language`).
  - Eligibility gate: Only countries where `verification.status === 'verified'`, affected `disputed` flag is `false`, primary fact is non-empty, and >= 3 valid distinct distractors exist.
  - Accepted answers: Matches any value in `capitals[]`, `currencyIds[]`, or `officialLanguageIds[]` normalized with `.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()`.
- **Local Persistence (`src/lib/storage/`):**
  - Keys: `dmc:v1:geography-quiz` and `dmc:v1:mcq`.
  - Envelope: `{ version: 1, datasetVersion: string, updatedAt: string, payload: ... }`.
  - Fallback: Silent in-memory `Map` fallback if `window.localStorage` is unavailable or full.
- **Academic Feedback / Errata (`AcademicFeedbackForm.tsx`):**
  - Composes a `mailto:faculty@docmubashirchaudhary.com` URI with structured subject/body plus copy-to-clipboard preview. Zero fake server POST state.

## 5. HTTP Pagination & Branding Contracts (Added Sprint 2 Backend Upgrade)
- **`GET /api/health` (`src/app/api/health/route.ts`):**
  - Dynamic (`force-dynamic`) Vercel readiness check returning `200` JSON with `{ status: 'ok', service, siteUrl, datasetVersion, generatedAt, counts, runtime }` and `Cache-Control: no-store`.
- **`GET /api/countries` (`src/app/api/countries/route.ts`):**
  - Query parameters (Zod-validated): `page` (int >= 1, default `1`), `pageSize` (int `1..100`, default `24`), `continentId`, `regionId`, `letter` (single letter `A-Z` or `all`), `search`, `onlyVerified` (`true|false`), `sort` (`default|alphabetical`).
  - Returns `200` `PaginatedResult<CountryEntity>` (`{ items, pagination: { page, pageSize, totalItems, totalPages, hasNextPage, hasPreviousPage } }`), or `400` `{ error, issues[] }` on invalid parameters.
  - Client wrapper: `fetchCountriesPage()` in `src/lib/api.ts` falls back to `/data/v1/geography/pages/page-{page}.json` and `getContentRepository().getCountriesPaginated()`.
- **`GET /api/questions` (`src/app/api/questions/route.ts`):**
  - Query parameters (Zod-validated): `page` (int >= 1, default `1`), `pageSize` (int `1..100`, default `20`), `examId`, `subjectId`, `postId`, `topicIds` (comma-separated or `topicId`), `difficulty` (`easy|medium|hard`), `onlyVerified` (`true|false`).
  - Returns `200` `PaginatedResult<Question>`, or `400` on invalid bounds/difficulty.
  - Client wrapper: `fetchQuestionsPage()` in `src/lib/api.ts` falls back to `/data/v1/questions/pages/page-{page}.json` and `getContentRepository().getQuestionsPaginated()`.
- **Branding & Subject Icons (`src/lib/branding/logos.ts` + `/data/v1/examinations/branding.json` + `/data/v1/taxonomy/subjects.json`):**
  - Exam commissions carry `logoDomain`, `logoUrl` (`https://img.logo.dev/{domain}?token=pk_e4a3hiZuS9GaAmHepVmkcw&size=128&format=png&fallback=404` when verified live, `null` for KPPSC/BPSC), and `fallbackMonogram`.
  - Subjects carry `iconName` (Lucide icon key), `badgeLabel`, and optional `iconUrl` (`https://flagcdn.com/pk.svg` on `sub-pak-studies`).
