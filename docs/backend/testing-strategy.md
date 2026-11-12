# Backend Testing Strategy (v2.0 + v3.0)

> Status: Executed & Passing (13 Vitest Suites, 84/84 Tests + Dataset Validation + TypeScript Check)  
> Last updated: 2026-11-12

## 1. Quality goals
Verify zero regression across the preserved v2.0 static catalog (`250` countries, Geography quiz, SEO/A11y/performance invariants) while validating every v3.0 security boundary, signed URL TTL clamp, quiz negative-marking scorer, CSV bank parser, analytics aggregator, fail-closed middleware behavior, and route-level authorization (`401`/`403`/`400`/`429`).

## 2. Test environment & mocking boundaries
- **Runner:** Vitest (`npm test`) running offline in Node without mutating `src/data/` or hitting live Supabase/Cloudflare R2 APIs.
- **v3.0 Route Contract Mocks (`tests/v3-route-auth-and-contracts.test.ts`):** Mocks `@/lib/auth/guards`, `@/lib/r2/client`, and `@/lib/supabase/server` (`createSupabaseAdminClient`) using synthetic in-memory state (`mockState`) so every route handler executes real Zod validation, rate limits, cookie application, grading logic, and response shapes deterministically offline.

## 3. Verification layers
| Layer | Tools | Scope | Command |
|---|---|---|---|
| Data & PDF Integrity CLI | `tsx` + Zod + crypto | All 15 v2.0 data integrity rules on `src/data/` and `public/documents/` | `npm run validate` |
| Static Artifact Build | `tsx` + MiniSearch | Builds `/public/data/v1/` bundles, `manifest.json`, and search index | `npm run data:build` |
| Unit & Route Contract Suite | `vitest` | `11` v2.0 suites (`68` tests) + `v3-backend.test.ts` (`9` tests) + `v3-route-auth-and-contracts.test.ts` (`7` tests) = `84` tests | `npm test` |
| Type Safety | `tsc` | Full Next.js + Supabase + R2 backend type check (`strict: true`) | `npm run typecheck` |
| Production Bundle | `next build` | Compiles all static pages plus all v2.0 & v3.0 API routes cleanly | `NEXT_DIST_DIR=".next-verify" npm run build` |

## 4. Key v3.0 scenarios verified in automated tests
- **Environment & Fail-Closed Admin Allow-List (`tests/v3-backend.test.ts`):** Clamping `CLOUDFLARE_R2_SIGNED_URL_TTL_SECONDS` into `[120, 300]`, fail-closed `isAdminEmail` on blank/malformed/case-mismatched lists, safe R2 key validation (`pdfs/...`), and open-redirect sanitization (`sanitizeNextPath` rejecting `//evil.com`, `https://evil.com`).
- **Quiz Engine, CSV Parser & Analytics (`tests/v3-backend.test.ts`):** `stripQuestionSecrets()` removing `correct_option` & `explanation`, fractional negative marking (`-0.25` deduct per incorrect answer), RFC-4180 CSV question parsing (including commas inside quotes), 30-day UTC visit series, and quiz/PDF analytics ranking.
- **Auth Gating & Mock Sealing (`tests/v3-route-auth-and-contracts.test.ts`):**
  - Anonymous requests receive `401` on `/api/pdfs/[id]/download`, `/api/quizzes/[id]/start`, `/api/quizzes/[id]/submit`, `/api/me/attempts`, `/api/admin/pdfs/upload-url`, and `/api/admin/analytics/overview`.
  - Logged-in student requests receive `403` on `/api/admin/pdfs/upload-url`, `/api/admin/analytics/overview`, and `/api/quizzes/[id]/check-answer` when quiz `type === 'mock'`.
  - Private signed R2 URL (`X-Amz-Expires=180`) + `pdf_access_log` write + `Cache-Control: private, no-store` + `429` burst rate limiting.
  - Admin upload verification rejecting missing R2 objects (`400`) and non-PDF `Content-Type` (`400 INVALID_FILE_TYPE`), CSV bulk import (`201`), analytics prune RPC invocation (`200`), and fail-closed middleware (`503` on unconfigured `/api/admin/*` vs `200` on public `/geography`).

## 5. Known verification boundaries
- Live end-to-end tests against real Supabase Auth (Google OAuth + email verification OTP), real Supabase Postgres RLS queries, and real Cloudflare R2 S3 presigned URLs are **not** executed until `NEXT_PUBLIC_SUPABASE_URL` and `ADMIN_EMAILS` are supplied in `.env.local` and `0001_v3_initial_schema.sql` is applied in Supabase.
- `npm run lint` (`next lint`) prompts for interactive ESLint config because the repository has no root `.eslintrc` file; static checking uses `tsc --noEmit`, `vitest`, `validate.ts`, and `next build`.
