# Frontend Architecture Specification (Step 1 of 10)

> **Consumer Skill:** `01-frontend-architecture` (Foundation Phase - Run First)
> **Scope:** Project folder tree, Next.js App Router route structure, Server/Client rendering boundaries, CSS custom property & Tailwind v4 `@theme` architecture, `ContentRepository` & static `/data/v1/` integration, client `localStorage` state architecture, and code quality standards.
> **Boundary:** Do NOT hardcode visual values or build page layouts/components inside Step 1; establish the structural directories, empty layout/route shells, typed repository clients, and token variable keys for Steps 2-10.

---

## 1. Framework & Folder Architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (`strict: true`), Tailwind CSS v4 (`@import "tailwindcss";` + `@theme inline`), Zod v4 validation, MiniSearch client indexing, and Vitest test runner.
- **Directory Layout (`src/`):**
  ```
  src/
  ├── app/                              # App Router routes, metadata, sitemap, error boundaries
  │   ├── layout.tsx                    # Root shell, fonts, JSON-LD, standing notices wrapper
  │   ├── page.tsx                      # Homepage /
  │   ├── globals.css                   # @theme inline + CSS custom property token system
  │   ├── not-found.tsx                 # Friendly 404 recovery page
  │   ├── error.tsx                     # Root client error boundary ('use client')
  │   ├── sitemap.ts                    # Dynamic sitemap generation
  │   ├── exams/
  │   │   ├── page.tsx                  # /exams
  │   │   └── [slug]/page.tsx           # /exams/[slug]
  │   ├── ppsc/
  │   │   ├── page.tsx                  # /ppsc (PPSC recruitment posts + downloadable PDFs)
  │   │   └── [slug]/
  │   │       └── page.tsx              # /ppsc/[slug] (Strictly downloadable solved PDFs + post header + correction link)
  │   ├── css-pms/
  │   │   ├── page.tsx                  # /css-pms (Clean EmptyStateCard when 0 published items; no mock tracks)
  │   │   └── [track]/page.tsx          # /css-pms/[track] (Redirect/EmptyState until backed data exists)
  │   ├── fpsc/page.tsx                 # /fpsc (EmptyStateCard + official FPSC portal provenance until backed data exists)
  │   ├── nts/page.tsx                  # /nts (EmptyStateCard + official NTS portal provenance until backed data exists)
  │   ├── mcq/
  │   │   ├── page.tsx                  # /mcq (Exam/Subject/Topic launcher + paginated preview)
  │   │   └── practice/page.tsx         # /mcq/practice (mcqs-design.png single-question drill engine)
  │   ├── topics/
  │   │   └── [subject]/[topic]/page.tsx # /topics/[subject]/[topic] (Paginated questions + PDFs)
  │   ├── geography/
  │   │   ├── page.tsx                  # /geography (Tier 1 Paginated 24/page Reference + Tier 2 Quiz)
  │   │   ├── continent/[slug]/page.tsx # /geography/continent/[slug]
  │   │   └── [slug]/page.tsx           # /geography/[slug]
  │   ├── countries/page.tsx            # Permanent redirect -> /geography
  │   ├── library/
  │   │   ├── page.tsx                  # /library
  │   │   ├── [exam]/page.tsx           # /library/[exam]
  │   │   └── resource/[slug]/page.tsx  # /library/resource/[slug]
  │   ├── search/page.tsx               # /search
  │   ├── about/page.tsx                # /about
  │   ├── methodology/page.tsx          # /methodology
  │   ├── corrections/page.tsx          # /corrections
  │   ├── copyright/page.tsx            # /copyright
  │   ├── privacy/page.tsx              # /privacy
  │   ├── accessibility/page.tsx        # /accessibility
  │   └── status/page.tsx               # /status
  ├── components/
  │   ├── ui/                           # Primitive Material/Emerald buttons, badges, cards, pills, PaginationBar, modals, empty states
  │   ├── layout/                       # Header/Navbar, MobileDrawer, Breadcrumbs, StandingNotice, Footer, PreFooterCta
  │   ├── branding/                     # CommissionBrandBadge (Logo.dev + fallback), SubjectIconChip (subjects.json)
  │   ├── home/                         # HeroSearch, AuthorityExamTiles, LatestPdfs, GeographyTeaser, McqLauncherWidget
  │   ├── exams/                        # ExamHubCard, PostFilterBar (remove unused PostRecordCard/Blueprint mocks on /ppsc/[slug])
  │   ├── mcq/                          # McqSetupForm, McqPracticeRunner (mcqs-design.png layout), SingleQuestionCard, CircularProgressRing, McqSessionSummary
  │   ├── geography/                    # GeographyFilterBar, AlphabetRail, CountryCard (overflow-safe), GeographyWorkbench (24/page + Quiz), GeographyQuizCard, GeographyScoreModal
  │   ├── library/                      # PdfFilterToolbar, PdfResourceCard, PdfDetailPanel, StickyMobileDownloadBar
  │   ├── search/                       # SearchResultsGroup
  │   └── feedback/                     # AcademicFeedbackForm, CorrectionTrigger
  ├── lib/
  │   ├── data/                         # ContentRepository + JsonContentRepository + static-client fetch helpers
  │   ├── quiz/                         # Pure TypeScript seeded country quiz & MCQ session logic
  │   ├── search/                       # MiniSearch engine + query helpers
  │   ├── storage/                      # Versioned localStorage wrapper + in-memory fallback
  │   ├── feedback/                     # mailto: URI composer + formatting helpers
  │   ├── schemas/                      # Zod data schemas
  │   └── format/                       # Byte size formatter, date verification formatters
  └── data/                             # Authoritative source JSON compiled to public/data/v1/
  ```

