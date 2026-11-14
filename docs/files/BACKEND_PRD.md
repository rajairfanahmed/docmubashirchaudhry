# Backend Product Requirements Document

> Status: PROPOSED (items marked FINALIZED were approved by the owner in chat)
> Version: 0.1
> Last updated: 2026-11-14
> Source of truth for server-side behavior, data, APIs, security, and backend operations.

## 1. Backend Overview
- Runtime, framework, language: TypeScript on Next.js route handlers running as Vercel serverless functions (PROPOSED, DEC-004). One application, no separate backend service.
- Architecture style: modular monolith. Modules: identity, quizzes, attempts, pdfs, notifications, admin, analytics, jobs.
- API style: JSON over HTTPS, REST-like paths under `/api`, versioning not needed for MVP because the only client is our own frontend (PROPOSED).
- Database and data access: Supabase Postgres (FINALIZED). Server-only access with the service role key. Row Level Security is on for every table with no public policies. Supabase client without an ORM (PROPOSED).
- Authentication and authorization: Clerk (FINALIZED), Google and email plus verification code only. Authorization is checked on the server for every request. Admin is a verified email in an environment-variable list (PROPOSED, DEC-020).
- Hosting and deployment: Vercel at https://docmubashirchaudhry.vercel.app (owner-provided). Keys for Clerk, Supabase and R2 are set in Vercel (owner-provided, not verified by me).
- External integrations: Clerk (webhooks and user API), Cloudflare R2 (S3-compatible API), an email service (OPEN, DEC-018), an analytics tool (OPEN, DEC-017), an uptime monitor (OPEN).

## 2. System Responsibilities and Boundaries
| Concern | Owner |
|---|---|
| Identity, passwords, Google sign-in, verification codes, sessions | Clerk |
| Who the user is inside our system (profile, status, history) | Our database, filled by Clerk webhooks |
| Who is an admin | Our server, from verified email plus the admin list |
| Quiz rules, scoring, timer, negative marking | Server (the browser only displays) |
| Correct answers during an attempt | Server only; never sent to the browser until the attempt is submitted |
| PDF files | R2 private bucket; the browser never gets a bucket URL, except an admin upload URL |
| PDF stamping | Server, per download |
| Geography and exam content (static) | Content files read at build time; no database |
| Display, timers shown, local interaction | Browser |

The browser is not trusted. Every rule below is enforced on the server.

## 3. Domain Model and Data Ownership
Full field lists, constraints and indexes are in `database-design.md`. Summary and rules:

### DATA-01: profiles
Purpose: our copy of each Clerk user. Key fields: id, clerk_user_id (unique), email, full_name, avatar_url, auth_provider (google or email), status (active, blocked, deleted), blocked_reason, created_at, last_seen_at. Ownership: the user owns their own row for reading and name edits; admins read all. Sensitivity: personal data. Lifecycle: created by webhook, updated by webhook and by the user's name edit, blocked or unblocked by admin, anonymized on deletion.

### DATA-02: quizzes
Quiz settings: title, description, exam, optional post, type (topic, post-wise, mock, full-length), language label, duration in minutes (empty means no timer), marks per question, negative marking on or off with a value, shuffle questions, shuffle options, status (draft, published, archived). Owned by admins.

### DATA-03: questions and DATA-04: question_options
A question has a language (English, Urdu, mixed), text, explanation, exam, subject, topic, difficulty, status. It has exactly four options A to D with exactly one correct. Owned by admins.

### DATA-05: quiz_questions and DATA-13: quiz_sections
Which questions belong to a quiz, in order, with an optional marks override and an optional section (mocks).

### DATA-06: quiz_attempts and DATA-07: attempt_answers
An attempt belongs to one user and one quiz. At start it stores a snapshot of the quiz settings and of the questions with their options and correct answers, so later edits never change the attempt or its score. Answers are saved one at a time. Scores are written at submit. Owned by the user; readable by that user and by admins.

### DATA-08: pdf_resources and DATA-09: pdf_downloads
PDF records (title, exam, subject, topic, year, author, storage key, size, pages, SHA-256, version, status, verification) and one row per download with a unique access ID printed on the stamped file. Owned by admins; downloads belong to the user and are readable by that user and by admins.

### DATA-10: admin_notifications, DATA-15: digest_runs
Events for admins (new user, quiz join), email state, and a record that the daily summary for a date was sent (prevents duplicates).

