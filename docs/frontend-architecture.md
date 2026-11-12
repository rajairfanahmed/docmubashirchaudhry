# Frontend Architecture Specification

> Next.js 15 App Router frontend architecture governance adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Sections 0, 13, and 16. Preserves all `37` routes, Supabase Auth, Postgres RLS/contracts, Cloudflare R2 storage flows, and static/dynamic rendering boundaries.

---

## 1. Non-Negotiable Architecture & Preservation Rules

1. **Preserve Existing Backend, Auth & Data Models:**
   - Do **not** alter Supabase Auth httpOnly JWT middleware (`src/middleware.ts`), admin email allow-list verification, Postgres schema, Cloudflare R2 presigned URL contracts (`src/lib/r2/client.ts`), quiz scoring rules (`practice` instant check vs sealed `mock` submission), or PDF access logging (`pdf_access_log`).
   - Do **not** alter existing static datasets (`public/data/v1/*`, `ContentRepository`), `ContentLanguage` (`en` / `ur` / `bilingual`), `localStorage` fallback keys (`src/lib/storage/persistence.ts`), redirects (`/countries`, `/ppsc/[slug]/blueprint`, `/css-pms/[track]`), or URL query params / `#quiz-module` hash routes.
2. **Separation of Concerns:** Keep business rules, Zod validation, formatting, and API wrappers inside `src/lib/*`; keep presentational UI and route compositions inside `src/components/*` and `src/app/*`.
3. **Server-First Boundary Discipline:** Keep RSC static/SSR routes (`src/app/geography/**`, `src/app/ppsc/**`, `src/app/library/resource/[slug]`, `src/app/about`, `src/app/page.tsx`) as Server Components importing `'use client'` interactive islands cleanly at leaf boundaries - never mark entire route trees `'use client'`.
4. **Prevent Admin Code Bleed:** Keep all `src/components/admin/*` imports strictly inside `src/app/admin/**` behind `src/app/admin/layout.tsx` (`force-dynamic`) and `RouteChromeGate`.

---

## 2. CSS, Token & Dependency Discipline

### Single-Source Tokens & Clean CSS
- Centralize all color (`--color-*` / mapped `--dmc-*`), typography, spacing, radius, elevation, z-index, and motion tokens in `src/app/globals.css` + `src/lib/tokens/visual-tokens.ts`.
- Use semantic token names (`--color-page`, `--color-surface`, `--color-ink`, `--color-brand-deep`, `--color-accent`, `--color-action`) rather than one-off inline hexes inside components.
- Migrate all active usages cleanly **before** deleting deprecated `--dmc-*` declarations so zero broken CSS variables occur during phased rollouts.
- Avoid `!important` styling overrides and unnecessary one-off inline `style={}` rules.

### Package & Library Rules (`package.json`)
- Inspect `package.json` before adding any package; avoid installing heavy third-party UI kits (e.g., MUI, Ant Design, Chakra) or duplicate animation/charting libraries.
- Standardize icons exclusively on `lucide-react` (`^0.475.0`) and React state/presence motion exclusively on `motion` (`motion/react` `^14.12.0`).
- Remove legacy `lenis` (`SmoothScrollProvider`) and `canvas-confetti` dependencies once replaced cleanly per [`animations-motion-design.md`](./animations-motion-design.md).
- Avoid design-system fragmentation: establish shared primitives (`Button`, `Input`, `Badge`, `Modal`, `PaginationBar`) rather than building route-specific one-off variants.

---

## 3. Preserved Application Route Tree (`37` Routes + System Fallbacks)

| Route Group | Routes (`src/app/`) | Rendering & Access Policy |
| --- | --- | --- |
| **Home & Search** | `/`, `/search` | Open SSR; homepage uses light-first editorial hero + real DB/static counts |
| **World Geography** | `/geography`, `/geography/[slug]`, `/geography/continent/[slug]`, `/countries` (`308` -> `/geography`) | Open SSG + Client Filter/Quiz (`localStorage` fallback preserved) |
| **Exam Commission Hubs** | `/exams`, `/exams/[slug]`, `/ppsc`, `/ppsc/[slug]`, `/ppsc/[slug]/blueprint` (`308` -> `/ppsc/[slug]`), `/fpsc`, `/css-pms`, `/css-pms/[track]` (`308` -> `/css-pms`), `/nts`, `/topics/[subject]/[topic]` | Open SSG reference & syllabus blueprints; explicit `EmptyStateCard` where posts are pending |
| **MCQ & Quizzes** | `/mcq`, `/mcq/practice`, `/quizzes`, `/quizzes/[slug]` | `/mcq` & `/quizzes` browse open; quiz start gated via `AuthModal` with action resumption; `/quizzes/[slug]` dynamic SSR + bilingual RTL font loader |
| **PDF Study Library** | `/library`, `/library/[exam]`, `/library/resource/[slug]` | Catalog & SHA-256 detail open; downloads gated via `GatedPdfDownloadButton` issuing 2–5 min signed R2 URLs |
| **Private Student Account** | `/my-attempts`, `/my-downloads` | Client-auth gated private histories (`noindex, nofollow`) |
| **Editorial & System Pages** | `/about`, `/methodology`, `/corrections`, `/copyright`, `/accessibility`, `/privacy`, `/status` | Open SSG / live manifest health (`privacy` includes confirmed local storage clearing) |
| **Isolated Admin Console** | `/admin`, `/admin/users`, `/admin/quizzes`, `/admin/questions`, `/admin/pdfs` | `force-dynamic`, allow-list verified on server, isolated via `RouteChromeGate` + `AdminShell` (`noindex, nofollow`) |
| **Fallbacks & Crawler Meta** | `/error.tsx`, `/not-found.tsx`, `robots.ts`, `sitemap.ts` | Calm recovery without stack leaks; preserved SEO & exclusion rules |

---

## 4. Provider Hierarchy & Client Data Flow (`src/app/providers.tsx`, `src/lib/v3/client.ts`)

- Root `Providers` mounts `<MotionConfig reducedMotion="user">` -> `<LazyMotion features={domAnimation}>` -> `<AuthSessionProvider>` -> `<ToastProvider>` -> `<AuthModalProvider>` -> `<VisitTracker />` -> `<TopLoadingBar />` (removing `SmoothScrollProvider` / `lenis`).
- Keep typed API clients (`v3Api`) in `src/lib/v3/client.ts` returning structured errors (`V3ClientError`) consumed consistently across public and admin workflows.