---

## 2. Routing & Legacy Alias Strategy

1. **Canonical World Geography Route:** `/geography` owns the primary two-tier Reference + Quiz module.
   - `/countries` MUST immediately call Next.js `permanentRedirect('/geography')` (`next/navigation`) so bookmarks, old external links, and legacy bulletins land seamlessly without duplicate indexing.
   - Deep-link hash/query conventions preserved: `/geography?country=[slug]#quiz-module`, `/geography?continent=[slug]`, `/geography?letter=[A-Z]`.
2. **Exam Hub Consolidation vs. Dedicated Slugs:**
   - Dedicated routes (`/ppsc`, `/css-pms`, `/fpsc`, `/nts`) read their corresponding authority records (`exam-ppsc`, `exam-fpsc`, `css-pms`, `nts`) via `ContentRepository`.
   - `/exams` lists all registered authorities; `/exams/[slug]` serves any commission generically (`kppsc`, `spsc`, `bpsc`, etc.) or redirects/renders cleanly using shared exam hub templates.
3. **Dynamic Segment Params Rules (Next.js 16):**
   - `params` and `searchParams` in all Server Page and `generateMetadata` functions MUST be typed and awaited as `Promise<...>`.
   - Unknown slugs on `/exams/[slug]`, `/ppsc/[slug]`, `/css-pms/[track]`, `/geography/[slug]`, `/geography/continent/[slug]`, `/topics/[subject]/[topic]`, and `/library/resource/[slug]` call `notFound()`.
4. **Build Compatibility Rule:** Because static data builds into `public/data/v1/`, routes using query-driven interactions (`/mcq/practice`, `/geography`, `/library`, `/search`, `/ppsc`) render static outer HTML with Client Islands hydrated via initial server-passed JSON props or lazy `/data/v1/*.json` fetches, avoiding `force-dynamic` server database dependencies.

---

## 3. Design Token System Architecture

Step 1 establishes the CSS custom properties architecture in `src/app/globals.css` (`:root` + Tailwind v4 `@theme inline`) so Step 2 (`visual-design`) populates exact hex, typography, spacing, shadow, and radius tokens cleanly without ad-hoc inline magic numbers:

```css
/* Architectural token categories declared in src/app/globals.css */
@theme inline {
  --font-sans: var(--font-jakarta), var(--font-inter), system-ui, sans-serif;
  --color-brand-forest: var(--dmc-brand-forest);
  --color-brand-dark: var(--dmc-brand-dark);
  --color-brand-emerald: var(--dmc-brand-emerald);
  --color-brand-footer: var(--dmc-brand-footer);
  --color-accent-gold: var(--dmc-accent-gold);
  --color-highlight-bg: var(--dmc-highlight-bg);
  --color-highlight-ink: var(--dmc-highlight-ink);
  --color-surface-ground: var(--dmc-surface-ground);
  --color-surface-card: var(--dmc-surface-card);
  --color-ink-primary: var(--dmc-ink-primary);
  --color-ink-secondary: var(--dmc-ink-secondary);
  --color-border-subtle: var(--dmc-border-subtle);
  --shadow-material-1: var(--dmc-shadow-1);
  --shadow-material-2: var(--dmc-shadow-2);
  --radius-card: var(--dmc-radius-card);
  --radius-pill: var(--dmc-radius-pill);
}
```

