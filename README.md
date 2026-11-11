# docmubashirchaudhry

Independent, free competitive exam preparation platform and solved study booklet archive curated by Doc Mubashir Chaudhry for PPSC, CSS/PMS, FPSC, and NTS candidates.

- **GitHub Repository:** `https://github.com/rajairfanahmed/docmubashirchaudhry` (`main` branch)
- **Hosting Target:** Vercel (Next.js 15 App Router + serverless API Route Handlers + static `/data/v1/` artifacts)
- **Live URL Status:** Configured for `https://docmubashirchaudhry.vercel.app/`. Steps 8 (`/seo`) and 9 (`/accessibility`) are complete; Performance Optimization (`/performance-optimization`) remains queued as Step 10.

## Architecture Overview

This portal runs with zero external SQL/NoSQL databases and zero user login walls:

- **Canonical Data Store (`src/data/`):** Version-controlled JSON collections validated against strict Zod schemas across `sources.json`, `geography/` (`250` countries & territories, `6` continents, `25` regions, `160` currencies, `154` languages), `examinations/` (exam bodies & PPSC recruitment posts), `taxonomy/` (`9` canonical subjects & topics), `questions/`, and `resources/pdf-resources.json`.
- **Static API & Search Build (`scripts/build-static-data.ts` -> `public/data/v1/`):** Generates immutable versioned JSON snapshots, paginated country/MCQ page slices, branding/taxonomy catalogs, SHA-256 dataset `manifest.json`, and serialized MiniSearch index (`all.json`).
- **Dynamic Route Handlers (`src/app/api/`):**
  - `GET /api/health` - Readiness and live manifest/dataset counts check (`Cache-Control: no-store`).
  - `GET /api/countries` - Zod-validated paginated and filterable country directory (`page`, `pageSize` 1..100, `continentId`, `regionId`, `letter`, `search`, `onlyVerified`, `sort`).
  - `GET /api/questions` - Zod-validated paginated MCQ bank (`page`, `pageSize` 1..100, `examId`, `subjectId`, `postId`, `topicIds`, `difficulty`, `onlyVerified`).
- **Non-Duplicated PDF Library (`public/documents/`):** Stores single canonical binaries validated by `R10_PDF_NO_DUPLICATE_HASH` so duplicate PDF binaries fail build validation immediately.

## Vercel Deployment Guide

1. Import `rajairfanahmed/docmubashirchaudhry` in Vercel (`main` branch).
2. Vercel reads [`vercel.json`](./vercel.json) (`framework: "nextjs"`, `installCommand: "npm ci"`, `buildCommand: "npm run build"`).
   - `npm run build` automatically executes dataset integrity checks (`tsx scripts/validate.ts`), static artifact generation (`tsx scripts/build-static-data.ts`), and `next build`.
3. **Environment Variables (Optional / Post-Deploy):**
   - `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` (public publishable Logo.dev key, already defaulted safely for client CDN image tags).
   - `NEXT_PUBLIC_SITE_URL` (`https://docmubashirchaudhry.vercel.app`; when unset, `src/lib/seo/metadata.ts` automatically falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` system environment variables or `https://docmubashirchaudhry.vercel.app`).
4. **Security & Cache Headers (`next.config.ts` & `public/_headers`):**
   - Vercel does not read `public/_headers` directly, so all CSP (`flagcdn.com`, `upload.wikimedia.org`, `img.logo.dev`), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `/data/v1/` + `/documents/` `Cache-Control` rules are enforced via `async headers()` in [`next.config.ts`](./next.config.ts).
5. **Post-Deploy Verification:**
   - Check `https://docmubashirchaudhry.vercel.app/api/health` (`200 OK`) and `https://docmubashirchaudhry.vercel.app/status`.
   - Steps 8 (`/seo`) and 9 (`/accessibility`) are complete for `https://docmubashirchaudhry.vercel.app/`; proceed next with `/performance-optimization` (Step 10).

## Pipeline Status

| Step | Scope | Status |
|---|---|---|
| Backend Data, APIs, Pagination & Vercel Prep | Zod schemas, 250 countries, `/api/countries`, `/api/questions`, `/api/health`, `vercel.json`, headers, CI | Complete |
| Steps 1-7 (`/frontend-architecture` through `/animations-motion-design`) | App Router pages, design tokens, structural layout, MCQ/geography components, responsive & motion passes | Complete |
| Step 8 (`/seo`) | Canonical URLs (`https://docmubashirchaudhry.vercel.app`), titles, viewport, Schema.org (`CollectionPage` + truthful counts), `robots.ts`, `llms.txt`, image alt/dimensions | Complete |
| Step 9 (`/accessibility`) | WCAG 2.2 AA audit, focus rings, modal `inert` isolation, ARIA tablist/quiz semantics, and contrast tests | Complete |
| Step 10 (`/performance-optimization`) | Final Lighthouse/CWV & bundle optimization pass on Vercel deploy | Next |

## Scripts

```bash
npm run dev                  # Start Next.js development server
npm run validate             # Validate schemas, FKs, PDFs, and duplicate binary hashes
npm run data:build           # Rebuild /public/data/v1/ snapshots & MiniSearch index
npm run data:sync-countries  # Sync 250 countries from open mledoze/countries snapshot
npm run data:pdf-manifest    # Verify SHA-256 and byte sizes of PDFs in public/documents/
npm test                     # Run Vitest unit & route handler suite
npm run typecheck            # Run strict TypeScript check (tsc --noEmit)
npm run build                # Full pre-deploy pipeline: validate + data:build + next build
```

