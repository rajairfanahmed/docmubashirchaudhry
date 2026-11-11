# Backend Progress

> Last updated: 2026-11-11

## Overall status
Backend, Frontend Steps 1-8 (`/seo` Complete), and Vercel Deployment Prep Complete: Zod schemas, canonical 250-territory JSON dataset, Logo.dev CDN commission branding + 9 subject icon mappings (`src/lib/branding/logos.ts`), pagination Route Handlers (`/api/countries`, `/api/questions`) + `/api/health`, non-duplicated PDFs with SHA-256 duplicate-hash guard, Vercel deployment config (`vercel.json`, `.gitignore`, `README.md`, `next.config.ts`), canonical SEO alignment on `https://docmubashirchaudhry.vercel.app/` (Step 8 `/seo`), and full validation/build passing.

## Completed
- **Step 8 SEO & Discoverability (`src/lib/seo/`, `src/app/`, `public/llms.txt`, `docs/seo.md`):** Updated `DEFAULT_SITE_URL` (`https://docmubashirchaudhry.vercel.app`), `src/data/sources.json`, `.env.example`, and `public/llms.txt` to the Vercel origin; exported Next.js `viewport` + `themeColor` in `src/app/layout.tsx`; eliminated double-pipe `<title>` templates across all App Router pages; extracted pure `buildCountryPageMetadata` handling 0-capital territories (`antarctica`, etc.) and unverified/disputed verification statuses; aligned `/geography` `Quiz` Schema count with `generateGeographyQuizSet` eligible questions; added `buildCollectionPageSchema` (`CollectionPage` + `ItemList` JSON-LD) to hub/collection pages; fixed `SubjectIconChip` & flag image alt/dimensions; unified `/api/` `disallow` across wildcard and AI crawlers in `src/app/robots.ts`; updated `tests/seo-and-sitemap.test.ts`.
- **Vercel & GitHub Deployment Readiness:** Added root `.gitignore`, `README.md`, `vercel.json` (`framework: "nextjs"`, `npm ci`, `npm run build`), `GET /api/health`, `next.config.ts` `async headers()` + `outputFileTracingIncludes` (mirroring `public/_headers` natively on Vercel), and Vercel/env-aware `resolveSiteUrl()` in `src/lib/seo/metadata.ts` + `.env.example`. Ready for GitHub push to `https://github.com/rajairfanahmed/docmubashirchaudhry.git` (`main`) and Vercel import.
- **Security & Secret Hygiene:** Removed literal `rc_live_...` API keys from `.env.example`, `src/lib/api.ts`, and `frontend/js/config.js`; replaced live third-party API dependency with static same-origin `/data/v1/` slices + `/api/*` route handlers + in-bundle fallback. Added `img.logo.dev` to `public/_headers` `img-src`, `next.config.ts` `headers()`, and `images.remotePatterns`.
- **Zod Schema & Branding Layer (`src/lib/schemas/` & `src/lib/branding/logos.ts`):** Added optional commission logo (`logoDomain`, `logoUrl`, `fallbackMonogram`) and subject icon (`iconName`, `iconUrl`, `badgeLabel`) metadata using Logo.dev publishable key `pk_e4a3hiZuS9GaAmHepVmkcw` (`PPSC`, `FPSC`, `NTS`, `CSS / PMS`, `SPSC` live CDN; `KPPSC`, `BPSC` monogram fallback).
- **Complete 250-Country Repository (`src/data/` & `scripts/sync-countries.ts`):** Expanded canonical country set from 45 to all **250** countries & territories (`194` sovereign UN states, `25` regions, `160` ISO 4217 currencies, `154` ISO 639-2 languages) plus synced `public/data/countries-fallback.json` (`250` items), handling Micronesia `USD` fallback and Antarctic territories cleanly.
- **Backend Pagination (`src/lib/data/`, `src/app/api/`, `src/lib/api.ts`):** Implemented `paginateItems`, `getCountriesPaginated`, `getQuestionsPaginated`, `GET /api/countries` (`pageSize` 1..100, default 24), `GET /api/questions` (`pageSize` 1..100, default 20) with Zod query validation (`200` + `400`), prebuilt `/data/v1/{geography,questions}/pages/` slices, and client helpers (`fetchCountriesPage`, `fetchQuestionsPage`).
- **Non-Duplicated PDF Integrity (`src/data/resources/pdf-resources.json`, `dataset-validator.ts`):** Pointed canonical metadata directly to the 2 non-duplicated PDFs on disk inside `public/documents/ppsc/intelligent-officer/`, updated `NotesReaderSection` fallback prop, `structured-data.ts` `encodeURI` URL, `public/llms.txt`, and enforced `R10_PDF_NO_DUPLICATE_HASH` + `R12_SAFE_PDF_PATH`.
- **CI & Automated Verification:** Added `tests/backend-pagination-and-logos.test.ts` and `R10_PDF_NO_DUPLICATE_HASH`/`R12_SAFE_PDF_PATH` cases in `tests/schemas-and-validator.test.ts`.

