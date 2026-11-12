# Backend Implementation Plan (v3.0 Upgrade)

> Status: Code & Mocked Verification Complete (Awaiting Owner Supabase/R2 Dashboard Provisioning)  
> Last updated: 2026-11-12

## 1. Completed backend engineering phases
- [x] **Phase 1 - Environment & CSP Alignment (`.env.local`, `.env.example`, `src/lib/env.ts`, `next.config.ts`, `public/_headers`):** Standardized Supabase/R2/Admin environment variables, added Zod runtime validators, clamped signed R2 URL TTL to `[120, 300]` seconds, and updated CSP `connect-src` for Supabase Auth and Cloudflare R2 presigned uploads.
- [x] **Phase 2 - PostgreSQL Schema, Triggers & RLS (`supabase/migrations/0001_v3_initial_schema.sql`, `src/lib/supabase/database.types.ts`):** Created tables (`profiles`, `pdf_resources`, `pdf_access_log`, `quizzes`, `quiz_questions`, `quiz_attempts`, `site_visits`), auth signup trigger (`handle_new_auth_user`), download counter trigger (`increment_pdf_download_count`), RLS policies, and analytics retention RPC (`prune_v3_analytics_logs`).
- [x] **Phase 3 - Auth, Session Middleware & Admin Guard (`src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/lib/auth/guards.ts`, `src/app/api/auth/*`):** Implemented `httpOnly` cookie session handling for email/password + verification and Google OAuth PKCE, conditional session refresh skipping anonymous public routes, and server-side `ADMIN_EMAILS` allow-list enforcement.
- [x] **Phase 4 - Private Cloudflare R2 Storage & Gated Downloads (`src/lib/r2/client.ts`, `src/app/api/pdfs/*`, `src/app/api/admin/pdfs/*`):** Implemented direct-to-R2 presigned upload (`<= 50 MB`), R2 `HeadObject` + `application/pdf` MIME check on metadata registration, authenticated short-lived download URL generation (`180s` default), and `pdf_access_log` recording.
- [x] **Phase 5 - Quizzes, Mock Exams, User History & Admin Analytics (`src/lib/v3/*`, `src/app/api/quizzes/*`, `src/app/api/me/*`, `src/app/api/analytics/visit`, `src/app/api/admin/{quizzes,questions,analytics}/*`):** Built bilingual MCQ handling, server-side negative-marking scorer, mock answer sealing, CSV/JSON bulk import (`1..500`), private student history endpoints, and admin analytics + retention pruning routes.
- [x] **Phase 6 - Automated Verification (`tests/v3-backend.test.ts`, `tests/v3-route-auth-and-contracts.test.ts`):** Added unit and mocked route contract suites alongside existing v2.0 suites (`84/84` Vitest tests, `npm run validate`, `npm run typecheck`, isolated `next build`).

## 2. Owner provisioning checklist (Before frontend integration & live deploy)
1. **Supply Missing `.env.local` Values:** Fill `NEXT_PUBLIC_SUPABASE_URL` (from Supabase Project Settings -> Data API) and `ADMIN_EMAILS` (owner email allow-list). Copy all finalized variables from `.env.local` into Vercel Project Environment Variables.
2. **Apply Database Migration:** Run `supabase/migrations/0001_v3_initial_schema.sql` once in the Supabase SQL Editor.
3. **Configure Supabase Auth Redirects & Providers:**
   - Enable **Google OAuth** and **Email (with Confirm Email)** in Supabase Authentication -> Providers.
   - Add Redirect URLs:
     - `https://docmubashirchaudhry.vercel.app/api/auth/callback`
     - `http://localhost:3000/api/auth/callback`
4. **Secure Cloudflare R2 Bucket (`docmubashirchaudhary`) & Edge WAF:**
   - Ensure `Public R2.dev Subdomain Access` is **disabled** so no direct public object URL exists.
   - Add bucket CORS policy permitting `PUT`/`HEAD` from `https://docmubashirchaudhry.vercel.app` and `http://localhost:3000` (with `AllowedHeaders: ["content-type"]`).
   - Add Cloudflare Edge WAF rate-limiting rules for `/api/auth/*`, `/api/pdfs/*/download`, and `/api/analytics/visit`.
5. **Frontend Integration Handoff:** Hand API contracts (`docs/backend/api-contract.md`) to design-engineer for login modals (triggered at quiz start / PDF download), quiz timer UI, private student dashboard, and `/admin` dashboard pages.