### DATA-11: admin_activity_log
Append-only record of admin actions.

### DATA-12: question_reports
User reports of wrong questions.

### DATA-14: webhook_events
Event IDs already processed, so repeated webhooks do nothing.

### DATA-18: storage_snapshots
Total bytes and object count in R2 with the time they were measured, for the dashboard storage bar.

### DATA-16 and DATA-17: static content
Exams, PPSC posts, blueprints, subjects, topics (DATA-16) and Geography (DATA-17) stay as content files read at build time (FINALIZED for Geography; PROPOSED for exam content). No database tables.

### Retention (PROPOSED unless noted)
- profiles: kept until the user deletes the account (FINALIZED in principle, DEC-024 for details).
- quiz attempts: kept until account deletion, then kept anonymously for statistics (PROPOSED, OPEN).
- pdf_downloads and admin_activity_log: 12 months (OPEN).
- admin_notifications: 90 days.
- webhook_events: 30 days.
- backups: 8 weekly copies, encrypted.

## 4. Business Logic and Workflows

### 4.1 Identity sync (FEAT-06)
1. Clerk sends `user.created`, `user.updated` or `user.deleted` to the webhook.
2. The server verifies the signature and checks the timestamp is recent (5 minutes). Invalid: reject with 400.
3. The event ID is inserted into webhook_events. If it already exists, return 200 and do nothing (idempotent).
4. `user.created`: insert the profile (upsert by clerk_user_id), create an admin notification "new user", and send the email to the admin address. If the email send fails, store `failed` and retry in the next scheduled run.
5. `user.updated`: update name, email, avatar.
6. `user.deleted`: anonymize the profile (see 4.9).
7. If a signed-in user has no profile yet (webhook delayed), the server creates it on first API call from the Clerk session data (safety net).

### 4.2 Admin identity (FEAT-13)
A request is admin only if all are true: valid Clerk session, the user's primary email is verified, the email is in the `ADMIN_EMAILS` list, the profile is not blocked, and 2-step verification is enabled on the Clerk account (PROPOSED). Failing any check returns the same 404 response as an unknown route, with the same body and headers, and no admin hint. The list is read from the environment variable only; no API can change it. To add an admin, a person with Vercel access edits the variable and redeploys (a stated limitation of this design).

### 4.3 Blocked users (FEAT-23)
A blocked profile (status blocked) is refused on: starting or saving attempts, downloading PDFs, reporting questions. Error code `ACCOUNT_BLOCKED`. Open pages still work. Blocking and unblocking are recorded in the activity log. An admin cannot block an admin email (prevents locking out; PROPOSED).

### 4.4 Quiz attempt lifecycle (FEAT-08, 09, 10)
- **Start (API-07).** Requires an active user and a published quiz. If the user already has an in-progress attempt on this quiz that has not expired, return that attempt (no duplicate). Otherwise create an attempt: snapshot settings and questions (applying shuffle choices with a stored seed), set deadline_at = now + duration (or null). Create a "quiz joined" notification.
- **Retake.** Allowed without limit once the previous attempt is submitted (FINALIZED, DEC-009).
- **Questions payload.** Contains text and option texts and labels, never the correct option or explanation, until submit.
- **Save answer (API-09).** Allowed only for an in-progress attempt before deadline_at. After the deadline: reject with 409 `ATTEMPT_EXPIRED` and finalize the attempt. Overwrites the previous choice for that question. Selected label must be one of A to D that exists for that question.
- **Submit (API-10).** Idempotent: submitting an already submitted attempt returns the same result. Scoring is done here from the snapshot.
- **Expiry.** The server treats a past deadline as the end. Any read, save or submit of an expired in-progress attempt finalizes it as auto_submitted. A scheduled job also finalizes expired attempts in bulk. Admin lists show expired but unfinalized attempts as "Time ended".
- **Scoring rule (FINALIZED for per-quiz negative marking; details PROPOSED).** For each question: correct adds its marks; wrong subtracts the quiz's negative value when negative marking is on; unanswered adds 0. Marks per question come from the override or the quiz default. Stored: score, total marks, counts, percent. Percent is shown as max(0, score) divided by total marks (OPEN, DEC-025: whether a negative total is shown as is).
- **Editing a published quiz.** Changes apply only to new attempts. Past attempts keep their snapshots.