## Pending (Post-Deploy Enhancement & Owner Confirmations)
- **Deferred Steps 9-10 (`/accessibility`, `/performance-optimization`):**
  1. Ensure `NEXT_PUBLIC_SITE_URL=https://docmubashirchaudhry.vercel.app` is set in Vercel Project Settings (already defaulted cleanly in `src/lib/seo/metadata.ts` and synced via `VERCEL_PROJECT_PRODUCTION_URL`).
  2. Run `/accessibility` (Step 9) and `/performance-optimization` (Step 10) against the live Vercel build.
- **Owner Confirmation F1-F4:** Attach official `ppsc.gop.pk` advertisement & syllabus PDFs to promote `recruitment-posts.json` from `draft`/`unverified` to `published`/`verified`, and confirm remaining non-PPSC hub tracks (`/fpsc`, `/css-pms`, `/nts`).

## Verification
| Command / test | Result | Notes |
|---|---|---|
| `npm run data:sync-countries` | Passed | Synced all `250` countries (`194` sovereign), `25` regions, `160` currencies, `154` languages from `mledoze/countries` |
| `npm run data:pdf-manifest` | Passed | `[VERIFIED]` on both non-duplicated PDFs inside `public/documents/ppsc/intelligent-officer/` |
| `npm run validate` | Passed | 0 errors across `250` countries, `8` sources, `2` PDFs (`R10_PDF_NO_DUPLICATE_HASH` active) |
| `npm run data:build` | Passed | Emitted `/public/data/v1/` (`datasetVersion=v1-a17bdb45eff6`) with paginated slices, branding, and taxonomy JSON |
| `npm test` | Passed | 9 Vitest suites, `57/57` tests passing (including Vercel canonicals, `CollectionPage` JSON-LD, `robots.ts` `/api/` guard, 0-capital/unverified country meta, `llms.txt`) |
| `npm run typecheck` | Passed | `tsc --noEmit` exited with code 0 |
| `NEXT_DIST_DIR=".next-verify" npm run build` | Passed (verify gate) | Clean Next.js 15.5.29 production build compiling `304/304` static/SSG routes + `/api/countries`, `/api/questions`, `/api/health`, `/robots.txt`, `/sitemap.xml` |
| `npm run check:links` | Not run offline | Weekly external URL link checker prepared in `scripts/check-links.ts` and GitHub workflow |
| `npm run lint` | Not configured | `next lint` prompts for interactive ESLint setup because repo has no `.eslintrc` config |

## Known risks / limitations
- Editorial contact mailboxes intentionally preserve `editorial@docmubashirchaudhary.com` (`ui`/`footer`/`tests`) while public web canonical URLs, `sitemap.xml`, `robots.txt`, JSON-LD, and `llms.txt` resolve to `https://docmubashirchaudhry.vercel.app`.
