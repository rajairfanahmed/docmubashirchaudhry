# System Architecture Specification (v3.0 Hybrid Architecture)

> Status: Implemented (v3.0 Backend Upgrade over Preserved v2.0 Static Layer)  
> Last updated: 2026-11-12  
> Supersedes: v2.0 "database-free, zero-login, no-admin-panel" restriction while keeping public reference routes database-free and open.

## 1. High-level topology
`docmubashirchaudhry` runs a hybrid Next.js 15 App Router architecture on Vercel:
- **Public Reference Layer (v2.0 Preserved):** `/` homepage, `/geography` reference guide, `/countries/*` (`250` countries & territories, `194` sovereign UN states), `/ppsc` / FPSC / CSS / PMS static text hubs, `/topics/*`, `/api/countries`, `/api/questions`, and `/data/v1/*.json` static bundles remain completely public, anonymous-friendly, and CDN-cached with zero database calls on anonymous page views.
- **Authenticated & Admin Platform Layer (v3.0 Upgrade):**
  - **Authentication & Sessions (`src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`):** Supabase Auth supports Google OAuth (`PKCE` via `/api/auth/oauth` -> `/api/auth/callback`) and email/password with email verification (`/api/auth/signup` -> `/api/auth/callback`). All tokens are stored strictly in `httpOnly`, `sameSite=lax`, `path=/` cookies managed on the server (`secure` enabled in production) rather than `localStorage`.
  - **Admin Authorization (`src/lib/auth/guards.ts`, `src/lib/env.ts`):** Single server-checked `ADMIN_EMAILS` allow-list (`isAdminEmail()`). Every `/admin/*` navigation and `/api/admin/*` route verifies both a live Supabase user session and membership in `ADMIN_EMAILS` on the server (failing closed with `401`, `403`, or `503` when misconfigured).
  - **Relational Data & Analytics (`supabase/migrations/0001_v3_initial_schema.sql`):** Supabase PostgreSQL stores `profiles`, `pdf_resources`, `pdf_access_log`, `quizzes`, `quiz_questions`, `quiz_attempts`, and `site_visits` behind strict Row Level Security (RLS).
  - **Private PDF Binary Storage (`src/lib/r2/client.ts`):** Cloudflare R2 private bucket (`docmubashirchaudhary`) stores watermarked study PDFs with zero public bucket exposure (`r2.dev` disabled). Admin uploads use presigned `PUT` URLs (up to `50 MB`, avoiding Vercel's `4.5 MB` serverless body limit). Student downloads check session, log to `pdf_access_log`, and redirect/return a short-lived signed `GET` URL (`180s` default, clamped `[120, 300]s`).

## 2. Core domain boundaries
- `src/lib/auth/guards.ts`: Request auth guards (`requireAuthenticatedUser`, `requireAdminUser`, `getOptionalSessionUser`), open-redirect sanitization (`sanitizeNextPath`), and proxy-aware origin resolution (`resolveRequestOrigin`).
- `src/lib/supabase/server.ts`: Server-only Supabase SSR client (`@supabase/ssr`), service-role admin client (`SUPABASE_SECRET_KEY`), cookie collector/applier (`applyAuthCookies`), and profile sync (`syncUserProfile`).
- `src/lib/r2/client.ts`: Cloudflare R2 S3 client (`@aws-sdk/client-s3` + `s3-request-presigner`) configured with `region: 'auto'`, `requestChecksumCalculation: 'WHEN_REQUIRED'`, `responseChecksumValidation: 'WHEN_REQUIRED'`, key traversal protection (`isSafePdfObjectKey`), `HeadObject` verification, signed uploads, signed downloads, and object deletion.
- `src/lib/v3/quiz-grading.ts`: Server-side grading engine supporting configurable negative marking (default `0.25` deduct per wrong answer), `practice` per-question instant checks, `mock` exam answer sealing until submit, bilingual (`en` / `ur` / `bilingual`) prompts, and RFC-4180 CSV question bank parser.
- `src/lib/v3/analytics.ts`: First-party aggregation helpers for 30-day daily visit series (`buildThirtyDayVisitSeries`), per-quiz pass rate / average / most-missed questions (`aggregateQuizAnalytics`), and top-downloaded PDF / active downloader rankings (`aggregatePdfAnalytics`).
- `src/lib/v3/rate-limit.ts` & `src/lib/v3/http.ts`: Sliding-window IP/user rate limiting (`checkRateLimit`), structured JSON error envelopes (`apiErrorResponse`), byte-limited JSON body parsing (`parseJsonWithSchema`), and error normalization.

## 3. Session & middleware performance guarantee
`src/middleware.ts` delegates to `updateSupabaseSession()` while skipping static assets via its `matcher`. Inside `updateSupabaseSession()`, any internal `x-dmc-user-id` / `x-dmc-is-admin` headers are stripped first, and external Supabase Auth network inspection only runs when:
1. The request targets `/admin*`, `/api/admin*`, `/api/me*`, `/api/pdfs/*`, or `/api/quizzes/*`; OR
2. The request already carries a Supabase auth cookie (`sb-*` or `*auth-token*`).

Anonymous traffic on `/`, `/geography`, `/countries/*`, and `/ppsc` incurs zero Supabase Auth latency.

## 4. Security, CSP, and Cloudflare WAF hardening
- **Content Security Policy (`next.config.ts` & `public/_headers`):** `connect-src` explicitly allows `'self' https://*.supabase.co https://*.r2.cloudflarestorage.com` alongside existing security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, strict `Permissions-Policy`, `Referrer-Policy`).
- **Two-Layer Anti-Piracy Defense for PDFs:**
  1. Owner watermarks are embedded inside every PDF prior to upload (`watermarkConfirmed: true` required on admin upload registration).
  2. Cloudflare R2 public URLs remain disabled; downloads require an active Supabase session and only receive `120s-300s` signed URLs with `Cache-Control: private, no-store`.
- **Cloudflare Edge WAF Rate-Limiting Rules (Dashboard Recommended Companion):** In addition to the in-app serverless limiter (`src/lib/v3/rate-limit.ts`), configure Cloudflare WAF rate-limiting rules on the production zone:
  - `/api/auth/*`: limit `30 requests / 5 min` per IP (`POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/oauth`).
  - `/api/pdfs/*/download`: limit `30 requests / 15 min` per IP to match the app-level sliding window and blunt distributed scraping.
  - `/api/analytics/visit`: limit `120 requests / 5 min` per IP.
- **No Secrets in Client Bundle:** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` use `NEXT_PUBLIC_`. `SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`, and all `CLOUDFLARE_R2_*` credentials remain server-only.

## 5. Preserved v2.0 architectural constraints
- The Countries module (`src/data/geography/countries.json`, `/countries/*`, `/api/countries`, and Geo-Quiz fallback) remains static-first and unchanged.
- All v2.0 validator checks (`npm run validate`), static `/public/data/v1/` artifacts (`npm run data:build`), and public SEO assets (`robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD) continue operating identically for anonymous visitors and crawlers.
