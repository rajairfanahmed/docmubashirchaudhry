# Backend Implementation Plan

> Status: Core Foundation Complete  
> Last updated: 2026-11-11

## 1. Goal and scope
Build the PRD v2.0 database-free JSON content backend, integrity validation CLI, static `/data/v1/` artifact builder, deterministic quiz engine, versioned `localStorage` engine, MiniSearch indexing/query engine, security cleanup, and repository CI checks for `docmubashirchaudhry`, integrated cleanly into the existing Next.js frontend.

## 2. Assumptions and constraints
- Zero SQL/NoSQL database, zero server runtime sessions, zero login/paywalls.
- Pending owner confirmations (`F1` BS-14 vs BS-16, `F2` 80/20 syllabus, `F3` conditional flag, `F4` official PDF citation) are represented strictly in schema and provenance metadata (`verification.status: 'unverified'` / `secondary` where unverified) without presenting editorial guesses as verified PPSC official rules.
- Existing UI design tokens, Material rules, routes (`/`, `/countries`, `/ppsc`, `/ppsc/[post]`, `/about`), and backwards-compatible `Country` interface adapters remain intact.

## 3. Modules / vertical slices
| Order | Module / slice | Behavior delivered | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|
| 1 | Security Cleanup & Config | Remove exposed API tokens in `.env.example`, `src/lib/api.ts`, `frontend/js/config.js`; add `public/_headers` | None | Zero `rc_live_` token literals; CSP & HSTS headers written | Complete |
| 2 | Dependencies & Zod Schemas | Install `zod`, `minisearch`, `vitest`, `tsx`; implement all schemas under `src/lib/schemas/` | `zod` | All PRD Section 8.4/8.5 entities parse and enforce invariants | Complete |
| 3 | Canonical JSON Repository (`src/data/`) | Create `sources.json`, `geography/*`, `examinations/*`, `taxonomy/*`, `questions/*`, `resources/pdf-resources.json` backed by real PDF checksums | Module 2 | All records structured cleanly; provenance separated | Complete |
| 4 | Validation & Static Data CLI (`scripts/`) | `validate.ts` (15 PRD rules), `build-static-data.ts` (`/data/v1/` + MiniSearch), `pdf-manifest.ts`, `import-csv.ts`, `export-csv.ts`, `check-links.ts` | Modules 2, 3 | `npm run validate` exits `0`; `/public/data/v1/manifest.json` & index built | Complete |
| 5 | `ContentRepository` & Adapters (`src/lib/data/`) | Implement `JsonContentRepository` + static artifact loader + adapter for existing `useCountries` | Modules 2, 3, 4 | All 14 `ContentRepository` methods tested and typed | Complete |
| 6 | Deterministic Quiz, Storage & Search Engines | `src/lib/quiz/`, `src/lib/storage/`, `src/lib/search/` implementing seeded shuffle, multi-answer/disputed checks, region distractors, storage fallback, MiniSearch | Module 5 | All quiz edge cases (South Africa, EUR, disputed) pass Vitest | Complete |
| 7 | Frontend Integration & CI Workflows | Wire `api.ts`, `QuizSection`, `useQuizStore`, `ppsc` pages (data-driven F1/F2 provenance), `AcademicFeedbackForm` (`mailto:` composer), `NavbarSearch`; add `.github/workflows/` | Modules 5, 6 | Clean TypeScript & Next.js build verified | Complete |
| 8 | Automated Test Suite & Docs Sign-Off | Unit + integration Vitest suite across all modules; update `docs/backend/*` with observed outputs | Modules 1-7 | All Vitest suites, validate, data:build, and build pass | Complete |
| 9 | Full Countries Sync, Pagination API, Logo.dev & PDF Dedup | Sync all 250 countries (`scripts/sync-countries.ts`), add Logo.dev CDN + subject icon catalog (`src/lib/branding/logos.ts`), implement backend pagination (`/api/countries`, `/api/questions`, static `/pages/`), point `pdf-resources.json` to non-duplicated PDFs with `R10_PDF_NO_DUPLICATE_HASH` | Modules 1-8 | 250 countries verified, 2 unique PDFs verified, pagination + branding tests pass | Complete |

## 4. Verification plan
- `npm run data:sync-countries` (complete 250-territory sync from canonical open snapshot)
- `npm run data:pdf-manifest` & `npm run validate` (all 15 integrity checks on `src/data/`, PDF checksums, duplicate-hash guard)
- `npm run data:build` (static JSON, paginated page slices, branding/taxonomy artifacts, and MiniSearch index generation)
- `npm test` (Vitest suite covering schemas, validator rules, quiz rules, storage fallback, repository pagination, Logo.dev/subject catalogs, and Route Handlers)
- `npm run typecheck` (`tsc --noEmit`)
- Isolated production build verification with `NEXT_DIST_DIR=".next-verify" npx next build`

## 5. Out of scope
- Generating fake official PPSC PDFs without primary commission documentation.
- Frontend visual implementation of Logo.dev image tags, subject icon chips, and pagination controls (explicitly deferred to frontend handoff per user request).
