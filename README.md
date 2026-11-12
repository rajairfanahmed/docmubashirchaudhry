<a name="readme"></a>

<div align="center">

[README](#readme) | [Architecture](#architecture--features) | [Docs](docs/backend/architecture.md) | [Contributing](#contributing) | [Rights & Security](#rights--security)

<br />

<img src="public/icon.svg" alt="docmubashirchaudhry brand emblem" width="88" height="88" />

# docmubashirchaudhry

[![Dataset & Build CI](https://github.com/rajairfanahmed/docmubashirchaudhry/actions/workflows/validate.yml/badge.svg)](https://github.com/rajairfanahmed/docmubashirchaudhry/actions/workflows/validate.yml)
[![Live Portal](https://img.shields.io/badge/Live-Vercel-01411C?style=flat-square&logo=vercel&logoColor=white)](https://docmubashirchaudhry.vercel.app/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](package.json)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20RLS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](supabase/migrations/0001_v3_initial_schema.sql)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2%20Signed%20PDFs-F38020?style=flat-square&logo=cloudflare&logoColor=white)](next.config.ts)
[![Vitest](https://img.shields.io/badge/Vitest-106%20Passing-047857?style=flat-square)](docs/backend/testing-strategy.md)
[![Issues](https://img.shields.io/github/issues/rajairfanahmed/docmubashirchaudhry?style=flat-square&color=d97706)](https://github.com/rajairfanahmed/docmubashirchaudhry/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-16a34a?style=flat-square)](#contributing)

**Hybrid exam preparation portal for PPSC, FPSC, CSS/PMS, NTS, and World Geography candidates.**

Strict Zod provenance, Supabase Auth with PostgreSQL Row-Level Security, short-TTL Cloudflare R2 presigned PDFs, and 316 compiled Next.js 15 routes tuned for mid-tier mobile devices.

[Live Portal](https://docmubashirchaudhry.vercel.app/) · [Report Bug](https://github.com/rajairfanahmed/docmubashirchaudhry/issues/new) · [Request Feature](https://github.com/rajairfanahmed/docmubashirchaudhry/issues/new) · [PR Checklist](.github/PULL_REQUEST_TEMPLATE.md) · [Architecture Docs](docs/backend/architecture.md)

<br />

<img src="public/images/og-default.png" alt="docmubashirchaudhry verified PPSC, CSS/PMS and World Geography study portal preview" width="760" />

</div>

---

## Quickstart

Clone the repository, validate the Zod-governed dataset, and start the Next.js 15 development server in three commands:

```bash
git clone https://github.com/rajairfanahmed/docmubashirchaudhry.git && cd docmubashirchaudhry
npm ci
npm run validate && npm run dev
```

Open `http://localhost:3000`. Open reference guides, syllabus pages, and all 250 country profiles work out of the box from version-controlled JSON snapshots. To enable authentication, interactive timed quizzes, cloud PDF downloads, and the `/admin` workspace locally, copy [`.env.example`](.env.example) to `.env.local` and supply your Supabase and Cloudflare R2 credentials after applying [`supabase/migrations/0001_v3_initial_schema.sql`](supabase/migrations/0001_v3_initial_schema.sql).

---

## The Why?

Competitive exam aspirants in Pakistan routinely lose study hours to three preventable flaws across typical preparation sites:

1. **Unverified answer keys in negative-marking exams:** Mixed third-party scrapes present guesswork as confirmed truth, causing `-0.25` mark deductions in PPSC screening tests.
2. **Fabricated syllabus weights and broken PDF mirrors:** Blogs invent subject percentages missing from official commission gazettes and host slow, ad-wrapped mirror links.
3. **Heavy client bundles on budget phones:** Unsplit scripts, blocking modals, and layout shifts stall mid-tier Android browsers on 3G/4G networks.

`docmubashirchaudhry` enforces technical guardrails against all three:

- **Epistemic clarity enforced by Zod:** Static notices, posts, country profiles, and reference items carry explicit verification states (`verified`, `unverified`, `disputed`, `outdated`). Unconfirmed weights require `officialMarksPct: null`, keeping faculty study advice separate inside `"Platform recommendation, not official."` blocks.
- **Public-open + authenticated-cloud split:** Public exam guides (`/ppsc`, `/fpsc`, `/geography`) load immediately without accounts, while user-tracked timed quizzes (`/quizzes`), download history (`/my-downloads`), and private PDF booklets (`/library`) run on Supabase PostgreSQL with RLS and server-signed Cloudflare R2 URLs.
- **Deterministic asset integrity and lean bundles:** `npm run validate` verifies JSON schemas, foreign keys, and PDF SHA-256 checksums (`R10_PDF_NO_DUPLICATE_HASH` duplicate-hash gate), while `next/dynamic`, `optimizePackageImports`, and AVIF/WebP image delivery keep initial hydration payloads small.

---

## Backstory

Led academically by **Dr. Mubashir Chaudhry** (M.Phil. Biology, B.S. Botany, B.A., M.A. English, M.A. Political Science, B-Pharmacist, The University of Agriculture, Faisalabad), this platform keeps solved exam booklets and verifiable MCQ study notes accessible without ads or paywalls.

Built iteratively from schema contracts to production hardening across backend specs ([`docs/backend/`](docs/backend/architecture.md)), frontend engineering phases ([`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) through [`docs/performance-optimization.md`](docs/performance-optimization.md)), and the v3.0 cloud portal upgrade ([`supabase/migrations/0001_v3_initial_schema.sql`](supabase/migrations/0001_v3_initial_schema.sql)).

---

## Architecture & Features

```text
+-----------------------------------------------------------------------------+
|  1. Open Static Reference Layer (No Auth Required)                          |
|     src/data/*.json + public/documents/**/*.pdf                             |
|       -> npm run validate     (Zod schemas, FKs, SHA-256 & duplicate gate)  |
|       -> npm run data:build   (/public/data/v1/* slices, 119.6 KB search)   |
|       -> SSG Routes           (/, /exams, /ppsc, /fpsc, /geography/[slug])  |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|  2. Cloud Portal, Quizzes & Private R2 Delivery (v3.0 Hybrid Layer)         |
|     src/middleware.ts + Supabase Auth (@supabase/ssr, ADMIN_EMAILS)         |
|       -> /quizzes, /quizzes/[slug]     (Server-checked MCQs & attempt logs) |
|       -> /library, /api/pdfs/[id]/download  (Short-TTL Cloudflare R2 URLs)  |
|       -> /my-attempts, /my-downloads   (Authenticated student history)      |
|       -> /admin/*, /api/admin/*        (Allow-listed CMS, uploads & metrics)|
+-----------------------------------------------------------------------------+
```

### Core Capabilities

- **250 UN/ISO Country & Territory Profiles (`/geography`, `/geography/[slug]`):** Covers `250` countries and territories across `6` continents, `25` regions, `160` currencies, and `154` languages, paginated at `24` cards per page with explicit SVG flag dimensions for zero layout shift.
- **Server-Backed Timed Quizzes (`/quizzes`, `/quizzes/[slug]`):** Interactive quiz runner backed by Supabase tables and API endpoints (`/api/quizzes/[id]/start`, `/check-answer`, `/submit`), paired with a deterministic client quiz pack (`/mcq/practice`, `countries-quiz-v1.json`) for offline/open practice.
- **Private Cloudflare R2 PDF Library (`/library`, `/api/pdfs/[id]/download`):** Stores PDFs in a private R2 bucket (`CLOUDFLARE_R2_BUCKET_NAME`) via `@aws-sdk/client-s3` and issues short-lived presigned URLs (`CLOUDFLARE_R2_SIGNED_URL_TTL_SECONDS=180`) only after server verification.
- **Dual-Layer Fail-Closed Admin Workspace (`/admin`, `/api/admin/*`):** Enforces `ADMIN_EMAILS` (comma-separated lowercase allow-list) and Supabase role checks across middleware (`src/middleware.ts`), server layouts (`src/app/admin/layout.tsx`), and API route guards (`requireAdminSession`).
- **On-Demand Client Search (`public/data/v1/search-index/all.json`):** `119.6 KB` serialized MiniSearch catalog dynamically imported (`import('@/lib/search')`) when users focus search inputs rather than inside the initial landing bundle.
- **WCAG 2.2 AA & Structured SEO Metadata:** Visible high-contrast focus indicators, `inert` focus trapping in dialogs, `aria-live="polite"` status updates, JSON-LD graphs (`CollectionPage`, `Quiz`, `DigitalDocument`), and clean `sitemap.xml` + `llms.txt` outputs.

---

## Benchmarks & Verification

Verified locally with `NEXT_DIST_DIR=".next-verify" npx next build` (`316` compiled static pages in `32.8s`), `npm run validate` (`0` errors), `npx tsc --noEmit` (`exit 0`), and `npm test` (`17` files, `106` tests passing):

| Metric / Route | Measured Result | Implementation Notes |
|---|---|---|
| Shared client runtime | `103 kB` | Next.js 15 + React 19 baseline (`chunks/1255` `46.3 kB` + `chunks/4bd1b696` `54.2 kB`) |
| `/` (Home) First Load JS | `182 kB` (down from `186 kB`) | `LazyAuthModal` (`next/dynamic`), `optimizePackageImports: ["lucide-react", "motion"]`, pruned RSC props |
| Minimal static routes (`/accessibility`, `/copyright`, `/methodology`, `/geography/[slug]`) | `106 kB` (`179 B` route) | Pure server-rendered pages sharing only base runtime chunks |
| `public/data/v1/search-index/all.json` | `119.6 KB` (`122,466 bytes`) | Compact MiniSearch catalog loaded lazily on search interaction |
| `public/data/v1/geography/countries-quiz-v1.json` | `93.8 KB` (`96,100 bytes`) | Stripped quiz slice separate from paginated profile payloads |
| Automated test suite (`npm test`) | `17` files, `106` tests passing | Schema validation, v3 backend/RLS contracts, auth guards, SEO, WCAG contrast, performance budgets |

> Note: Run remote mobile Lighthouse audits directly against [`https://docmubashirchaudhry.vercel.app/`](https://docmubashirchaudhry.vercel.app/) after Vercel deployment completes.

---

## Documentation & Commands

### Repository Documentation

| Domain | Reference |
|---|---|
| Design & Architecture | [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) · [`docs/frontend-architecture.md`](docs/frontend-architecture.md) · [`docs/backend/architecture.md`](docs/backend/architecture.md) |
| Data & API Contracts | [`docs/backend/api-contract.md`](docs/backend/api-contract.md) · [`docs/backend/database-design.md`](docs/backend/database-design.md) · [`docs/backend/progress.md`](docs/backend/progress.md) |
| Frontend Specifications | [`docs/visual-design.md`](docs/visual-design.md) · [`docs/structural-layout.md`](docs/structural-layout.md) · [`docs/ui-components.md`](docs/ui-components.md) · [`docs/responsive-design.md`](docs/responsive-design.md) · [`docs/animations-motion-design.md`](docs/animations-motion-design.md) |
| Quality Gates | [`docs/seo.md`](docs/seo.md) · [`docs/accessibility.md`](docs/accessibility.md) · [`docs/performance-optimization.md`](docs/performance-optimization.md) · [`docs/backend/testing-strategy.md`](docs/backend/testing-strategy.md) |

### Available Scripts

```bash
npm run dev                  # Start Next.js development server
npm run validate             # Enforce Zod, FK, PDF integrity & duplicate-hash rules
npm run data:build           # Rebuild /public/data/v1/ slices, manifest.json & MiniSearch index
npm run data:sync-countries  # Sync 250 countries from open mledoze/countries snapshot
npm run data:pdf-manifest    # Inspect SHA-256 checksums & byte sizes in public/documents/
npm run check:links          # Check external commission & geodata source URLs
npm test                     # Execute Vitest suite (106 tests across 17 files)
npm run typecheck            # Run tsc --noEmit across application and tests
npm run build                # Full pre-deploy pipeline: validate + data:build + next build
```

### Vercel Deployment

Importing `rajairfanahmed/docmubashirchaudhry` (`main` branch) into Vercel uses [`vercel.json`](vercel.json) (`framework: "nextjs"`, `installCommand: "npm ci"`, `buildCommand: "npm run build"`, `10s` serverless `maxDuration` on `src/app/api/**/*.ts`). Configure all variables from [`.env.example`](.env.example) in Vercel Project Settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`, and `CLOUDFLARE_R2_*`). Security headers (CSP for Supabase, Logo.dev, flag CDNs, HSTS, `X-Frame-Options: DENY`) and static asset cache policies live in [`next.config.ts`](next.config.ts) alongside portable headers in [`public/_headers`](public/_headers). Verify deployments via `/api/health` and `/status`.

---

<a name="contributing"></a>

## Contributing

Contributions covering official notice citations, MCQ explanations, solved booklet checksums, and UI/accessibility fixes run through GitHub CI ([`.github/workflows/validate.yml`](.github/workflows/validate.yml)):

1. Fork or branch cleanly from `main`:

```bash
git checkout -b fix/short-descriptive-name
```

2. Keep changes factual and source-backed:
   - Cite recruitment or syllabus claims in [`src/data/sources.json`](src/data/sources.json).
   - Keep unverified notices at `verification.status: "unverified"`.
   - Keep security checks fail-closed whenever touching `src/middleware.ts`, `src/lib/auth/`, or `src/app/api/`.
3. Verify locally before staging:

```bash
npm run validate && npm run data:build && npm test && npm run typecheck
```

4. Stage **only intended files by name** (`git add .` and `git add -A` are prohibited so temporary caches, `.next*` directories, or local `.env*` secrets never enter history):

```bash
git add src/data/questions/ppsc/general-knowledge.json src/data/sources.json
git commit -m "content(mcq): add verified source citation"
```

5. Open a Pull Request using [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). All contributors are expected to maintain constructive, evidence-first review aligned with standard Contributor Covenant norms. Optional repository ownership rules can be adapted from [`.github/CODEOWNERS.example`](.github/CODEOWNERS.example).

---

<a name="rights--security"></a>

## Rights & Security

### Educational Rights & Attribution

Per [`Copyright & Attribution`](src/app/copyright/page.tsx) (`/copyright`):

- **`author_original` booklets:** Compilations authored by Dr. Mubashir Chaudhry remain free for individual candidates and educators with attribution preserved; commercial reselling or paywalling is prohibited.
- **`public_domain_official` / `cc_by_4` / `permission_granted` records:** Statutory notifications, UN/ISO country descriptors, and open geodata retain attribution to their respective issuing bodies and dataset creators.

### Reporting Bugs, Content Errata & Security Issues

- **Factual or syllabus errata:** Use `/corrections` on the live portal or open a GitHub issue referencing the route URL and primary commission document.
- **Security and credential hygiene:** Privileged keys (`SUPABASE_SECRET_KEY`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) remain strictly server-side and are excluded from client bundles and `git` history via [`.gitignore`](.gitignore). Never open public issues with private credentials; send takedown or responsible disclosure notices to `copyright@docmubashirchaudhary.com`.
