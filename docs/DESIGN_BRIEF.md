# Design Brief - docmubashirchaudhry Open-Access Exam & Geography Portal

> **Role of this document:** Entry point for all 10 specialist implementation skills (`01-frontend-architecture` through `10-performance-optimization`). Understand the project scope, constraints, aesthetic direction, backend contracts, major resolved conflicts, and exact paths to every specification from here.
> **Implementation Boundary:** Design specification only. Frontend code changes must be executed in sequential order (`01` -> `10`) after reviewing the linked specs.
> **Editorial Formatting Rule:** Zero em dashes anywhere in UI copy or documentation; use colons, hyphens, commas, or parentheses.

---

## 1. Project Overview & Objectives

`docmubashirchaudhry` is an open-access Pakistani civil service and one-paper competitive examination preparation platform paired with an interactive World Geography reference and quiz engine and a verified PDF booklet library.

### Primary Objectives
1. **Zero-Friction Practice:** Deliver immediate, ad-free, login-free access to exam hubs, solved past-paper PDFs, World Geography drills, and single-question MCQ practice.
2. **Epistemic Integrity (Official vs. Editorial Separation):** Never present coaching estimates as commission mandates. Separate verified official commission facts, unverified notices, disputed geographic fields, and editorial study weights with visible provenance and dates.
3. **Resilient Static Architecture:** Operate completely serverless against pre-built versioned JSON slices under `/data/v1/`, MiniSearch client-side search, `localStorage` session persistence, and `mailto:` candidate correction workflows.

---

## 2. Product Category & Intended Audience

- **Product Category:** Open-Access Educational & Competitive Exam Preparation Platform (Reference + Interactive Quiz + PDF Repository).
- **Intended Audience:** Pakistani competitive examination candidates (PPSC, FPSC, CSS, PMS, NTS, KPPSC, SPSC, BPSC) preparing across desktop and budget Android mobile devices, often on metered or intermittent connections.
- **Usage Modes:** Quick fact lookup (capitals, currencies, languages, PPSC post scales), focused 10-question or subset quiz drills, single-question subject/topic MCQ study, and direct PDF downloading for offline reading.

---

## 3. User Needs & Functional Requirements

Every route and feature explicitly specified in the Frontend Description must be supported:

1. **Global Shell (Every Page):**
   - Header: Site Logo (`docmubashirchaudhry`), `Exams`, `Geography`, `MCQs`, `Library`, and `Search` (collapses into an accessible mobile drawer below `md`). No login or account dropdown.
   - Footer: Links to `About`, `Methodology`, `Corrections`, `Copyright`, `Privacy`, `Accessibility`, and `Status`.
   - Standing Notices: Clearly visible statement that the portal is **independent and not affiliated with any commission or government body**, and is **100% free, with no ads and no login**.
   - Breadcrumbs: Rendered consistently on every nested page below root routes.
2. **Homepage (`/`):**
   - Hero section featuring a large integrated Search Box and a one-line explanation of what the portal offers.
   - Five exam tiles: `PPSC`, `CSS/PMS`, `FPSC`, `NTS`, plus a direct shortcut tile for `PPSC Intelligence Officer`.
   - `Latest PDFs` grid showing the newest booklets with file size, year (derived/schema fallback when omitted), and direct Download button.
   - World Geography teaser displaying one sample country card (with golden answer pills) and a `Start` CTA to `/geography`.
   - MCQ practice entry widget allowing exam and subject selection into `/mcq` / `/mcq/practice`.
   - `"Free, no ads, no signup"` value strip and standing non-affiliation notice.
3. **Examinations Hubs & Recruitment Posts:**
   - `/exams`: Overview cards for all exam authorities.
   - `/exams/[slug]`: Overview, official commission link with last-verified date, tracks, MCQs, and linked PDFs.
   - `/ppsc`: Recruitment post list with interactive `Open` / `Closed` status filter (plus `Upcoming`/`Archived` visibility where data exists).
   - `/ppsc/[slug]` (e.g., `intelligent-officer`): Strictly limited to features currently provided, namely **downloadable SHA-256 verified solved MCQ PDF booklets** (`PdfResourceCard` grid/detail links and direct `Download` buttons bound to `getPdfResources({ postId })`), alongside post header metadata (`title`, `basicScale`), a concise source/verification notice, and a `"Report a correction"` `mailto:` link. Do NOT render mock/unprovided blueprint breakdowns, coaching study plans, inline study-notes tabs, or synthetic widgets on post detail pages.
   - `/css-pms`, `/css-pms/[track]`, `/fpsc`, `/nts`: Dedicated authority routes display **only real backend-backed records** when populated; while empty (`0` PDFs, `0` MCQs, `0` posts), render a clean, honest `EmptyStateCard` (`noindex`) cross-linking to active `PPSC` PDFs and `/geography` with ZERO hardcoded mock category/track arrays.
