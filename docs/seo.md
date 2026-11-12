# SEO, Indexation & Content Integrity Specification

> Metadata, indexation, crawlability, structured data, and editorial factual integrity standards adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 15 alongside preserved `v3.0` SEO requirements.

---

## 1. Metadata, Canonicals & Content Integrity Rules

- **Root Title & Tagline:** Preserve `"docmubashirchaudhry | PPSC, FPSC & Competitive Exam Preparation"` and the verbatim v3.0 meta description (`"Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants."`).
- **Single Meaningful `<h1>` & Heading Order:** Every route renders one descriptive `<h1>` paired with logical sequential `<h2>`–`<h4>` subheadings.
- **Descriptive Crawlable Links:** Use explicit destination text (`"Start Geography Quiz"`, `"View Post & Download PDF"`, `"Explore Quizzes & Mocks"`) - avoid ambiguous links like `"Start"` or `"Click here"`.
- **Factual & Editorial Integrity (Strict Zero-Fabrication Rule):**
  - Never invent exam dates, commission rules, official vacancy counts, question totals, download metrics, source citations, or educator credentials to fill visual slots.
  - Preserve provenance references, official portal attributions, verification status labels (`verified`, `unverified`, `disputed`, `archived`), and the meaning of all academic/legal disclosures - improve readability and spacing without rewriting factual statements into marketing hype.
- **Honest Structured Data (`JSON-LD`):** Render `EducationalOrganization`, `WebSite`, `Person` (Doc Mubashir Chaudhry), `CollectionPage`, `BreadcrumbList`, and `DigitalDocument` / `Book` schemas **strictly matching live content present on the route**.

---

## 2. Preserved Route Indexation Matrix

| Route Group | Robots Directive | Sitemap & Canonical Rules |
| --- | --- | --- |
| **Public Hubs & Reference Pages** (`/`, `/geography`, `/geography/[slug]`, `/geography/continent/[slug]`, `/exams`, `/exams/[slug]`, `/ppsc`, `/ppsc/[slug]`, `/library`, `/library/[exam]`, `/library/resource/[slug]`, `/topics/[subject]/[topic]`, `/quizzes`, `/mcq`, `/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/accessibility`, `/status`) | `index: true, follow: true` (when populated) | Self-canonical HTTPS URLs resolved via `NEXT_PUBLIC_SITE_URL` -> `SITE_CANONICAL_URL` -> `https://docmubashirchaudhry.vercel.app`; included in `src/app/sitemap.ts` |
| **Interactive Runners & Search** (`/quizzes/[slug]`, `/mcq/practice`, `/search`, pending empty hubs until populated) | `index: false, follow: true` | Excluded from `sitemap.ts`; keeps crawl links flowing cleanly to hub/catalog pages |
| **Private Account & Admin Console** (`/my-attempts`, `/my-downloads`, `/admin`, `/admin/*`) | `index: false, follow: false` | Excluded from `sitemap.ts` and disallowed in `src/app/robots.ts` (`disallow: ['/api/', '/admin/', '/my-attempts', '/my-downloads']`) |
| **Legacy Redirects** (`/countries`, `/ppsc/[slug]/blueprint`, `/css-pms/[track]`) | HTTP `308` Permanent Redirect | Preserves bookmark and link equity cleanly without duplicate indexation |

---

## 3. Agentic Discoverability (`public/llms.txt`)

- Maintain `# docmubashirchaudhry Learning Portal` top-level H1 heading with curated, valid public HTTPS links (`/geography`, `/ppsc`, `/library`, `/quizzes`) explaining scoped access transparently, while excluding `/admin`, `/my-attempts`, `/my-downloads`, and `/api/*`.
