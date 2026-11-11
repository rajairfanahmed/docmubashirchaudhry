# Performance Optimization Specification (Step 10 of 10)

> **Consumer Skill:** `10-performance-optimization` (Final Enhancement Phase - Run After Step 9 & Vercel Deploy)
> **Execution Status (2026-11-11):** Intentionally deferred until after GitHub push (`https://github.com/rajairfanahmed/docmubashirchaudhry.git`), Vercel deployment, and Steps 8-9 (`/seo`, `/accessibility`).
> **Scope:** Core Web Vitals budgets (`LCP`, `CLS`, `INP`, `FCP`), bundle splitting rules, progressive static JSON chunking, image/flag CLS prevention, font loading discipline, and HTTP cache alignment with `public/_headers` and `next.config.ts` `headers()`.
> **Architecture Reference:** Operates within static `/data/v1/` artifacts documented in [`frontend-architecture.md`](./frontend-architecture.md) and [`docs/backend/api-contract.md`](./backend/api-contract.md).

---

## 1. Core Web Vitals & Asset Budgets

Tuned explicitly for mid-tier Android phones (`Moto G / Redmi` class over 3G/4G Pakistani cellular connections):

| Metric | Target Budget | Measurement Focus Route(s) |
|---|---|---|
| **LCP (Largest Contentful Paint)** | `<= 1.8s` (hard ceiling `2.5s`) | `/` Hero `h1`/search card, `/ppsc/[slug]`, `/geography`, `/library` |
| **INP (Interaction to Next Paint)** | `<= 100ms` (hard ceiling `200ms`) | `/geography` A-Z filtering, MCQ option click lock, `/library` sorting |
| **CLS (Cumulative Layout Shift)** | `<= 0.03` (hard ceiling `0.10`) | Flag image loads, Explanation reveal, Search dropdown, Sticky mobile PDF bar |
| **FCP (First Contentful Paint)** | `<= 1.2s` | All SSR / SSG shell routes |
| **Initial JS Payload (Compressed)** | `<= 115 KB` on `/`; `<= 160 KB` on `/geography` & `/search` | Route-level bundle audit (`next build`) |
| **Static JSON Network Payload** | `search-index/all.json <= 150 KB` (currently `30.6 KB`); `countries-quiz-v1.json <= 120 KB` | Deferred until interaction or isolated per route |

---

## 2. Server Rendering, Code Splitting & Lazy Data Loading

1. **Server-First Pages:** Keep `/`, `/exams`, `/ppsc/[slug]`, `/ppsc/[slug]/blueprint`, `/geography/[slug]`, `/geography/continent/[slug]`, `/topics/[subject]/[topic]`, `/library/resource/[slug]`, and all info pages rendered statically/server-side so zero massive client JSON waterfalls block HTML paint.
2. **Route-Level Code Splitting:**
   - Isolate heavy interactive engines (`GeographyQuizModule`, `ScoreModal` confetti, MiniSearch engine, `/mcq/practice` runner) behind client components or `next/dynamic` boundaries ONLY where deferred:
     - `ScoreModal` dynamically imported when quiz completes (`ssr: false`): candidates don't pay modal bundle cost before answering Q1!
     - MiniSearch (`/data/v1/search-index/all.json`, `minisearch` package) dynamically imported cleanly on first `HeroSearch` / `NavbarSearch` focus or `/search` route load.
3. **Paginated Quiz & Country Slice Separation:**
   - `/geography` consumes `/api/countries` + lightweight `/data/v1/geography/pages/page-{n}.json` & `/data/v1/geography/countries-quiz-v1.json` for Tier 1 & Tier 2 separation rather than rendering all 250 `CountryCard` DOM trees simultaneously.
   - Pagination cap (`24` `CountryCard` items per page in Tier 1 Reference across `11` pages of `250` items, and capped `<= 2` currencies / `<= 3` languages per card) limits DOM node count cleanly on mobile for sub-50ms filter updates; MCQ lists paginate at `20` items/page via `/api/questions` + `/data/v1/questions/pages/page-{n}.json`.
4. **Search Input Debouncing:** Debounce live MiniSearch queries by `120ms - 150ms` during rapid typing so keystrokes stay silky (`INP < 50ms`).

---

## 3. Image, Flag, Authority Logo & Font Optimization

