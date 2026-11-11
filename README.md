<a name="readme"></a>

<div align="center">

[README](#readme) | [Architecture](docs/backend/architecture.md) | [API Contract](docs/backend/api-contract.md) | [Contributing](#contributing) | [Rights & Security](#rights--security)

<br />

<img src="public/icon.svg" alt="docmubashirchaudhry brand emblem" width="88" height="88" />

# docmubashirchaudhry

[![Dataset & Build CI](https://github.com/rajairfanahmed/docmubashirchaudhry/actions/workflows/validate.yml/badge.svg)](https://github.com/rajairfanahmed/docmubashirchaudhry/actions/workflows/validate.yml)
[![Live Portal](https://img.shields.io/badge/Live-Vercel-01411C?style=flat-square&logo=vercel&logoColor=white)](https://docmubashirchaudhry.vercel.app/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](package.json)
[![Vitest](https://img.shields.io/badge/Vitest-68%20Passing-047857?style=flat-square)](docs/backend/testing-strategy.md)
[![Issues](https://img.shields.io/github/issues/rajairfanahmed/docmubashirchaudhry?style=flat-square&color=d97706)](https://github.com/rajairfanahmed/docmubashirchaudhry/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-16a34a?style=flat-square)](#contributing)
[![Free Educational Access](https://img.shields.io/badge/Access-Free%20Educational-1e293b?style=flat-square)](#rights--security)

**Zero-database, zero-login exam preparation portal for PPSC, CSS/PMS, FPSC, NTS, and World Geography candidates.**

Strict epistemic provenance, SHA-256 verified study booklets, and sub-140 kB route bundles tuned for mid-tier Android phones on Pakistani 3G/4G networks.

[Live Portal](https://docmubashirchaudhry.vercel.app/) · [Report Bug](https://github.com/rajairfanahmed/docmubashirchaudhry/issues/new) · [Request Feature](https://github.com/rajairfanahmed/docmubashirchaudhry/issues/new) · [PR Checklist](.github/PULL_REQUEST_TEMPLATE.md) · [Architecture Docs](docs/backend/architecture.md)

<br />

<img src="public/images/og-default.png" alt="docmubashirchaudhry verified PPSC, CSS/PMS and World Geography study portal preview" width="760" />

</div>

---

## Quickstart

Clone, validate the Zod-governed dataset, and start the Next.js 15 development server in three commands:

```bash
git clone https://github.com/rajairfanahmed/docmubashirchaudhry.git && cd docmubashirchaudhry
npm ci
npm run validate && npm run dev
```

Open `http://localhost:3000`. Optional environment overrides for sync scripts, Logo.dev brand icons, and canonical site URL resolution live in [`.env.example`](.env.example).

---

## The Why?

Competitive exam aspirants in Pakistan routinely lose study hours to three preventable problems on existing websites:

1. **Unverified answer keys in negative-marking exams:** Mixed third-party scrapes pass guesswork off as confirmed truth, causing `-0.25` mark deductions in PPSC screening tests.
2. **Conflated syllabus weights:** Blogs invent subject percentages that were never published in official commission gazettes.
3. **Ad bloat and paywall gates on budget phones:** Heavy scripts, tracker chains, and split-file PDF links stall mid-tier mobile browsers on cellular connections.

`docmubashirchaudhry` solves all three in code and schema constraints:

- **Epistemic clarity enforced by Zod:** Every notice, post, country fact, question, and PDF carries one of four explicit verification states (`verified`, `unverified`, `disputed`, `outdated`). Whenever an official commission syllabus lacks numeric weights, schemas enforce `officialMarksPct: null` and isolate faculty guidance inside `"Platform recommendation, not official."` blocks.
- **No runtime database or login gate:** All canonical records live as version-controlled JSON under `src/data/` and prebuilt immutable slices under `public/data/v1/`. Students study immediately without accounts, cookies, or database cold starts.
- **Deterministic PDF integrity:** `npm run validate` fails the build if a booklet in `public/documents/` is missing, has a mismatched SHA-256 hash or byte size, or duplicates an existing binary (`R10_PDF_NO_DUPLICATE_HASH`).

---

## Backstory

Led academically by **Dr. Mubashir Chaudhry** (M.Phil. Biology, B.S Botany, M.A English Literature, M.A Political Science, B-Pharmacist UAF), the project began with a straightforward commitment: keep solved exam booklets and verifiable screening study notes permanently free with zero ads and zero paywalls.

To match that academic standard with reliable web engineering, the platform was specified and built sequentially across a full backend architecture ([`docs/backend/`](docs/backend/architecture.md)) and 10 documented frontend phases ([`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md) through [`docs/performance-optimization.md`](docs/performance-optimization.md)): schema contracts first, accessibility (WCAG 2.2 AA) and SEO truthfulness next, and strict bundle/CLS budgets before final release.

---

## Architecture & Features

```text
  src/data/*.json + public/documents/**/*.pdf
          |
          +--> npm run validate        (Zod schemas, FKs, SHA-256 & duplicate-hash gate)
          |
          +--> npm run data:build      (public/data/v1/* slices, manifest.json, MiniSearch index)
          |
          +--> npm run build           (Next.js 15 App Router: 304 static routes + serverless /api/*)
                    |
                    +--> GET /api/health      (live manifest & record counts, no-store)
                    +--> GET /api/countries   (validated filter/sort/pagination across 250 territories)
                    +--> GET /api/questions   (validated MCQ filtering by exam, subject, topic, status)
                    +--> Static /data/v1/*    (offline fallback slices, quiz pack & 119.6 KB search index)
```

### Core Capabilities

- **250 UN/ISO Country & Territory Profiles (`/geography`, `/geography/[slug]`):** Covers `250` sovereign and territory records across `6` continents, `25` regions, `160` currencies, and `154` languages (`countries.json`), paginated at `24` cards per page with explicit SVG flag dimensions (`40x27` cards, `112x84` profile heroes) for zero Cumulative Layout Shift (`0.000` flag CLS).
- **Deterministic Quiz Engine (`src/lib/quiz/`):** Seeded shuffle, verified-record eligibility checks, multi-answer handling (such as South Africa's three capitals), hierarchical distractors (`sameRegion` -> `sameContinent` -> `global`), and template rationales backed by `localStorage` state keyed to `manifest.datasetVersion` (`v1-a17bdb45eff6`).
- **On-Demand Client Search (`public/data/v1/search-index/all.json`):** `119.6 KB` pre-serialized MiniSearch catalog loaded dynamically only on navbar/hero search focus or `/search` navigation, never inside the initial homepage hydration bundle.
- **Official Commission Branding & Honest Hubs (`/exams`, `/ppsc`, `/library`):** Logo.dev badges (`img.logo.dev` + instant monogram fallback for `KPPSC`/`BPSC` `404`s), `CollectionPage` + `Quiz` + `DigitalDocument` JSON-LD metadata, and `robots: noindex` guards on empty hub tracks until verified posts arrive.
- **WCAG 2.2 AA Interaction Model:** Visible focus rings on both light (`#0D4A28`) and dark green (`#F0B938`) surfaces, keyboard focus traps with `inert` background isolation for dialogs and drawers, `aria-live="polite"` filter/grading announcements, and explicit text/icon answer states beyond color alone.

---

## Benchmarks & Verification

Verified locally with `NEXT_DIST_DIR=".next-verify" npm run build` (`304` compiled static pages), `npm run validate`, `npm test`, and `npm run typecheck`:

| Metric / Route | Measured Result | Engineering Cause |
|---|---|---|
| Shared client runtime | `103 kB` | Next.js 15 + React 19 baseline (`chunks/1255` `46.6 kB` + `chunks/4bd1b696` `54.2 kB`) |
| `/` (Home) First Load JS | `123 kB` (down from `132 kB`) | `McqSubjectStrip` moved to RSC; `@tanstack/react-query` removed; `minisearch` & `lenis` deferred |
| `/geography` First Load JS | `135 kB` (down from `185 kB`) | Dynamic `@/lib/data` fallback, `next/dynamic` `GeographyScoreModal`, skipped initial Page 1 refetch |
| `/mcq` First Load JS | `128 kB` (down from `173 kB`) | Eliminated static `ContentRepository` JSON from `src/lib/api.ts` client imports |
| `/topics/[subject]/[topic]` First Load JS | `125 kB` (down from `171 kB`) | Lazy repository imports + SSR Page 1 reuse in `McqQuestionsPreviewList` |
| `public/data/v1/search-index/all.json` | `119.6 KB` (budget `<= 150 KB`) | Compact serialized index covering all 250 countries and site catalog items |
| `public/data/v1/geography/countries-quiz-v1.json` | `93.8 KB` (budget `<= 120 KB`) | Stripped quiz-only slice separate from full paginated reference cards |
| Automated test suite (`npm test`) | `11` files, `68` tests passing | Schemas, validator rules, pagination APIs, quiz engine, SEO, WCAG contrast, performance budgets |

> Note: Offline CLI Lighthouse emulation was not executed locally; run mobile Lighthouse checks directly against [`https://docmubashirchaudhry.vercel.app/`](https://docmubashirchaudhry.vercel.app/) after Vercel deployments complete.

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
npm run validate             # Enforce 15 Zod/FK/PDF integrity & duplicate-hash rules
npm run data:build           # Rebuild /public/data/v1/ slices, manifest.json & MiniSearch index
npm run data:sync-countries  # Sync 250 countries from open mledoze/countries snapshot
npm run data:pdf-manifest    # Inspect SHA-256 checksums & byte sizes in public/documents/
npm run check:links          # Check external commission & geodata source URLs
npm test                     # Execute Vitest suite (68 tests across 11 files)
npm run typecheck            # Run tsc --noEmit across application and tests
npm run lint                 # Run Next.js ESLint checks
npm run build                # Full pre-deploy pipeline: validate + data:build + next build
```

### Vercel Deployment

Importing `rajairfanahmed/docmubashirchaudhry` (`main` branch) into Vercel reads [`vercel.json`](vercel.json) (`framework: "nextjs"`, `installCommand: "npm ci"`, `buildCommand: "npm run build"`, 10s serverless maxDuration on `src/app/api/**/*.ts`). Because Vercel does not execute static `_headers` files for Next.js projects, CSP (`flagcdn.com`, `upload.wikimedia.org`, `img.logo.dev`), HSTS, `X-Frame-Options: DENY`, and cache headers are served from `headers()` in [`next.config.ts`](next.config.ts) alongside portable edge rules in [`public/_headers`](public/_headers). After deployment, inspect `/api/health` (`200 OK`) and `/status`.

---

<a name="contributing"></a>

## Contributing

Contributions covering official notice citations, MCQ explanations, solved booklet checksums, and UI/accessibility fixes follow GitHub's CI checks ([`.github/workflows/validate.yml`](.github/workflows/validate.yml)):

1. Fork or branch cleanly from `main`:

```bash
git checkout -b fix/short-descriptive-name
```

2. Keep changes factual and source-backed:
   - Cite every new recruitment or syllabus claim in [`src/data/sources.json`](src/data/sources.json).
   - Leave unverified notices at `verification.status: "unverified"` rather than marking secondary claims as verified.
   - Update `fileSizeBytes` and `sha256` whenever modifying PDFs (via `npm run data:pdf-manifest`).
3. Verify locally before staging:

```bash
npm run validate && npm run data:build && npm test && npm run typecheck
```

4. Stage **only intended files by name** (`git add .` and `git add -A` are prohibited so temporary caches, `.next*` directories, or local `.env` files never enter history):

```bash
git add src/data/questions/ppsc/general-knowledge.json src/data/sources.json
git commit -m "content(mcq): add verified source citation"
```

5. Open a Pull Request using [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). All contributors are expected to maintain constructive, evidence-first academic review aligned with standard Contributor Covenant norms. Optional repository ownership rules can be adapted from [`.github/CODEOWNERS.example`](.github/CODEOWNERS.example).

---

<a name="rights--security"></a>

## Rights & Security

### Educational Rights & Attribution

Per [Copyright & Attribution](src/app/copyright/page.tsx) (`/copyright`):

- **`author_original` booklets:** Compilations authored by Dr. Mubashir Chaudhry are free for individual candidates and educators with attribution preserved; commercial reselling or paywalling is prohibited.
- **`public_domain_official` / `cc_by_4` / `permission_granted` records:** Statutory notifications, UN/ISO country descriptors, and open geodata retain attribution to their respective issuing bodies and dataset creators.

### Reporting Bugs, Content Errata & Security Issues

- **Factual / syllabus errata:** Use `/corrections` on the live site or open a GitHub issue quoting the route URL and primary commission reference.
- **Security / credential hygiene:** Client bundles contain zero private API keys (only publishable image token config in [`.env.example`](.env.example)), zero authentication tokens, and zero analytics cookies. Never open public issues with sensitive environment credentials; email takedown or responsible disclosure notices to `copyright@docmubashirchaudhary.com`.