- **Legacy Mock & Unprovided Feature Deletion List (Platform-Wide Mock Cleanup):**
  - Remove dead unimported mock files: `src/components/reference/*` (`CountryCard.tsx`, `Pagination.tsx`, `ReferenceSection.tsx`), legacy homepage files (`BulletinTicker.tsx`, `ExamHero.tsx`, `FilterHub.tsx`, `SubjectBadges.tsx`, `AuthoritySeals.tsx`), and `src/components/ppsc/{NotesReaderSection,PaperBlueprintSection,PdfDownloadCard}.tsx` (specifically removing `NotesReaderSection` + `EDITORIAL_STUDY_TOPICS` mock notes from `src/app/ppsc/[slug]/page.tsx`).
  - Remove unprovided/mock UI sections on `/ppsc/[slug]` (`PostRecordCard` `"Pending official verification"` placeholders, `OfficialBlueprintCard`, `EditorialStudyPlanCard`, and inline `"Start MCQ Practice"` CTA), keeping ONLY the downloadable solved PDF booklets (`PdfResourceCard`), concise post title/scale/department metadata, and correction trigger.
  - Remove hardcoded fake categories/portals/tracks across `src/app/exams/page.tsx` (`COMPLEMENTARY_PORTALS`), `src/app/fpsc/page.tsx` (`FPSC_TEST_CATEGORIES`), `src/app/nts/page.tsx` (`NTS_CATEGORIES`), `src/app/css-pms/page.tsx` (`CSS_PMS_TRACKS`), and `src/app/css-pms/[track]/page.tsx` (`TRACKS`), plus remove inflated `+` suffixes where exact verified counts exist (`src/app/about/page.tsx`, `src/app/library/[exam]/page.tsx` empty commission filters).
- **No Em-Dash Rule:** Enforce zero Unicode em dashes (`U+2014`) across UI copy strings, static JSON labels, and docs.

---

## 4. Server vs. Client Boundaries (`'use client'` Discipline)

| Layer | Boundary | Rationale |
|---|---|---|
| Root Layout, Breadcrumb containers, Page Metadata, JSON-LD | **Server Component** | Zero JS overhead; instant first paint; full SEO crawlability |
| Homepage Static Sections (Exam tiles, Latest PDFs, Geography Teaser, Notices) | **Server Component** | Reads directly from `JsonContentRepository` at build/render |
| `HeroSearch` / `NavbarSearch` / `/search` Results | **Client Component** | Lazy-loads `/data/v1/search-index/all.json` (~31 KB) on focus or query mount |
| MCQ Launcher (`/` teaser & `/mcq`) | **Client Component** | Receives preloaded serialized `{ exams, subjects, topics }` props; navigates to `/mcq/practice?exam=...&subject=...&topic=...` |
| `/mcq/practice` (`SingleQuestionRunner`) | **Client Component** | Reads serialized `Question[]` slice or `/data/v1/questions/ppsc-samples.json`, manages answer lock, explanation, retry missed, and `dmc:v1:mcq` persistence |
| `/geography` (`GeographyWorkbench`: Tier 1 + Tier 2) | **Client Component** | Needs synchronized state between Tier 1 A-Z/continent/region filters, `"Quiz this selection"`, Tier 2 active quiz stepper/score, ResultsModal, and `dmc:v1:geography-quiz` `localStorage` |
| `/ppsc` Filter Tabs & `/library` Facet/Sort Bar | **Client Component** | Instant client-side filtering over pre-loaded datasets with URL `?status=` / `?year=` / `?type=` sync |
| `AcademicFeedbackForm` / `MailtoCorrection` | **Client Component** | Composes validated `mailto:` links and clipboard fallback |

---

## 5. Client Data Fetching & Pagination Architecture (`src/lib/api.ts` & `src/lib/data/client-fetch.ts`)

1. **Same-Origin Data & API Policy:** All client fetches resolve strictly same-origin (`/api/countries`, `/api/questions`, `/data/v1/...`), compliant with `connect-src 'self'` CSP in `public/_headers`.
2. **Typed Fetcher & Pagination Wrappers:**
   - Use `fetchCountriesPage(filter)` in `src/lib/api.ts` (`GET /api/countries?page=1&pageSize=24&...` with automatic fallback to `/data/v1/geography/pages/page-{n}.json` and `JsonContentRepository.getCountriesPaginated()`).
   - Use `fetchQuestionsPage(filter)` in `src/lib/api.ts` (`GET /api/questions?page=1&pageSize=20&...` with automatic fallback to `/data/v1/questions/pages/page-{n}.json` and `JsonContentRepository.getQuestionsPaginated()`).
   - Use `fetchStaticData()` in `src/lib/data/client-fetch.ts` with in-memory request deduplication cache (`Map<string, Promise<unknown>>`) for static `/data/v1/*.json` slices (`search-index/all.json`, `manifest.json`).

