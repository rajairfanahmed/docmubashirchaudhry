# SEO & Discoverability Specification (Step 8 of 10)

> **Consumer Skill:** `08-seo` (Enhancement Phase - Complete)
> **Execution Status (2026-11-11):** Step 8 (`/seo`) completed against live deployment URL `https://docmubashirchaudhry.vercel.app/`. `DEFAULT_SITE_URL` in `src/lib/seo/metadata.ts`, `.env.example`, `src/data/sources.json`, `public/llms.txt`, single-pipe App Router `<title>` templates, `viewport` export (`src/app/layout.tsx`), truthful 0-capital/unverified territory metadata, accurate `/geography` `Quiz` fact count, `SubjectIconChip` & country flag image dimensions/alt attributes, `CollectionPage` + `ItemList` JSON-LD on hub/collection routes, and unified `/api/` `robots.ts` disallow rules are all implemented and verified. Proceed next to Steps 9 (`/accessibility`) and 10 (`/performance-optimization`).
> **Scope:** Per-route HTML semantics, dynamic `<title>`/description metadata, canonical consolidation (`/countries` -> `/geography`), Schema.org JSON-LD structured data, dynamic `sitemap.ts`, `robots.txt`, and AI discoverability (`llms.txt`).
> **Site Domain Baseline:** `https://docmubashirchaudhry.vercel.app` (fallback default and Vercel deployment origin; overridden dynamically by env vars via `resolveSiteUrl()`).

---

## 1. Semantic HTML & Document Structure Rules

- Exactly one `<h1>` per route (`display-hero` on `/`, `page-title` on interior routes). Never skip heading levels (`h1` -> `h2` -> `h3`; e.g., replace arbitrary `<h6>` tags like `ExplanationBox` heading with `<h3>` or styled `<p>` inside `<section>` so outlines remain continuous).
- Landmark discipline on every route:
  - `<header>` wrapping top navbar + accessible mobile drawer.
  - `<nav aria-label="Breadcrumb">` inside `<main>` (never duplicated inside `<header>`) on every nested route.
  - `<main id="main-content">` strictly unique per document.
  - `<footer>` (`#051C0E`) wrapping persistent portal links and trust disclaimers.

---

## 2. Page Metadata & Canonical Matrix

Every App Router page MUST implement explicit static `metadata` or dynamic `generateMetadata()` using `metadataBase: new URL(resolveSiteUrl())` (defaulting to `https://docmubashirchaudhry.vercel.app`):

| Route | Title Template | Indexing & Canonical Rule |
|---|---|---|
| `/` | `docmubashirchaudhry \| Free PPSC, CSS/PMS, Geography Quiz & Solved PDFs` | `index, follow`; Canonical `/` |
| `/geography` | `World Geography Reference & Interactive Quiz \| docmubashirchaudhry` | `index, follow`; Canonical `/geography` (query-filtered and paginated states `?continent=&letter=&page=` canonicalize back to `/geography` to prevent parameter bloat while keeping all `/geography/[slug]` country profiles individually indexed) |
| `/countries` | *(Redirected via `permanentRedirect('/geography')`)* | `308 Permanent Redirect`; omit from `sitemap.xml` |
| `/geography/continent/[slug]` | `{Continent} Countries, Capitals & Currencies \| docmubashirchaudhry` | `index, follow`; Canonical `/geography/continent/{slug}` |
| `/geography/[slug]` | `{Country}: Capital, Currency & Languages Facts \| docmubashirchaudhry` | `index, follow`; Canonical `/geography/{slug}` |
| `/exams`, `/exams/[slug]` | `{Commission Name} Exam Hub & Resources \| docmubashirchaudhry` | `index, follow` for published exams (`ppsc`), `noindex, follow` (until published) or clear non-indexed draft guard where zero posts exist |
| `/ppsc` | `PPSC Past Papers, Recruitment Posts & Syllabus Hub \| docmubashirchaudhry` | `index, follow`; Canonical `/ppsc` (ignore `?status=` duplicate indexing) |
| `/ppsc/[slug]` | `{Post Title} ({BasicScale}) Solved MCQ PDFs \| docmubashirchaudhry` | `index, follow`; Canonical `/ppsc/{slug}`. Meta description accurately reflects currently provided downloadable PDF booklets and `basicScale` (`BS-14`, `BS-16`), omitting unprovided blueprint/pattern claims |
| `/ppsc/[slug]/blueprint` | *(Deprecated / redirected to `/ppsc/[slug]` while blueprints are unprovided)* | `noindex, follow` or redirect -> `/ppsc/{slug}` |
| `/css-pms`, `/css-pms/[track]`, `/fpsc`, `/nts` | `{Body} Exam Preparation Hub \| docmubashirchaudhry` | Set `robots: { index: false, follow: true }` cleanly on hubs currently rendering honest empty-state cards (no fake category/track lists), flipping to `index: true` once published PDFs/posts appear |
| `/mcq` & `/mcq/practice` | `MCQ Practice Launchpad` / `Interactive MCQ Session \| docmubashirchaudhry` | `/mcq` `index, follow`; `/mcq/practice` `noindex, follow` (ephemeral query-parameter session runner) |
| `/topics/[subject]/[topic]` | `{Topic} Solved MCQs & Study PDFs \| docmubashirchaudhry` | `index, follow` when `questionCount > 0` or related PDFs > 0 |
| `/library` & `/library/[exam]` | `Free Solved Exam PDFs & Study Booklets \| docmubashirchaudhry` | Canonical `/library` or `/library/{exam}` |
| `/library/resource/[slug]` | `{Pdf Title} ({FileSize}) Free PDF Download \| docmubashirchaudhry` | `index, follow`; Canonical `/library/resource/{slug}` |
| `/search` | `Search Study Notes, Countries & PDFs \| docmubashirchaudhry` | `robots: { index: false, follow: true }` (standard Google Search Quality rule against indexing internal site-search result pages) |
| `/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/accessibility`, `/status` | `{Page Title} \| docmubashirchaudhry` | `index, follow`; `/status` dynamically states live `manifest.datasetVersion` |

