# Backend Architecture

> Status: Implemented (PRD v2.0 Backend + 250-Country Sync, Pagination, Branding Catalog & Vercel Deployment Prep)  
> Last updated: 2026-11-11

## 1. Purpose and scope
This backend architecture implements the Product Requirements Document v2.0 database-free content, verification, quiz, local persistence, search, and static API artifact pipeline for the `docmubashirchaudhry` open-access learning portal.

### In scope
- Typed Zod schemas and TypeScript models under `src/lib/schemas/`.
- Version-controlled canonical JSON datasets under `src/data/`.
- Repository abstraction (`ContentRepository` with `getCountriesPaginated` and `getQuestionsPaginated`), Next.js Route Handlers (`/api/health`, `/api/countries`, `/api/questions`), and static JSON loader under `src/lib/data/` and `src/app/api/`.
- Commission Logo.dev CDN catalog (`img.logo.dev` with publishable key `pk_e4a3hiZuS9GaAmHepVmkcw`) and semantic subject icon metadata under `src/lib/branding/logos.ts`.
- Deterministic browser-side Geography quiz engine (`src/lib/quiz/`), versioned `localStorage` persistence wrapper (`src/lib/storage/`), and client-side MiniSearch engine (`src/lib/search/`).
- Build-time integrity validator (`15` rules + duplicate PDF binary hash check), complete 250-territory country sync (`scripts/sync-countries.ts`), static `/data/v1/` API & paginated slice builder, PDF manifest/checksum verifier, CSV importer/exporter, and external link checker (`scripts/`).
- Vercel deployment configuration (`vercel.json`, `next.config.ts` security headers & `outputFileTracingIncludes`, environment-aware `resolveSiteUrl()` in `src/lib/seo/metadata.ts`), CI quality gates (`.github/workflows/`), and portable static security headers (`public/_headers`).

### Explicitly out of scope (PRD Section 6.3)
- Relational/document databases (`Postgres`, `MySQL`, `MongoDB`, `Supabase`, `SQLite`) and ORMs (`Prisma`, `Drizzle`).
- Student authentication, accounts, passwords, JWTs, OAuth, or server sessions.
- Server-side quiz result submission, user comments, forums, leaderboards, payments, or ads.
- Web admin CMS UI (editorial updates happen via git commits, PRs, CSV scripts, and validation CI).

## 2. System context
```
[Author / Reviewer PR]
   |
   +--> src/data/*.json + public/documents/**/*.pdf
          |
          +--> [scripts/validate.ts] (15 PRD Integrity Rules + SHA-256 PDF checks)
          |
          +--> [scripts/build-static-data.ts] --> public/data/v1/*.json + manifest.json + search-index/*.json
          |
          +--> [Next.js Static Build] --> Static CDN / Host (with public/_headers CSP & Cache-Control)
                                               |
                                               v
                                      [Student Browser]
                                        - Reads static /data/v1/ slices & pages
                                        - Runs deterministic quiz engine (src/lib/quiz/)
                                        - Saves anonymous state locally (src/lib/storage/)
                                        - Runs offline-capable MiniSearch (src/lib/search/)
```

## 3. Technology stack
| Concern | Technology | Status / rationale |
|---|---|---|
| Language / runtime | TypeScript 5 + Node.js | Confirmed; `tsconfig.json` strict mode enabled |
| Schema validation | `zod` | Implementing; validates `src/data/*.json` and runtime payloads |
| Static content storage | Versioned JSON files in git (`src/data/`) | Confirmed per PRD v2.0 Section 5.A (no database) |
| Client search engine | `minisearch` | Implementing; compact serialized index under `/data/v1/search-index/` |
| Framework / hosting | Next.js 15 App Router on Vercel | Configured via `vercel.json` & `next.config.ts` (static `/data/v1/` assets + serverless `/api/*` Route Handlers) |
| Test runner | `vitest` + `tsx` | Implementing; unit, schema, validator, quiz, storage, search tests |
| CI / automation | GitHub Actions (`validate.yml`, `check-links.yml`) | Implementing per PRD Section 7.5 |

## 4. Components and responsibilities
1. **`src/lib/schemas/`**: Defines strict Zod schemas covering `Verification`, `Source`, `Continent`, `Region`, `Currency`, `Language`, `Country`, `Exam`, `RecruitmentPost`, `Blueprint`, `Subject`, `Topic`, `Question`, `PdfResource`, and `Manifest`.
2. **`src/data/`**: Canonical source-of-truth JSON repositories cleanly organized into `sources.json`, `geography/`, `examinations/`, `taxonomy/`, `questions/`, and `resources/`.
3. **`src/lib/data/`**: Exposes `ContentRepository` (exact interface from PRD Section 7.2) backed by typed JSON loading plus adapters for legacy `/countries` React hooks.
4. **`src/lib/quiz/`**: Implements deterministic seeded shuffle, verified & disputed eligibility checks, multi-answer case/diacritic-insensitive exclusion (e.g., South Africa 3 capitals, Eurozone shared EUR), hierarchical distractors (`sameRegion -> sameContinent -> global`), and template explanations.
5. **`src/lib/storage/`**: Implements versioned keys (`dmc:v1:geography-quiz`, `dmc:v1:mcq`) with corrupt/outdated payload pruning, in-memory fallback when `localStorage` is blocked, and one-click clear/export actions.
6. **`src/lib/search/`**: Builds and queries pre-indexed MiniSearch indexes across countries, exams, recruitment posts, PDF resources, and published MCQs.
7. **`scripts/`**: CLI utilities (`validate.ts`, `build-static-data.ts`, `pdf-manifest.ts`, `import-csv.ts`, `export-csv.ts`, `check-links.ts`).

