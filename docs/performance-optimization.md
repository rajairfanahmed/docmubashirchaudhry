# Performance Optimization Specification

> Core Web Vitals targets and asset/JS discipline adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 14, preserving all static payload budgets enforced in `tests/performance-budgets.test.ts`.
>
> **Measurement Rule:** Treat Core Web Vitals (`75th percentile` when field data is available) as engineering targets to measure and validate - never claim measured speed numbers without running a real trace or Lighthouse audit.

---

## 1. Core Web Vitals (p75 Targets) & Static Budgets

| Metric / Budget | Target | Enforcement Rule |
| --- | --- | --- |
| **LCP (p75)** | `<= 2.5 s` | Optimize first viewport cleanly: crisp editorial H1/search paint first, reserve explicit portrait `aspect-[4/5]` / `width` + `height` for `mubashirchaudhry1 (3).jpg` (`priority`), avoid hero entry animations that delay first paint. |
| **INP (p75)** | `<= 200 ms` | Debounce filters (`180-250ms`), keep mock countdown ticks isolated inside `<MockExamTimerBar />` leaf state (no parent re-render per second), keep MCQ option feedback CSS-first, defer `POST /api/analytics/visit` with `requestIdleCallback`. |
| **CLS (p75)** | `<= 0.1` (`<= 0.05` target) | Explicit image/SVG dimensions (`CountryCard` flags `40x27`, hero portrait, Logo.dev marks, PDF `480x640` thumbnails), fixed `min-h-[52px]` options, pre-reserved skeleton containers. |
| **Static JSON Payloads** | Audited limits | `search-index/all.json <= 150 KB`, `countries-quiz-v1.json <= 120 KB`, paginated country JSON `<= 25 KB/page`, paginated MCQ JSON `<= 10 KB/page`. |

---

## 2. JavaScript, Animation & Rendering Hygiene

1. **Proportionate Client JavaScript & Lazy Hydration:**
   - Keep RSC Server Components for static content and narrow `'use client'` boundaries strictly to interactive islands (`GeographyWorkbench`, `McqPracticeRunner`, `QuizSessionRunner`, filter toolbars).
   - Keep dynamic imports (`next/dynamic`) cleanly on dialogs/modals/summary panels (`GeographyScoreModal`, `McqSessionSummary`, `AuthModal`).
   - Prevent static `ContentRepository` and `MiniSearch` bundles from statically entering global layout chunks (`await import('@/lib/search')` on demand).
2. **Rendering & GPU Restraint:**
   - Avoid expensive large-surface `backdrop-filter: blur()`, stacked heavy `box-shadow` stacks, or full-page GPU filters across scrollable grids.
   - Never render or animate hundreds of cards simultaneously (`CountryCard` paginated `24/page`, `McqQuestionsPreviewList` `20/page`, single-question runner renders 1 active MCQ card at a time).
3. **Motion & Asset Pruning:**
   - Standardize React animations exclusively on `motion` `LazyMotion` (`domAnimation`), retiring `lenis` and `canvas-confetti`.
   - Load `Noto Nastaliq Urdu` (`200 KB+`) conditionally only inside Urdu/bilingual quiz routes (`/quizzes/[slug]`, `/mcq/practice`, `/admin/questions`).
   - Keep `src/components/admin/*` and `VisitTrendSvgChart` cleanly isolated inside `/admin/*`.

---

## 3. Storage Transfers, Fonts & Edge Caching

- **Direct Browser-to-R2 Transfers:** Request short-lived (`2-5 min`) presigned download grants strictly on click (never prefetch download URLs); stream admin PDF uploads (`<= 50 MB`) directly from browser to R2 via `upload-url`.
- **Fonts & Preconnects:** Retain `subsets: ['latin']`, `display: 'swap'`, `adjustFontFallback: true`, and `preconnect` hints to verified origins (`img.logo.dev`, `flagcdn.com`).
- **Static & Private Cache Alignment (`next.config.ts` & `public/_headers`):** Preserve immutable caching for `/images/*`, SVG icons, and `/data/v1/*`, while strictly serving auth, session, personal logs, quiz start/submit, download grants, and admin APIs with `Cache-Control: private, no-store`.
