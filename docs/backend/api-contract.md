# Backend API Contract (v2.0 Public + v3.0 Auth, PDF, Quiz & Admin)

> Status: Implemented & Type-Checked  
> Last updated: 2026-11-12

## 1. Common error envelope & conventions
All v3.0 JSON API errors use a uniform shape:
```json
{
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable explanation",
    "details": {}
  }
}
```
- **Auth status codes:** `401 UNAUTHORIZED` (missing/invalid session cookie), `403 FORBIDDEN` (authenticated student accessing `/api/admin/*` or mock exam answer checks), `429 RATE_LIMITED` (includes `Retry-After` and `X-RateLimit-*` headers), `503 BACKEND_CONFIG_MISSING` (when required Supabase/R2 env vars are absent).
- **Caching:** Authenticated, admin, download, and session routes always return `Cache-Control: no-store` or `private, no-store`. Public catalog routes return `public, max-age=60, stale-while-revalidate=300` when configured.

## 2. Preserved v2.0 public endpoints
- `GET /api/countries`: Paginated country catalog (`page >= 1`, `pageSize` `1..100` default `24`, `continent`, `region`, `search`, `sovereignOnly`).
- `GET /api/questions`: Paginated v2.0 practice MCQ catalog (`page >= 1`, `pageSize` `1..100` default `20`, `subjectId`, `topicId`, `difficulty`, `verifiedOnly`).
- `GET /api/health`: Non-secret health payload with static dataset counts (`countries: 250`, etc.) plus `v3` boolean readiness flags (`supabasePublicConfigured`, `supabaseSecretConfigured`, `r2Configured`, `adminAllowListConfigured`).

## 3. Authentication & session routes (`/api/auth/*`)
| Endpoint | Auth | Purpose & Contract |
|---|---|---|
| `POST /api/auth/signup` | Public (10 req / 15m per IP) | Registers email/password user via Supabase Auth with `emailRedirectTo` pointing to `/api/auth/callback`. Returns `202` (`requiresEmailVerification: true`) or `201` with user summary and `httpOnly` cookies. |
| `POST /api/auth/login` | Public (15 req / 15m per IP) | Authenticates email/password via Supabase Auth, syncs `profiles`, and sets `httpOnly` session cookies. Returns `200` `{ ok: true, user }` or `401 INVALID_CREDENTIALS`. |
| `GET /api/auth/oauth` | Public (30 req / 15m per IP) | Starts Google OAuth PKCE flow (`?provider=google&next=/...`), validates `next` with open-redirect guard, sets PKCE cookies, and responds `302` redirect to Supabase Google OAuth URL. |
| `GET /api/auth/callback` | Public | Exchanges `code` (OAuth PKCE) or `token_hash` + `type` (email verification/recovery/magiclink OTP), syncs `profiles`, sets `httpOnly` session cookies, and `302` redirects to sanitized `next`. |
| `POST /api/auth/logout` | Any | Signs out Supabase session server-side, clears cookies, returns `200 { ok: true }`. |
| `GET /api/auth/session` | Any | Returns `{ configured, authenticated, user }` (`isAdmin` evaluated server-side against `ADMIN_EMAILS`). Never throws on anonymous visitors. |

## 4. Public catalogs & gated student action routes
| Endpoint | Auth | Purpose & Contract |
|---|---|---|
| `GET /api/pdfs` | Public | Lists published PDF metadata (`id`, `slug`, `title`, `description`, `subject`, `examTag`, `tags`, `fileSize`, `downloadCount`, `createdAt`, `requiresAuth: true`). **Never returns `file_key`.** Supports `page`, `pageSize`, `subject`, `examTag`, `search`, `sort=newest\|popular`. |
| `GET /api/pdfs/[id]/download` | **Required (401)** + 30 req / 15m per user+IP | Accepts UUID or `slug`. Logs download to `pdf_access_log` (trigger increments `download_count`), issues `120-300s` Cloudflare R2 signed GET URL, and returns `302` redirect (default) or `200` JSON when `?mode=json` (`{ pdfId, title, fileSize, downloadUrl, expiresInSeconds, expiresAt }`). |
| `GET /api/quizzes` | Public | Lists published quizzes (`id`, `slug`, `title`, `description`, `type`, `subject`, `examTag`, `timeLimitSeconds`, `negativeMarking`, `negativeMarkingValue`, `passPercentage`, `language`, `questionCount`, `requiresAuth: true`) filtered by `type`, `subject`, `examTag`, `search`. |
| `GET /api/quizzes/[id]/start` | **Required (401)** | Returns quiz configuration + sanitized questions (`correct_option` and `explanation` stripped by `stripQuestionSecrets()`). Returns `409 QUIZ_EMPTY` if quiz has 0 questions. |
| `POST /api/quizzes/[id]/check-answer` | **Required (401)** | Allowed only when `quiz.type === 'practice'`. Returns `403 MOCK_ANSWERS_SEALED` for mock exams. Validates option, checks correctness, returns `{ questionId, selectedOption, correctOption, isCorrect, explanation }`. |
| `POST /api/quizzes/[id]/submit` | **Required (401)** | Accepts `{ answers: [{ questionId, selectedOption }], timeTakenSeconds, autoSubmitted, startedAt }`. Grades server-side with negative marking if enabled, inserts private row into `quiz_attempts`, returns `201` score breakdown + question review. |
| `GET /api/me/attempts` | **Required (401)** | Returns the authenticated user's own attempt summary (`totalAttempts`, `averagePercentage`, `bestPercentage`, `passedCount`) and paginated history items. |
| `GET /api/me/downloads` | **Required (401)** | Returns the authenticated user's own paginated PDF download log joined with safe PDF metadata. |
| `POST /api/analytics/visit` | Public (120 req / 5m per IP) | Validates `{ path }` (must start with `/`), skips `/api/*` and `/_next/*` (`202 { recorded: false }`), attaches `user_id` if signed in, inserts into `site_visits`, returns `201 { recorded: true }`. |