---

## 6. Client State & `localStorage` Architecture (`src/lib/storage/persistence.ts`)

No global React Redux/Zustand store is required. State lives cleanly in:
1. **URL SearchParams:** Filter and pagination state on `/search?q=`, `/ppsc?status=`, `/mcq?exam=&subject=&topic=&page=`, `/mcq/practice?exam=&subject=&topic=`, `/geography?continent=&region=&letter=&search=&page=&country=`, `/library?exam=&subject=&topic=&year=&type=&sort=`. Enables bookmarking, back-button safety, and sharing. Changing any filter on `/geography` or `/mcq` MUST reset `page` to `1`.
2. **Versioned `localStorage` Envelopes:**
   - Key `dmc:v1:geography-quiz`: `{ version: 1, datasetVersion, updatedAt, payload: { score, attemptedCount, answeredIds, filterSnapshot, streak, currentQuestionIndex } }`.
   - Key `dmc:v1:mcq`: `{ version: 1, datasetVersion, updatedAt, payload: { deckIds, currentIndex, answers, isRetryMode, showSummary } }` (supports jumping freely via desktop `[Prev] [1..N] [Next]` / mobile `[Prev] [Next]` and persists individual locked option answers without any timer or Submit step).
   - **Invariant:** If `datasetVersion` mismatches `manifest.datasetVersion` or JSON parses fail, clear stale state safely and initialize fresh without throwing. Provide `"Clear my progress"` callbacks mapped explicitly to `storage.clear()`.

---

## 7. Backend Integration Points (All Active Contracts)

Reads directly from [`docs/backend/api-contract.md`](./backend/api-contract.md), [`src/lib/data/repository.ts`](../src/lib/data/repository.ts), and [`src/lib/branding/logos.ts`](../src/lib/branding/logos.ts):

- **Server-Side (`JsonContentRepository`):**
  - `getExams()`, `getExam(slug)`, `getRecruitmentPosts(examSlug, status?)`, `getRecruitmentPost(slug)`, `getSubjects()`, `getTopics()`
  - `getCountries(filter?)`, `getCountriesPaginated(filter?)` (`250` items), `getCountry(slug)`, `getGeographyReference()`
  - `getQuestions(filter)`, `getQuestionsPaginated(filter?)`
  - `getPdfResources(filter?)`, `getPdfResource(slug)`
  - `getRelated({ type, id })`, `getSources(ids)`, `search(query, types?)`
- **Client APIs & Static Endpoints:**
  - `GET /api/countries` + `/data/v1/geography/pages/page-{n}.json` (`24/page`, `11` pages) -> `/geography` Tier 1 pagination (`fetchCountriesPage`)
  - `GET /api/questions` + `/data/v1/questions/pages/page-{n}.json` (`20/page`) -> `/mcq` / `/topics` pagination (`fetchQuestionsPage`)
  - `GET /data/v1/examinations/branding.json` & `/data/v1/taxonomy/subjects.json` -> `Logo.dev` commission emblems + semantic subject icons
  - `GET /data/v1/manifest.json` -> `/status` & dataset version check
  - `GET /data/v1/geography/countries-quiz-v1.json` & `/data/v1/geography/reference.json` -> `/geography` Tier 2 quiz generation across full active filter slice
  - `GET /data/v1/search-index/all.json` -> MiniSearch hydration in Navbar/Hero/`/search`
  - `GET /data/v1/resources/pdfs.json` -> `/ppsc/[slug]`, `/library`
- **Search Index Parity Backlog:** Extend `SearchEntityType` with `'topic'` and point all country search hit URLs to `/geography/${slug}`.

---

## 8. Code Quality & Tooling Standards

- Zero runtime calls to deprecated third-party country APIs (`restcountries.com`). Sync happens offline/build-time via `npm run data:sync-countries`. Allowed external image origins in `_headers` (`img-src`) are `https://flagcdn.com`, `https://upload.wikimedia.org`, and `https://img.logo.dev`.
- Extract shared utilities cleanly (`formatBytes`, `formatVerificationDate`, `normalizeAnswer`, `filterPdfResources`) inside `src/lib/` rather than duplicating helper logic inside page components.
- Every Quiz/Repository state transition MUST retain Vitest unit test coverage in `npm test`, clean `npm run typecheck`, and clean Next.js production builds (`validate` + `data:build` + `next build`).