### 4.5 Questions and import (FEAT-16)
- A question needs exactly 4 options, all different after trimming, and exactly one correct. Text is stored as given (UTF-8) with no changes to Urdu characters. Language label must be en, ur or mixed.
- Import (CSV or JSON, UTF-8 with or without BOM, at most 500 rows). Columns: language, question, option_a, option_b, option_c, option_d, correct (A to D), explanation, exam, subject, topic, difficulty, marks (optional). Validation runs for the whole file first. If any row fails, nothing is written and the response lists every failing row with its line number and reason. A successful import is one transaction.
- Published question edits create a new revision; a question used in any published quiz cannot be deleted, only archived.

### 4.6 PDF upload and publishing (FEAT-17)
1. Admin asks for an upload URL (API-28). Server returns a short-lived presigned URL (10 minutes) for a temporary key. Direct upload to R2 avoids serverless request-size limits (to verify, OQ-06).
2. Admin sends the details with the temporary key (API-28 create). Server checks: object exists, size within limit (PROPOSED 25 MB, OQ-08), first bytes are the PDF signature, the file opens as a PDF (page count read), SHA-256 computed. Any failure deletes the temporary object and returns a clear error.
3. Server moves the object to its final private key, creates the record as draft (or published if chosen) with version 1.
4. Publishing sets status published and records the time. Replacing the file creates the next version; old versions stay in storage.
5. Every step is written to the activity log.
Malware scanning is OPEN: uploads are from trusted admins only, so the risk is low; a scanner can be added later (OQ-11).

### 4.7 PDF download and stamping (FEAT-11, 12)
1. Requires an active signed-in user and a published, verified PDF.
2. Server creates an access ID and a download row with status started.
3. Server reads the original from R2 (private), adds a small stamp to each page with the user's name, email and the access ID (the owner's existing watermark in the files stays untouched), and streams the result with `Content-Disposition: attachment`, `Cache-Control: no-store`.
4. On success the row becomes completed; on failure, failed.
5. No daily or total download limit exists (FINALIZED, DEC-009). The only protection against load is a burst guard on simultaneous stamping jobs per user (PROPOSED, not a quota). The dashboard flags users with unusually high daily counts (FEAT-29, PROPOSED).
6. Risk R-04: stamping inside serverless limits is not proven. Fallback options for the build stage: stamp once per user per file and cache the result privately for a short time, or run stamping in a small separate worker. Decision at the stack stage.

### 4.8 Notifications (FEAT-18)
- New user: notification row plus an immediate email (FINALIZED, DEC-008).
- Quiz joined: notification row per attempt start (with user name and quiz title); email is a daily summary only (FINALIZED). The summary job runs once a day at a time the owner picks (OPEN, default 08:00 Pakistan time), lists each user, quiz, count and best score so far, marks the rows digest_sent, and records the run for that date so it cannot send twice. No events means no email.
- Bell: the admin dashboard asks the server for unread items every 60 seconds while open (PROPOSED). No push or WhatsApp (FINALIZED).

### 4.9 Account deletion (FEAT-24)
User confirms, server deletes the Clerk account, and the `user.deleted` webhook anonymizes the profile: email, name, avatar removed; status deleted; the row stays so old attempts keep a reference and show "Deleted user" (PROPOSED, DEC-024 OPEN). Download logs keep the anonymized reference for audit. If the webhook never arrives, a reconciliation job compares Clerk and the database weekly.