## 5. Admin management & analytics routes (`/api/admin/*`)
All `/api/admin/*` endpoints require a valid authenticated session **and** lowercase email membership in `ADMIN_EMAILS` (`401` anonymous, `403` non-admin student).
| Endpoint | Methods | Purpose & Contract |
|---|---|---|
| `/api/admin/pdfs/upload-url` | `POST` | Validates `{ filename, contentType: 'application/pdf', fileSizeBytes (<= 50 MB) }`. Returns `201 { uploadUrl, fileKey, expiresInSeconds, requiredHeaders }`. |
| `/api/admin/pdfs` | `GET`, `POST` | `GET`: paginated admin PDF inventory. `POST`: runs `headPdfObject` against R2 to verify uploaded binary exists (`400 R2_OBJECT_NOT_FOUND`) and `Content-Type` is PDF (`400 INVALID_FILE_TYPE`), requires `watermarkConfirmed: true`, inserts into `pdf_resources`. |
| `/api/admin/pdfs/[id]` | `PATCH`, `DELETE` | Updates metadata (`title`, `description`, `subject`, `examTag`, `tags`, `watermarkConfirmed`, `isPublished`) or deletes both DB row and R2 object. |
| `/api/admin/quizzes` | `GET`, `POST` | Lists all quizzes (including drafts) or creates a new `practice` / `mock` quiz with timer, negative marking, pass percentage, and language options. |
| `/api/admin/quizzes/[id]` | `GET`, `PATCH`, `DELETE` | Reads, updates settings/publish flag, or deletes a quiz by UUID. |
| `/api/admin/questions` | `GET`, `POST` | Filters questions (`quizId`, `subject`, `examTag`, `difficulty`) or adds a single bilingual question after verifying unique option keys and valid `correctOption`. |
| `/api/admin/questions/[id]` | `PATCH`, `DELETE` | Updates merged prompt/options/`correctOption` invariants or deletes question by UUID. |
| `/api/admin/questions/import` | `POST` | Bulk imports `1..500` questions via `format: 'csv'` (RFC-4180 CSV parser supporting bilingual `text_en`/`text_ur` and options `option_a`..`option_e`) or `format: 'json'`. |
| `/api/admin/analytics/overview` | `GET` | Returns `totalRegisteredUsers`, `activeUsersToday`, `quizzesAttemptedToday`, `totalQuizAttempts`, `totalPdfDownloads`, `siteVisits` (`today`, `last7Days`, `last30Days`, `total`), `dailyVisitSeries` (30 UTC days). |
| `/api/admin/analytics/users` | `GET` | Paginated user table (`search` on email/displayName) with `authProvider`, `createdAt`, `lastActiveAt`, `totalQuizzesAttempted`, `averageScore`, `totalPdfDownloads`. |
| `/api/admin/analytics/quizzes` | `GET` | Per-quiz attempt counts, average percentage, pass rate, and top missed questions ranked by miss rate. |
| `/api/admin/analytics/pdfs` | `GET` | Per-PDF download totals/recent 30-day counts, plus per-user PDF download summary. |
| `/api/admin/analytics/prune` | `POST` | Invokes SQL RPC `prune_v3_analytics_logs(visit_retention_days, pdf_log_retention_days)` with enforced minimums (`>= 7d` visits, `>= 30d` download logs). |