4. **MCQ Practice System:**
   - `/mcq`: Launchpad filtering by Exam, Subject, and Topic (displaying accurate live counts, subject icons from `subjects.json`, and paginated question discovery via `GET /api/questions` / `/data/v1/questions/pages/`, default `20/page`) with a `Start` action.
   - `/mcq/practice`: Single-question interactive quiz adopting the **exact layout of `public/images/mcqs-design.png` (strictly for the MCQs quiz only, explicitly omitting the reference image's `"Time remaining"` timer and `"Submit"` button)**. Soft-mint rounded outer sheet with faint curved arc decoration enclosing a crisp white card: Desktop pairs `"Question X of Y"`, bold stem, 2x2 options grid (`A.`-`D.`), right-side circular `X/N` progress ring, and bottom `[Prev] [1]..[N] [Next]` question jumper bar; Mobile centers the circular progress ring above stem + 1-column `A.`-`D.` options + bottom 2-button `[Prev] [Next]` footer. Selecting an option locks it immediately, shows check/cross status + golden pill reveal (`#FEF08A` / `#78350F`) + `ExplanationBox`, and concludes in `McqSessionSummary` with `"Retry Missed"`.
   - `/topics/[subject]/[topic]`: Topic landing page displaying accurate live question count, paginated sample questions when `> 0`, related downloadable PDFs, and `"Start Practice"` only when real questions exist (`0` questions displays honest `"MCQs not yet added"` + related PDFs).
5. **World Geography (`/geography` One Page, Two Tiers + Drill-Downs):**
   - **Tier 1 (Reference Guide):** Serves all **250** countries/territories with interactive A-Z letter bar, Continent and Region dropdowns, instant keyword search, `"Clear filters"`, live count, `"Quiz this selection"`, and accessible **Pagination (`24` cards/page via `GET /api/countries` & `/data/v1/geography/pages/`)** synced with `?page=`. Each `CountryCard` renders flag, name, golden answer pills (`#FEF08A` background, `#78350F` text) for Capital, Currency, and Official Language **capped cleanly (`<=2` currencies, `<=3` languages + `+N more` link to `/geography/[slug]`) inside `flex-wrap` rows** so multi-value nations (e.g., Zimbabwe's 9 currencies and 16 official languages) never overflow or distort card bounds, plus `"Test in Quiz"`.
   - **Tier 2 (Interactive Quiz Module below Guide):** Retains the emerald divider + `SubQuestionStepper` + `0b875c04.jpg` 2x2 quiz card design (untouched by `mcqs-design.png`), drawing `"Quiz this selection"` from the full active filter slice across all pages. Ends with `ScoreModal` (`>= 70%` celebration confetti or static reduced-motion badge) and `"Clear my progress"`.
   - `/geography/continent/[slug]`: Continent landing page listing regions and constituent countries.
   - `/geography/[slug]`: Full country profile with name, flag, ISO codes (`alpha-2`, `alpha-3`, `numeric`), all capitals, currencies, languages, continent/region, cited sources, last-verified date, `"Report a correction"` `mailto:` link, and `"Test in Quiz"` deep link back to `/geography`.
   - Legacy route `/countries`: Redirected permanently or aliased cleanly to `/geography`.
6. **PDF Library:**
   - `/library`: Instant search, filters (`exam`, `subject`, `topic`, `year`, `type`), and sort controls (`newest`, `title`, `size`, `questions`). Cards render title, subject, year, page count, formatted file size, verification badge, and Download CTA.
   - `/library/[exam]`: Identical view pre-scoped to one examination authority.
   - `/library/resource/[slug]`: Detailed document page with thumbnail preview (or clean typographic A4 folio preview if no thumbnail path exists), full summary, author, version/edition note, rights/license statement, related resources, `"Archived"` status banner with replacement link when applicable, `"Report a problem"` email link, and a **sticky mobile Download button**.
7. **Global Search & Information Pages:**
   - `/search`: Unified search input yielding grouped results by type (PDFs, Countries, Exams/Posts, Topics) with counts.
   - Information & System Pages: `/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy` (including plain-language explanation of `localStorage` usage and progress clearing), `/accessibility`, `/status` (live dataset health from `/data/v1/manifest.json`), friendly `404` (`not-found.tsx`), and `error.tsx`.

---

## 4. Explicit Design Constraints

1. **Aesthetic & Component System:** Retain the **Material Design component elevation, surface hierarchy, and structured states** paired with the portal's signature **Academic Emerald (`#0d4a28`) & Gold (`#f0b938` / `#FEF08A`)** palette, **10 pastel subject-tile accents** (`38d65f1d`, `61df98e5`, `f0919006`, `0b875c04`), and the **exact desktop & mobile layout of `public/images/mcqs-design.png` strictly for the `/mcq/practice` quiz** (ignoring timer and Submit button).
2. **Exact Golden Pill Contrast & Anti-Overflow:** Every golden answer highlight pill MUST use `#FEF08A` background and `#78350F` text (`10.2:1` AAA contrast), wrapping multiple values cleanly per chip (`<= 2` currencies, `<= 3` languages + `+N more` link on `CountryCard`) with strict `min-w-0` containment.
3. **Authentic Official Logos (`Logo.dev`) & Official Subject Icons:** Commission logos render via `branding.json` / `exams.json` `logoUrl` (`img.logo.dev`, token `pk_e4a3hiZuS9GaAmHepVmkcw`, `fallbackMonogram` for KPPSC/BPSC) accompanied by nominative non-affiliation disclaimers; subjects render semantic `iconName` / `iconUrl` (`flagcdn.com/pk.svg` on Pakistan Affairs).
4. **Zero Mock or Placeholder Features:** Remove unprovided post sections (`NotesReaderSection`, `EditorialStudyPlanCard`, unverified blueprint percentages, placeholder metrics on `/ppsc/[slug]`), fake hardcoded commission category arrays (`COMPLEMENTARY_PORTALS`, `FPSC_TEST_CATEGORIES`, `NTS_CATEGORIES`, `CSS_PMS_TRACKS`), dead unimported reference/home files, and `+` inflated question counts across the entire platform.
5. **No Platform Logic Alterations:** Preserve all existing verification gates, disputed-fact exclusions, seeded distractor generation (`quiz-engine`), Unicode accent-normalized matching, and client `localStorage` persistence schemas (`dmc:v1:geography-quiz`, `dmc:v1:mcq`).

---

## 5. Overall Design Direction

The visual and structural direction synthesizes the **institutional academic gravitas** of South Asian public service portals with **tactile study-desk clarity**:

- **Surface & Depth Language:** Light neutral paper ground (`#FAFBFC`) paired with crisp white elevated Material cards (`1px` subtle slate border `#E2E8F0` + soft diffused elevation shadow), anchored by deep Forest Emerald (`#0D4A28` -> `#08331B`) hero headers, dark footer anchors (`#051C0E`), and high-visibility Warm Gold (`#F0B938`) action cues.
- **High-Yield Answer Scanning:** Adopted directly from the Tier 1 reference mockup (`0b875c04`), study cards feature a crisp left gold accent bar (`border-l-4`) or clean labeled spec rows where exact testable facts sit inside unmistakable warm yellow `#FEF08A` highlighter pills (`#78350F` ink), allowing rapid visual scanning before switching directly into Quiz Mode.
- **Clean Authority & Subject Taxonomy:** Adapted from `61df98e5` (minimalist rounded white seal cards + pale mint check pills) and `f0919006` (compact 5-column pastel squircle icon+title grid) so high-density study categories feel fast, scannable, and clutter-free.

---

## 6. Backend Integration Summary

All frontend views read strictly from the implemented database-free backend documented in [`docs/backend/api-contract.md`](./backend/api-contract.md) and [`docs/backend/database-design.md`](./backend/database-design.md). **No REST API server or dynamic SQL/NoSQL endpoint exists.**

### Implemented API & Static JSON Endpoints (`/api/*` + `/data/v1/`)
| Artifact / Route | Method / URL | Consuming Views |
|---|---|---|
| Dataset Manifest | `GET /data/v1/manifest.json` | `/status`, `localStorage` datasetVersion invalidation |
| Provenance Sources | `GET /data/v1/sources.json` | `/ppsc/[slug]`, `/geography/[slug]`, `/methodology` |
| Geography Taxonomy | `GET /data/v1/geography/reference.json` | `/geography`, `/geography/continent/[slug]`, quiz filters |
| Countries Dataset (250) | `GET /data/v1/geography/countries.json` | `/geography/[slug]`, `/geography/continent/[slug]` |
| Paginated Countries API | `GET /api/countries?page=1&pageSize=24&...` & `/data/v1/geography/pages/page-{n}.json` | `/geography` Tier 1 Reference Grid (`fetchCountriesPage`) |
| Geography Quiz Slice | `GET /data/v1/geography/countries-quiz-v1.json` | `/`, `/geography` Tier 2 Quiz & filter-wide selection |
| Examinations & Branding | `GET /data/v1/examinations/exams.json` & `/data/v1/examinations/branding.json` | `/`, `/exams`, `/exams/[slug]`, `/ppsc` (Logo.dev URLs + fallback monograms) |
| PPSC Posts | `GET /data/v1/examinations/posts-ppsc.json` | `/ppsc`, `/ppsc/[slug]`, `/` (shortcut check) |
| Subject & Topic Taxonomy | `GET /data/v1/taxonomy/subjects.json` & `topics.json` | `/`, `/mcq`, `/topics/[subject]/[topic]`, `/library` (Lucide `iconName` / `iconUrl`) |
| Paginated MCQs API | `GET /api/questions?page=1&pageSize=20&...` & `/data/v1/questions/pages/page-{n}.json` | `/mcq`, `/mcq/practice`, `/topics/[subject]/[topic]` (`fetchQuestionsPage`) |
| Sample MCQs | `GET /data/v1/questions/ppsc-samples.json` | `/mcq/practice` |
| PDF Catalog | `GET /data/v1/resources/pdfs.json` | `/`, `/ppsc/[slug]`, `/library`, `/library/[exam]`, `/library/resource/[slug]` |
| Search Index | `GET /data/v1/search-index/all.json` | `/` (Hero/Navbar search prefetch), `/search` |

### Server-Side `ContentRepository` (`src/lib/data/repository.ts`)
Server Components read build-validated JSON via `ContentRepository`:
- `getExams()`, `getExam(slug)`, `getRecruitmentPosts(examSlug, status?)`, `getRecruitmentPost(slug)`, `getSubjects()`, `getTopics()`
- `getCountries(filter?)`, `getCountriesPaginated(filter?)`, `getCountry(slug)`, `getGeographyReference()`
- `getQuestions(filter)`, `getQuestionsPaginated(filter?)`, `getPdfResources(filter?)`, `getPdfResource(slug)`
- `getRelated({ type, id })`, `getSources(ids)`, `search(query, types?)`

### Authentication, Persistence & Feedback Flows
- **Authentication:** None. Zero login tokens, sessions, or user profiles.
- **Progress Persistence (`src/lib/storage/persistence.ts`):** Browser `localStorage` keys `dmc:v1:geography-quiz` and `dmc:v1:mcq` wrap payloads in `{ version: 1, datasetVersion, updatedAt, payload }`, with silent in-memory fallback when storage is disabled and explicit `"Clear my progress"` actions.
- **Error / Correction Reporting (`src/lib/feedback/mailto.ts`):** Client-side `mailto:faculty@docmubashirchaudhary.com` URI composer + copyable plain-text fallback (`form-action 'self' mailto:` CSP compliance).
- **Security Headers (`public/_headers`):** `connect-src 'self'`; `img-src 'self' data: https://flagcdn.com https://upload.wikimedia.org https://img.logo.dev`.

---

## 7. Major Architectural & Resolved Conflict Decisions

1. **Platform-Wide Mock & Unprovided Feature Removal (Strict Truth Policy):**
   - **Post Pages (`/ppsc/[slug]`):** Show **only downloadable SHA-256 PDF booklets** (`PdfResourceCard` links + direct downloads) and essential post title/scale/correction links. Remove synthetic `NotesReaderSection` (`EDITORIAL_STUDY_TOPICS` mock notes tabs), unverified blueprint study allocations (`EditorialStudyPlanCard` / `OfficialBlueprintCard` / `Blueprint History`), placeholder `"Pending official verification"` cards (`PostRecordCard`), and inline sample decks.
   - **Whole Platform Cleanup:** Remove all hardcoded placeholder categories/portals/metrics across `/`, `/exams`, `/fpsc`, `/nts`, `/css-pms`, `/css-pms/[track]`, `/library`, `/topics/[subject]/[topic]`, `/about`, and `/ppsc`, and delete dead unimported mock files (`src/components/reference/*`, `BulletinTicker.tsx`, `ExamHero.tsx`, `FilterHub.tsx`, `SubjectBadges.tsx`, `AuthoritySeals.tsx`, `NotesReaderSection.tsx`). Never display `+` inflated counts (e.g., `"{questions.length}+ MCQs"` when `4` items exist) or fake active track promises for unpopulated commissions. ([`frontend-architecture.md`](./frontend-architecture.md), [`ui-components.md`](./ui-components.md))
2. **Exact `mcqs-design.png` Adoption Scoped Strictly to `/mcq/practice`:** Adopt desktop & mobile geometry of `public/images/mcqs-design.png` (mint sheet backdrop, white card, circular `X/N` progress ring, 2x2 Desktop / 1-col Mobile A-D options, bottom `[Prev] [1..10] [Next]` jumper on desktop vs `[Prev] [Next]` split on mobile) ONLY for the MCQs quiz, **explicitly omitting `"Time remaining"` and `"Submit"`**. Geography Tier 2 quiz retains `0b875c04.jpg`. ([`visual-design.md`](./visual-design.md), [`structural-layout.md`](./structural-layout.md))
3. **Multi-Value Pill Overflow Resolution (`CountryCard`):** Prevent Zimbabwe-style pill ballooning (9 currencies / 16 official languages stretching a single `rounded-full` span past margins) by splitting multi-value facts into independent compact wrapped chips capped at `<= 2` currencies / `<= 3` languages + `+N more` link to `/geography/[slug]`, enforced with `min-w-0` container discipline. ([`ui-components.md`](./ui-components.md), [`responsive-design.md`](./responsive-design.md))
4. **Pagination + Official Logo.dev & Subject Icons Integration:** Wire Countries Tier 1 (`24/page`, `250` items) and MCQ lists (`20/page`) to `/api/countries` & `/api/questions` (`fetchCountriesPage`, `fetchQuestionsPage`) with `?page=` sync, and render `Logo.dev` CDN official commission logos (`pk_e4a3hiZuS9GaAmHepVmkcw` in `branding.json` / `exams.json`, with `fallbackMonogram` for KPPSC/BPSC) plus `subjects.json` Lucide/`flagcdn.com/pk.svg` icons. ([`visual-design.md`](./visual-design.md), [`ui-components.md`](./ui-components.md))
5. **Header Navigation vs. Reference Image `38d65f1d` & Golden Contrast:** Header keeps strictly Logo, `Exams`, `Geography`, `MCQs`, `Library`, and `Search` (zero login). Answer pills standardize on `#FEF08A` background with `#78350F` text (`10.2:1` AAA). `/countries` permanently redirects (`permanentRedirect`) to `/geography`. ([`structural-layout.md`](./structural-layout.md), [`seo.md`](./seo.md))

---

## 8. Backend & UI Status Alignment

All core pagination APIs (`GET /api/countries`, `GET /api/questions`), static page slices (`/data/v1/{geography,questions}/pages/`), 250-country sync, non-duplicated PDF manifests, and `Logo.dev` / subject icon catalogs are **already implemented in backend & `src/lib/`** ([`docs/backend/api-contract.md`](./backend/api-contract.md)). Remaining minor follow-ups:

| Item | Affected Surface | Current UI Handling |
|---|---|---|
| Extend `SearchEntityType` in `src/lib/search/engine.ts` with `'topic'` and update any remaining `/countries#slug` search links to `/geography/[slug]` | `/search`, Navbar/Hero autocomplete | Client-side group display maps `pdf`, `country`, `exam`, `post`, `question`, and server `/search` appends `topicHits` cleanly |
| Expand published questions (`> 4` in `general-knowledge.json`) and commission datasets (`fpsc`, `css-pms`, `nts`) | `/mcq`, `/topics/[subject]/[topic]`, `/fpsc`, `/css-pms`, `/nts` | Render exact honest database counts (`4` MCQs), hide/disable quiz CTAs on 0-question topics (while keeping downloadable PDF links), and show `EmptyStateCard` (`noindex`) on empty commission hubs |

---

## 9. Complete Specification Index

Read these files directly under `docs/` in sequential order during implementation:

### Foundation Phase (Run First: 01 -> 03)
1. **[`frontend-architecture.md`](./frontend-architecture.md)** - Route tree, Next.js App Router boundaries, `ContentRepository` & `/api/*` + `/data/v1/` integration, `localStorage` envelopes, CSS token architecture, mock deletion list, redirect rules.
2. **[`visual-design.md`](./visual-design.md)** - Complete color token matrix (`#0D4A28`, `#F0B938`, `#FEF08A`/`#78350F`, mint `#F0FBF8` `/mcq/practice` sheet, 10 subject pastels), typography scale, spacing/radius/elevation tokens, Logo.dev & subject iconography standards.
3. **[`structural-layout.md`](./structural-layout.md)** - Persistent global shell, breadcrumbs, standing notices, footer structure, `mcqs-design.png` `/mcq/practice` blueprint, `/ppsc/[slug]` PDF-only structure, and section-by-section grid blueprints for all routes.

### Component & Page Phase (Run Next: 04 -> 05)
4. **[`ui-components.md`](./ui-components.md)** - Full component catalog with props, `CommissionBrandBadge`, `SubjectIconChip`, `PaginationBar`, `SingleQuestionCard` + `CircularProgressRing` (`mcqs-design.png`), overflow-safe `CountryCard`, PDF cards, and backend payload bindings.
5. **[`ux-interaction-design.md`](./ux-interaction-design.md)** - Interactive flows (Search, PDF-only `/ppsc/[slug]`, timer/submit-free `/mcq/practice` + retry missed, 2-tier 250-country paginated Geography guide-to-quiz sync, PDF library sorting, `mailto:` corrections).

### Enhancement Phase (Run Last: 06 -> 10)
6. **[`responsive-design.md`](./responsive-design.md)** - Mobile-first breakpoints, collapsing navigation drawer, `/mcq/practice` desktop vs mobile card rules, multi-value `CountryCard` wrapping, sticky mobile PDF Download bar, `>= 44px` touch geometry.
7. **[`animations-motion-design.md`](./animations-motion-design.md)** - Tactile micro-transitions, Lenis smooth scroll, TopLoadingBar, hamburger motion, SVG ring stroke transitions, `>= 70%` quiz celebration motion, and strict `prefers-reduced-motion` static equivalents.
8. **[`seo.md`](./seo.md)** - Per-route metadata templates, canonical consolidation (`/countries` -> `/geography`), pagination canonical strategy, `/ppsc/[slug]` PDF metadata, Schema.org JSON-LD graphs, dynamic `sitemap.ts`, `robots.txt`, and `llms.txt`.
9. **[`accessibility.md`](./accessibility.md)** - WCAG 2.2 AA compliance, AAA highlight contrast verification, keyboard radiogroups for A-D MCQs, `<nav>` pagination/question-jumper aria attributes, circular ring accessible labels, `aria-live` count/score announcements.
10. **[`performance-optimization.md`](./performance-optimization.md)** - Core Web Vitals budgets, bundle limits, `24/page` Geography DOM capping, `Logo.dev` zero-CLS sizing, progressive MiniSearch hydration, cache alignment with `public/_headers`.

### Traceability & Backend References
- **[`reference-and-decision-map.md`](./reference-and-decision-map.md)** - Full evidence ledger tagging every requirement, observation, inference, and recommendation.
- **[`backend/api-contract.md`](./backend/api-contract.md)** & **[`backend/database-design.md`](./backend/database-design.md)** - Implemented static JSON backend, pagination APIs, and Zod schema contracts.

---

## 10. Open Questions & Confirmation Items

1. **MCQ Bank Scope (`/mcq` vs. PDF-Only `/ppsc/[slug]`):** `/ppsc/[slug]` (`intelligent-officer`, `tehsil-sports-officer`) is scoped strictly to downloadable solved PDFs only (no fake study notes tabs or blueprint tables). Confirm whether the `4` authored sample questions in `src/data/questions/ppsc/general-knowledge.json` should stay active on `/mcq` and `/mcq/practice` (using the new `mcqs-design.png` interface) or be archived until a larger verified bank is imported.
2. **Commission Branding Display on Unpopulated Hubs:** `Logo.dev` URLs exist in `branding.json` for `PPSC`, `FPSC`, `CSS / PMS`, `NTS`, and `SPSC`. Confirm whether empty commissions (`FPSC`, `CSS / PMS`, `NTS`) should appear with `"Coming Soon - 0 Booklets"` badges on `/exams` or be omitted from Homepage tiles until at least one PDF/post is published.
3. **Thumbnail Generation for PDF Booklets:** `PdfResourceSchema` includes optional `thumbnailPath`; clarify whether automated page-1 PNG cover rendering will be added later or if the UI should permanently render the typographic A4 cover component when `thumbnailPath` is omitted.