### 4.10 Storage measurement (FEAT-14)
Server sums object sizes in the bucket through the S3 list call (paginated) and stores the result in storage_snapshots. The dashboard shows the latest snapshot; if older than 10 minutes, the next dashboard request refreshes it. Allowance comes from a configured value (OQ-07; the R2 free allowance was shown as 10 GB on Cloudflare's pricing page when checked in November 2026, to be re-checked).

### 4.11 Exports (FEAT-26)
Admins can export users, attempts and scores as CSV. Cells starting with `=`, `+`, `-` or `@` are prefixed so spreadsheet programs do not run them. Exports are logged.

### 4.12 Backups and alerts (FEAT-27, 28)
- Weekly: a GitHub Actions job dumps the database, encrypts it, uploads it to a separate R2 prefix, keeps the last 8, and emails on failure. A restore drill is done before launch.
- Health: `GET /api/health` checks the database and returns 200 or 503; an external monitor emails the owner when it fails.

### 4.13 Analytics (FEAT-20)
Visit counts come from a cookieless analytics tool (OPEN). Anonymous visitors are counted, not named. Only signed-in users can be named, and only through our own tables.

## 5. API Contract
Common rules (PROPOSED): JSON, UTF-8; success `{ "data": ..., "meta": ... }`; error `{ "error": { "code": "...", "message": "plain text", "fields": { "name": "message" } } }`; lists use `page` (default 1) and `pageSize` (default 20, maximum 100) and return `meta.total`. Dates are ISO 8601 UTC. Admin APIs are under `/api/admin`. State-changing calls check the Origin header and require the Clerk session. The full table is in `api-contract.md`. Illustrative values below are examples, not real data.

### API-01: Clerk webhook
- Features: FEAT-06. Actor: Clerk. `POST /api/webhooks/clerk`. Auth: signature headers (no session). Body: Clerk event JSON. Response: `200 { "data": { "ok": true } }`. Errors: 400 invalid signature or stale timestamp. Idempotent by event ID. Side effects: profile upsert, notification, email.

### API-02: Current user
- FEAT-06, 07. `GET /api/me`. Auth: session. Response `data`: `{ id, name, email, avatarUrl, provider, status, isAdmin, createdAt }`. Errors: 401. A blocked user still receives 200 with status blocked so the UI can show the message.

### API-03: Update profile
- FEAT-07. `PATCH /api/me`. Body `{ "name": "Ayesha Raza" }` (2 to 60 chars). Response updated profile. Errors: 401, 403 `ACCOUNT_BLOCKED`, 422.

### API-04: Delete account
- FEAT-24. `DELETE /api/me`. Body `{ "confirm": "DELETE" }`. Response `204`. Errors: 401, 422. See 4.9.

### API-05: List quizzes
- FEAT-08. `GET /api/quizzes?exam=&type=&language=&page=`. Auth: none for the list (published only). Response items: `{ id, title, exam, type, languageLabel, questionCount, durationMinutes, totalMarks, negativeMarking: { enabled, value }, inProgressAttemptId? }` (the last field only when signed in).

### API-06: Quiz summary
- `GET /api/quizzes/{id}`. Auth none. Published only; 404 otherwise. Same fields plus description and sections.

### API-07: Start attempt
- `POST /api/quizzes/{id}/attempts`. Auth: active user. Response `201 { data: { attemptId, startedAt, deadlineAt|null } }` or `200` with the existing in-progress attempt. Errors: 401, 403 `ACCOUNT_BLOCKED`, 404, 409 `QUIZ_NOT_AVAILABLE`.

### API-08: Get attempt (resume)
- `GET /api/attempts/{id}`. Auth: owner. Response: quiz title, settings (timer, negative value), questions (no answers shown as correct), saved selections, flags, `remainingSeconds`, status. Expired: finalizes and returns status with `resultUrl`. Errors: 401, 404 for non-owner.

### API-09: Save answer
- `PUT /api/attempts/{id}/answers/{questionId}`. Body `{ "selected": "B" | null, "flagged": false }`. Response `{ saved: true, remainingSeconds }`. Errors: 401, 404, 409 `ATTEMPT_EXPIRED`, 409 `ATTEMPT_FINISHED`, 422 invalid option.

### API-10: Submit attempt
- `POST /api/attempts/{id}/submit`. Idempotent. Response `{ attemptId, status, score, totalMarks, percent }`. Errors: 401, 404.

### API-11: Result
- `GET /api/attempts/{id}/result`. Auth: owner or admin. Response: summary and per question `{ question, options, selected, correct, isCorrect, marksAwarded, explanation }`. 409 `ATTEMPT_NOT_SUBMITTED` if still running.

### API-12: My attempts
- `GET /api/me/attempts?page=`. Auth: user.

### API-13: List PDFs
- `GET /api/pdfs?exam=&subject=&topic=&year=&q=&sort=&page=`. Auth none (details only, no file). Response: `{ id, slug, title, exam, subject, topic, year, pages, sizeBytes, author, verified, thumbnailUrl? }`.

### API-14: PDF detail
- `GET /api/pdfs/{slug}`. Auth none. 404 if not published.

### API-15: Download PDF
- `GET /api/pdfs/{id}/download`. Auth: active user. Response: `200` file stream (`application/pdf`, attachment, no-store) or errors: 401, 403 `ACCOUNT_BLOCKED`, 404, 500 `DOWNLOAD_FAILED`. Side effects: download row and access ID.

### API-16: My downloads
- `GET /api/me/downloads?page=`. Auth: user.

### API-17: Report a question
- `POST /api/question-reports`. Body `{ "questionId": "...", "message": "..." }` (5 to 500 chars). Auth: active user. Rate limit: 5 per hour per user (PROPOSED). Errors: 401, 422, 429.

### API-20: Dashboard overview
- `GET /api/admin/overview`. Auth: admin. Response: totals and today counts for users, attempts, downloads; visits (if the analytics tool is connected, else null); published quiz and PDF counts; charts (30 days); recent items; flags.

### API-21: Storage
- `GET /api/admin/storage`. Auth: admin. Response `{ usedBytes, allowanceBytes, objectCount, checkedAt, largest: [...] }`. Refresh if older than 10 minutes.

### API-22: Users list
- `GET /api/admin/users?q=&status=&from=&to=&sort=&page=`. Auth: admin.

### API-23: User detail
- `GET /api/admin/users/{id}`. Auth: admin. Profile, attempts (paged), downloads (paged).

### API-24: Block or unblock
- `PATCH /api/admin/users/{id}/status`. Body `{ "status": "blocked", "reason": "optional" }`. Errors: 404, 409 `CANNOT_BLOCK_ADMIN`, 422. Logged.

### API-25: Participation
- `GET /api/admin/attempts?quizId=&userId=&status=&from=&to=&page=`.

### API-26: Quizzes (admin)
- `GET/POST /api/admin/quizzes`, `GET/PATCH /api/admin/quizzes/{id}`, `POST /api/admin/quizzes/{id}/publish`, `POST /api/admin/quizzes/{id}/archive`. Validation per section 6 of the frontend document. Publish requires at least 1 question. Errors 422, 409 `QUIZ_HAS_ATTEMPTS` for unsafe deletes.

### API-27: Questions (admin)
- `GET/POST /api/admin/questions`, `GET/PATCH /api/admin/questions/{id}`, `POST /api/admin/questions/{id}/archive`, `POST /api/admin/questions/import?dryRun=true|false`. Import response on failure: `422 { error: { code: "IMPORT_INVALID", fields: ..., details: [ { line, reason } ] } }`.

### API-28: PDFs (admin)
- `POST /api/admin/pdfs/upload-url` (returns presigned URL and temporary key), `POST /api/admin/pdfs` (create from temporary key), `GET /api/admin/pdfs`, `GET/PATCH /api/admin/pdfs/{id}`, `POST /api/admin/pdfs/{id}/publish`, `POST /api/admin/pdfs/{id}/archive`, `POST /api/admin/pdfs/{id}/versions`. Errors: 413 `FILE_TOO_LARGE`, 415 `NOT_A_PDF`, 422, 409 `DUPLICATE_FILE`.

### API-29: Notifications (admin)
- `GET /api/admin/notifications?unread=&type=&page=`, `POST /api/admin/notifications/read` (body: ids or all).

### API-30: Activity log
- `GET /api/admin/activity?adminId=&action=&from=&to=&page=`.

### API-31: Export
- `GET /api/admin/exports/{users|attempts|scores}?filters`. Response: CSV file.

### API-32: Question reports (admin)
- `GET /api/admin/reports?status=&page=`, `PATCH /api/admin/reports/{id}`.

### API-33: Scheduled jobs
- `GET /api/cron/digest`, `GET /api/cron/finalize-attempts`, `GET /api/cron/reconcile-users`. Auth: secret header set by the scheduler; anything else gets 404. Jobs are safe to run twice.

### API-34: Health
- `GET /api/health`. Auth none. `200 { data: { ok: true } }` or `503`. No details exposed.

## 6. Authentication and Authorization
Role and permission matrix (the only roles are Visitor, User, Admin; Admin has no sub-roles, FINALIZED):

| Capability | Visitor | User | Admin |
|---|---|---|---|
| Read open pages, list quizzes and PDFs | Yes | Yes | Yes |
| Start and save quiz attempts | No | Yes (active) | Yes |
| Read a result | No | Own only | All |
| Download PDFs | No | Yes (active) | Yes |
| Report a question | No | Yes (active) | Yes |
| Edit own name, delete own account | No | Yes | Yes |
| Admin APIs and pages | 404 | 404 | Yes |

- Session: Clerk session cookie. The server validates it on every protected request.
- Resource ownership: attempts, downloads and results are filtered by user id on the server. Another person's id returns 404, not 403 (no existence leak).
- Recovery: password reset through Clerk. An admin who loses access is restored by a person with Clerk and Vercel access.

## 7. Integrations and Background Processing
| Provider | Use | Failure behavior |
|---|---|---|
| Clerk | Sign-in, webhooks, user API | Webhook retries are handled by idempotency; weekly reconciliation job |
| Supabase | Database | `/api/health` fails; the site shows a calm error on protected pages; open pages still work |
| R2 | PDF files, backups | Downloads fail with a clear message and an admin alert is recorded |
| Email service (OPEN) | New-user email, daily summary, failure alerts | Failed sends are marked and retried by the next scheduled run |
| Analytics (OPEN) | Visit counts | Dashboard card shows "Not available" |
| Uptime monitor (OPEN) | Down alert | n/a |

Scheduled jobs: daily summary, expiry sweeper (daily; lazy finalization covers the gaps), weekly reconciliation, weekly backup. Vercel cron frequency depends on the plan in use (OQ-06); if limited to once a day, all of the above still work.

## 8. Security and Privacy
Threats considered: account takeover, admin area discovery, PDF scraping and leaking, webhook forgery, injection, file upload abuse, personal-data exposure, quiz answer leakage, cheating by editing requests.

| Control | Requirement | Status |
|---|---|---|
| Sign-in | Clerk only; Google and email plus code; no other methods | FINALIZED |
| Admin gating | Verified-email list in an environment variable, 2-step verification required, stealth 404 for everyone else, server-side check on every admin route and page | PROPOSED |
| Authorization | Checked on the server per request; ownership filters; blocked-user checks | PROPOSED |
| Database access | Browser never queries the database; service role key only on the server; Row Level Security on with no public policies | PROPOSED |
| Input validation | Zod on every request body and query; unknown fields rejected; parameterized queries only | PROPOSED |
| Webhook security | Signature verification, 5-minute timestamp tolerance, event ID de-duplication | PROPOSED |
| CSRF and origin | Same-origin only; Origin check on state-changing calls; cookies set by Clerk with SameSite | PROPOSED |
| XSS | React escaping; question text rendered as plain text with line breaks only (no raw HTML); strict Content Security Policy using nonces instead of blanket inline scripts; allow only the hosts really needed (Clerk, images, analytics) | PROPOSED |
| Security headers | CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` | PROPOSED |
| PDF protection | Private bucket, no public URLs, access only through the download API after sign-in, per-download stamp with the user's details, no-store caching, download logging, admin flag for unusual volume | FINALIZED (scope), PROPOSED (mechanism) |
| Upload safety | Admin only, direct upload to a temporary key, size and signature checks, page-count parse, temporary object deleted on failure, bucket token limited to this bucket | PROPOSED |
| Quiz integrity | Correct answers withheld until submit; server timer; snapshots; answers accepted only before the deadline | PROPOSED |
| Rate and abuse limits | Edge or platform rules for sign-in and API bursts (depends on plan, OQ-06); report limit 5 per hour; no download quota | OPEN |
| Secrets | Only in Vercel and GitHub secret stores; never in the browser bundle; rotate every 90 days | PROPOSED |
| Logging | No passwords, tokens or full emails in logs; error logs use user ids | PROPOSED |
| Audit | Admin activity log; download log | FINALIZED (log), PROPOSED (contents) |
| Dependencies | Lockfile, regular audit, update pull requests | PROPOSED |
| Backups | Weekly encrypted database dump to R2, restore tested | FINALIZED |
| Privacy | Collect name, email, provider, quiz and download activity only; privacy notice and Terms; consent checkbox at sign-up; user can delete the account; no data sold or shared for ads | FINALIZED (consent, deletion), OPEN (legal review, NFR-04) |

No claim of legal compliance is made. Whether Pakistan's data-protection rules apply, and any duties that follow, needs advice from a lawyer (OQ-05).

## 9. Reliability and Operations
- Timeouts: API calls 10 seconds (PDF stamping limit to be confirmed, R-04). Client retries for saving answers and submit.
- Idempotency: webhook events, attempt start (returns existing), submit, digest runs, import (all or nothing).
- Concurrency: one active attempt per user per quiz; saving answers uses upsert; scoring is computed once inside a transaction.
- Observability: error tracking (OPEN tool), structured logs, uptime monitor on `/api/health`.
- Alerting: down alert; failed backup; failed digest; failed webhook processing recorded in the activity log.
- Migrations: SQL migration files in the repository, applied to a staging project first, then production; each migration has a rollback note. Content-file changes follow the normal pull request flow.
- Environments: local, staging, production (staging project for Supabase and a preview project for Clerk are PROPOSED; plan limits to verify).
- Graceful degradation: open pages work if Supabase or Clerk is down; protected features show a calm message.

## 10. Backend Non-Functional Requirements
| ID | Category | Requirement/target | Verification | Status |
|---|---|---|---|---|
| BNFR-01 | Performance | List and detail endpoints p95 under 500 ms; save answer p95 under 300 ms (TBD until measured on the real plan) | Load test | TBD |
| BNFR-02 | Performance | PDF download starts within 5 seconds for files up to 10 MB (TBD, R-04) | Test with real files | TBD |
| BNFR-03 | Correctness | Scores match a reference calculation on a test set including negative marking and Urdu text | Unit tests | PROPOSED |
| BNFR-04 | Security | No critical or high issues open at launch | Review and tests | PROPOSED |
| BNFR-05 | Reliability | Webhook, digest and submit are safe to run twice | Tests | PROPOSED |
| BNFR-06 | Recoverability | Restore from the latest backup tested; RPO 7 days with weekly backups unless a paid plan adds daily backups; RTO 4 hours (TBD) | Restore drill | OPEN |
| BNFR-07 | Capacity | Plan limits of Clerk, Supabase, R2, Vercel known before launch | OQ-06 | OPEN |

## 11. Backend Testing and Acceptance
- Unit: scoring (correct, wrong, unanswered, negative marking on and off, marks override), timer and expiry rules, import validation, CSV cell protection, admin check.
- API and contract: every API-ID above, success and error codes, shared schemas with the frontend.
- Authorization: user cannot read another user's attempt, result or downloads; non-admin gets 404 on every admin route; blocked user refused on protected actions.
- Security: forged and replayed webhooks, tampered ids, oversized and non-PDF uploads, SQL-like and script-like input in text fields, answer leakage check (correct answers absent before submit).
- Integration: Clerk webhook to profile and notification; R2 upload, move, stamp and download; email send and digest.
- Concurrency: double submit, parallel saves, two starts at once, duplicate webhook.
- End-to-end: sign up, take a timed quiz that expires, download a PDF, admin sees the user, attempt and download, admin blocks the user.
- Acceptance IDs: AC-004, 007, 009, 011, 012..023, 026..032 in `MASTER_PRD.md`.

## 12. Open Items and Assumptions
| ID | Item | Impact | Next decision | Status |
|---|---|---|---|---|
| BO-01 | PDF stamping inside serverless limits | Download feature design | Test real files; choose fallback | OPEN |
| BO-02 | Email service choice and limits | Notifications | DEC-018 | OPEN |
| BO-03 | Analytics tool | Visit counts | DEC-017 | OPEN |
| BO-04 | Plan limits (Vercel, Supabase, Clerk, R2) | Cron, request size, pause, quotas | OQ-06 | OPEN |
| BO-05 | Handling of attempts after account deletion | Privacy | DEC-024 | OPEN |
| BO-06 | Negative total display | Result card | DEC-025 | OPEN |
| BO-07 | Retention periods | Privacy and storage | Owner approval | OPEN |
| BO-08 | Malware scanning | Upload safety | OQ-11 | OPEN |
| BO-09 | Rate limiting method | Abuse control | Depends on plan | OPEN |
| BO-10 | Mubashir sir's email for the admin list | Admin access | Owner provides | OPEN |

## 13. Handoff to Backend Engineering
- Read this document before implementation.
- Read `MASTER_PRD.md` for approved product goals, scope, roles, and priorities.
- Keep `architecture.md`, `api-contract.md`, and `database-design.md` synchronized with this PRD.
- Confirm all API and data decisions before frontend integration work depends on them.
- Do not start build until the P0 open items in `DECISION_LOG.md` are resolved or accepted as risks.