## 5. Authentication and authorization
- **Public portal:** Zero student accounts, zero login gates, zero paywalls, zero analytics/tracking cookies.
- **Administrative / editorial control:** Enforced via repository write access (`CODEOWNERS`), Pull Request review, and CI validation workflows rather than web endpoints or exposed tokens.
- **Credential hygiene:** Previously exposed third-party API token references in `.env.example`, `src/lib/api.ts`, and `frontend/js/config.js` are removed. Static builds consume verified committed JSON data without runtime secret keys.

## 6. External dependencies
- **Official source citations (`src/data/sources.json`):** Referenced by ID; never fetched dynamically at student runtime. Weekly scheduled `check-links.ts` verifies URL liveness in CI.
- **Countries Sync (`scripts/sync-countries.ts`):** Because `restcountries.com/v3.1/all` was deprecated upstream (`v5` requires bearer credentials), `npm run data:sync-countries` fetches the open 250-territory snapshot from `https://raw.githubusercontent.com/mledoze/countries/master/countries.json` (`COUNTRIES_SYNC_SOURCE_URL` override or optional `REST_COUNTRIES_V5_BASE_URL` + `REST_COUNTRIES_V5_API_KEY`) at build/sync time and populates all 250 `src/data/geography/countries.json` records + `public/data/countries-fallback.json`. Student browsers still read strictly same-origin `/data/v1/` or `/api/countries`.
- **Logo.dev CDN (`src/lib/branding/logos.ts`):** Builds `https://img.logo.dev/{domain}?token=...&size=128&format=png&fallback=404` URLs using publishable key `pk_e4a3hiZuS9GaAmHepVmkcw` (`NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY`), permitted in `public/_headers` (`img-src`) and `next.config.ts` (`images.remotePatterns`). Commissions currently returning HTTP 404 (`kppsc.gov.pk`, `bpsc.gob.pk`) store `logoUrl: null` with fallback monograms.
- **Email errata / corrections (`AcademicFeedbackForm.tsx`):** Uses a client-composed `mailto:` trigger (PRD Section 7.4) with zero server submission handlers.

## 7. Reliability and observability
- Build-time `npm run validate` fails fast on broken references, schema violations, missing/mismatched PDF checksums, unpublished-unverified leakage, or mixed official/editorial marks.
- Client quiz persistence fails safely to in-memory React/Zustand state if browser `localStorage` throws `SecurityError` or `QuotaExceededError`.

## 8. Architecture decisions
| Decision | Status | Rationale | Trade-offs |
|---|---|---|---|
| Database-free JSON + static `/data/v1/` artifacts | Confirmed | Zero hosting cost, instant CDN loads, full git audit trail (PRD v2.0) | Content edits require PR + CI rebuild |
| Remove runtime `api.restcountries.com` live key dependency | Confirmed | Fixes exposed token security risk and prevents third-party runtime downtime | Geography facts update on git release cycle |
| Client `mailto:` errata composer | Confirmed | Eliminates spam/backend inbox server per PRD 7.4 | Relies on user having an email client configured |
| Keep existing `/ppsc` & `/countries` routes during migration | Proposed | Preserves working frontend UI while upgrading data layer cleanly | Full P01-P30 expansion scheduled over Sprints S1-S11 |

## 9. Risks and open questions (Pending Owner Confirmation)
- **F1 (Basic Scale):** Intelligent Officer Ad 11/2026 confirmed in PRD research as BS-14; owner confirmation pending (`basicScale` stored data-driven per post).
- **F2 (PPSC Syllabus Breakdown):** Prior UI displayed an unverified 40/20/20/20 split; secondary PPSC 11/2026 sources report ~80% General Ability & ~20% Basic Computer Studies. Marked `unverified` in data until official PPSC PDF syllabus is attached.
- **F3 (`heldConditional` Flag):** Support flag ready in schema; owner confirmation pending.
- **F4 (Secondary Sources):** PPSC 11/2026 sources marked `unverified` until direct `ppsc.gop.pk` PDF citation is committed.
- **A3 Domain spelling:** Live code uses `docmubashirchaudhary.com` while PRD text uses `docmubashirchaudhry`; keep existing canonical tags consistent until DNS choice confirmed.
- **Non-duplicated PDF store in `public/documents/ppsc/intelligent-officer/`:** Exactly 2 distinct `%PDF-` booklets exist on disk (`(Set 01) Intelligence Officer PPSC (BS-14) 500+ MCQS By Doc Mubashir Chaudhry (1).pdf` and `TSO PPSC (BS-16) 500+ MCQS By Doc Mubashir Chaudhry (1).pdf`). Validator rule `R10_PDF_NO_DUPLICATE_HASH` scans `public/documents/` recursively and fails validation if duplicate SHA-256 PDF binaries are added.
- **Vercel Deployment & Canonical URL Wiring:** Because Vercel ignores `public/_headers`, `next.config.ts` defines equivalent security headers (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`, `X-Content-Type-Options`) via `async headers()` alongside `outputFileTracingIncludes` for `public/data/v1/manifest.json`. Canonical URL resolution (`resolveSiteUrl()` in `src/lib/seo/metadata.ts`) checks `NEXT_PUBLIC_SITE_URL`, `SITE_CANONICAL_URL`, and Vercel system env vars (`VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`).
- **Deferred Enhancement Phases (Awaiting Live Vercel URL):** Steps 8-10 (`/seo`, `/accessibility`, `/performance-optimization`) are intentionally deferred until after GitHub push (`https://github.com/rajairfanahmed/docmubashirchaudhry.git`) and initial Vercel deployment so the deployed Vercel URL can be passed directly into `/seo`.