---

## 3. Open Graph, Twitter Cards & Schema.org JSON-LD

- **Social Meta:** Provide complete `openGraph` (`title`, `description`, `url`, `siteName`, `type: 'website' | 'article'`, `images`) and `twitter` (`card: 'summary_large_image'`). Avoid broken OG image links: ensure a static verified `/public/images/og-default.png` exists or fallback cleanly to verified commission/brand image.
- **Structured Data (`application/ld+json` rendered server-side cleanly):**
  1. **Root `/` (`src/app/layout.tsx` / `page.tsx`):** `EducationalOrganization` + `WebSite` with `SearchAction` (`target: 'https://docmubashirchaudhry.vercel.app/search?q={search_term_string}'`).
  2. **Nested Routes:** `BreadcrumbList` synced dynamically with the rendered `<Breadcrumbs />` array on every nested page.
  3. **`/geography` & `/mcq/practice`:** `Quiz` + `LearningResource` (`isAccessibleForFree: true`, `educationalUse: 'assessment'`, `inLanguage: 'en'`, with `/geography` `numberOfQuestions` set from exact verified/non-disputed non-empty country facts).
  4. **`/geography/[slug]`:** `Country` / `DefinedTermSet` educational profile linking official source citations.
  5. **`/library/resource/[slug]`:** `DigitalDocument` (`name`, `author`, `encodingFormat: 'application/pdf'`, `contentSize`, `license` or copyright attribution note, `dateModified: verification.lastCheckedAt`). Never emit `Archived` PDFs as `inStock` primary results without `expires`/note metadata.
  6. **Hub & Collection Routes (`/exams`, `/exams/[slug]`, `/ppsc`, `/library`, `/library/[exam]`, `/mcq`, `/geography/continent/[slug]`):** `CollectionPage` + `ItemList` via `buildCollectionPageSchema()` matching the rendered published entities.

---

## 4. `sitemap.ts`, `robots.txt` & AI Discoverability (`llms.txt`)

- **`src/app/sitemap.ts` (Dynamic Next.js Sitemap Generator):**
  - Dynamically enumerates from `ContentRepository`:
    - Static core pages (`/`, `/exams`, `/ppsc`, `/mcq`, `/geography`, `/library`, `/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/accessibility`, `/status`).
    - All published/active commissions (`/exams/[slug]`), PPSC posts (`/ppsc/[slug]`), topics (`/topics/[subject]/[topic]` with real questions or PDFs), continent hubs (`/geography/continent/[slug]`), country profiles (`/geography/[slug]` across all `250` country & territory profiles), and published PDF resources (`/library/resource/[slug]`, `/library/[exam]` with `pdfs.length > 0`).
  - Excludes `/countries`, `/search`, `/mcq/practice`, `/ppsc/[slug]/blueprint`, and empty commission hubs (`fpsc`, `css-pms`, `nts`).
  - Sets real `lastModified` dates derived from `verification.lastCheckedAt` or `manifest.generatedAt` (never hardcoded dummy timestamps).
- **`src/app/robots.ts` / `public/robots.txt`:**
  - Allows crawling across `/`, `/geography`, `/ppsc`, `/library`, `/topics`, `/data/v1/*.json` while uniformly disallowing `/api/` across wildcard and AI crawler rules; references `Sitemap: https://docmubashirchaudhry.vercel.app/sitemap.xml`.
- **AI Search Discoverability (`public/llms.txt`):**
  - Plain markdown manifest at `/llms.txt` summarizing platform scope, explicit commission non-affiliation disclaimer, canonical URL templates (`/geography/{slug}`, `/library/resource/{slug}`, `/ppsc/{slug}`), and links to machine-readable public JSON endpoints under `/data/v1/manifest.json`.
- **Google Search Console Site Verification (`src/app/layout.tsx`):**
  - Root `metadata.verification.google` emits `<meta name="google-site-verification" content="cyPaDLlCl9e3xk1KzdznBwXvizColXpowGUNSc2M4Ws" />` sitewide in `<head>`.

---

## 5. Backend Integration Points

- `src/app/sitemap.ts` and `generateMetadata()` read directly via server `ContentRepository` (`getExams()`, `getRecruitmentPosts('ppsc', undefined)`, `getCountries()`, `getGeographyReference()`, `getPdfResources()`, and `src/data/taxonomy/topics.json`).
- Search Console/Schema `dateModified` pulls from `VerificationSchema.lastCheckedAt` (`src/lib/schemas/common.ts`) and `/data/v1/manifest.json` (`generatedAt`).
- `/ppsc/[slug]` metadata derives directly from downloadable `PdfResource` booklets linked via `postId` (no unprovided syllabus/blueprint claims).
- Empty hubs (`fpsc` `status: "draft"`, `css-pms`, `nts`) automatically carry `robots: noindex, follow` until `getExams()`/`getPdfResources()` returns active published entities, avoiding Thin Content penalties.