1. **Official Commission Logos (`Logo.dev` CDN with Instant Fallback Monograms):**
   - Load commission emblems via `Logo.dev` URLs from `branding.json` / `exams.json` (`size=128&format=png&fallback=404`, allowed cleanly in `public/_headers` `img-src https://img.logo.dev` and `next.config.ts`) with fixed container sizes (`width={48} height={48}`, `decoding="async"`) and immediate `onError` swap to lightweight CSS `fallbackMonogram` pills (avoiding broken image layout shift for 404 domains `KPPSC`/`BPSC`).
2. **Country Flags (`CountryCard` & `/geography/[slug]`):**
   - **Mandatory Explicit Dimensions:** Set exact `width={40} height={27}` (or `aspect-[3/2]` container + `width`/`height` attributes) on every flag image so remote loads from `flagcdn.com` cause **0.000 CLS**.
   - **Loading Priority:** Above-the-fold featured teaser/country profile flag carries `loading="eager"` + `fetchPriority="high"`; Tier 1 paginated country grid cards beyond first 6 items carry `loading="lazy"` + `decoding="async"`.
   - Use static `next/image` unoptimized SVG bypass cleanly (`unoptimized` where vector `.svg` from `flagcdn.com` is used, preventing pointless raster proxy hops).
3. **Fonts (`next/font/google`):**
   - Self-hosted via Next font optimization (`Plus Jakarta Sans` + `Inter`), subsets `['latin']` only, exact needed weights (`Plus Jakarta Sans`: `['600', '700', '800']`; `Inter`: `['400', '500', '600']`), `display: 'swap'`, `adjustFontFallback: true` to minimize font-swap text shift.
4. **PDF Downloads (`/documents/**/*.pdf`):**
   - Never prefetch binary `.pdf` files (`prefetch={false}` on PDF `<Link>` or native `<a download>`) so cellular users don't accidentally download 5 MB booklets while hovering/scrolling!

---

## 4. Static Asset Caching & HTTP Headers Alignment (`public/_headers`)

Respect and align strictly with existing Cloudflare/static edge cache rules already in `public/_headers`:
- `/data/v1/*`: Cacheable static JSON with clean ETag/CDN caching (`max-age` + `stale-while-revalidate`) anchored by `manifest.datasetVersion`.
- `/documents/*`: Long-lived immutable PDF cache header (`Content-Type: application/pdf`, `X-Content-Type-Options: nosniff`).
- `/api/countries` & `/api/questions`: Route handlers return `Cache-Control: public, max-age=300, stale-while-revalidate=3600` (`fetchCountriesPage` / `fetchQuestionsPage` fall back to static `/data/v1/{geography,questions}/pages/`).
- `Content-Security-Policy` (`public/_headers`) already permits `img-src 'self' data: https://flagcdn.com https://upload.wikimedia.org https://img.logo.dev` so `Logo.dev` commission crests and FlagCDN country/subject flags render without CSP violations.

---

## 5. Animation & Main-Thread Safeguards

- Strict compositor-only motion (`transform`, `opacity` per [`animations-motion-design.md`](./animations-motion-design.md)) keeps frame budgets `< 16ms` (60fps) on low-end GPUs.
- Confetti burst in `ScoreModal` limited to `<= 28` elements / CSS transforms or `1400ms` duration, unmounted immediately afterward.
- `StickyMobileDownloadBar` uses pure CSS `position: fixed` without scroll event listeners polling layout geometry (`getBoundingClientRect` inside `scroll` forbidden).

---

## 6. Verification Targets Before Completion

In Step 10 QA audit:
1. Run `npm run build` and inspect `.next` route client bundle sizes confirming homepage initial First Load JS stays tight within budget.
2. Run Lighthouse mobile emulation on `/`, `/geography`, `/ppsc/intelligent-officer`, and `/library/resource/intelligence-officer-bs-14-set-01`: target **Performance >= 95**, **Accessibility >= 95**, **Best Practices >= 95**, **SEO >= 95**, **CLS <= 0.03**.

---

## 7. Backend Integration Points

- **Pre-Serialized Search Index (`/data/v1/search-index/all.json`):** Generated cleanly at build time by `scripts/build-static-data.ts` (`30.6 KB` in current snapshot), eliminating runtime MiniSearch indexing CPU spikes on mobile page load.
- **Deterministic Data Versioning (`/data/v1/manifest.json`):** `datasetVersion` validates client `localStorage` caches and guarantees browsers never mix old `v1` schemas with updated static JSON builds.
- **PDF File Integrity Pre-Computed (`pdfs.json`):** `fileSizeBytes` and `pageCount` are pre-stored in JSON metadata so UI displays exact download sizes upfront without issuing `HEAD` network requests!
