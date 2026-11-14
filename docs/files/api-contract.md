# API Contract

> Last updated: 2026-11-14
> This is the full table that `BACKEND_PRD.md` section 5 refers to. Every entry below restates, in one consistent shape, exactly what is already described there; no new endpoint or behavior is introduced here. Change an endpoint in one file only by changing it in both.

## Common rules
- Transport: JSON over HTTPS, UTF-8.
- Success envelope: `{ "data": ..., "meta": ... }`. `meta` is present only for paginated lists.
- Error envelope: `{ "error": { "code": "SCREAMING_SNAKE_CASE", "message": "plain text", "fields": { "fieldName": "message" } } }`. `fields` is present only for 422 validation errors.
- Pagination: `page` (default 1), `pageSize` (default 20, maximum 100); list responses include `meta.total`.
- Dates: ISO 8601, UTC.
- Admin endpoints live under `/api/admin/*` and require the admin check described in `architecture.md` section 3.2.
- State-changing calls (POST, PATCH, PUT, DELETE) check the `Origin` header and require a valid Clerk session, except the Clerk webhook (signature-authenticated) and the cron endpoints (secret-header authenticated).
- No endpoint returns stack traces, provider error bodies, or secrets.
- Values shown in request/response columns below are illustrative, not real data.

## Identity (FEAT-06, FEAT-07, FEAT-24)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-01 | `POST /api/webhooks/clerk` | Clerk / signature header, no session | Clerk event JSON | `200 { "data": { "ok": true } }` | `400` invalid signature or stale timestamp (older than 5 minutes) | Idempotent by event ID (`webhook_events`, DATA-14). Side effects: profile upsert (DATA-01), admin notification and email on `user.created`, anonymization on `user.deleted` |
| API-02 | `GET /api/me` | User / session | none | `{ id, name, email, avatarUrl, provider, status, isAdmin, createdAt }` | `401` no session | A blocked user still gets `200` with `status: "blocked"` so the UI can show the message |
| API-03 | `PATCH /api/me` | User / session | `{ "name": "Ayesha Raza" }` (2 to 60 chars) | Updated profile object | `401`; `403 ACCOUNT_BLOCKED`; `422` | None |
| API-04 | `DELETE /api/me` | User / session | `{ "confirm": "DELETE" }` | `204` | `401`; `422` | Deletes the Clerk account; profile is anonymized by the `user.deleted` webhook, see `architecture.md` 3.1 and `BACKEND_PRD.md` 4.9 |

## Quizzes and attempts (FEAT-08, FEAT-09, FEAT-10)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-05 | `GET /api/quizzes?exam=&type=&language=&page=` | Anyone (public list; published only) | query filters | List of `{ id, title, exam, type, languageLabel, questionCount, durationMinutes, totalMarks, negativeMarking: { enabled, value }, inProgressAttemptId? }`. `inProgressAttemptId` only when signed in | none beyond standard 500 | None |
| API-06 | `GET /api/quizzes/{id}` | Anyone, published only | none | Same shape as API-05 plus `description`, `sections` | `404` if not published | None |
| API-07 | `POST /api/quizzes/{id}/attempts` | Active user | none | `201 { attemptId, startedAt, deadlineAt\|null }`, or `200` with the existing in-progress attempt | `401`; `403 ACCOUNT_BLOCKED`; `404`; `409 QUIZ_NOT_AVAILABLE` | Returns the existing attempt rather than creating a duplicate; creates a "quiz joined" notification |
| API-08 | `GET /api/attempts/{id}` | Owner | none | Quiz title, settings, questions with no correct-answer field, saved selections, flags, `remainingSeconds`, status | `401`; `404` for a non-owner (no existence leak) | Reading an expired in-progress attempt finalizes it and the response includes `resultUrl` |
| API-09 | `PUT /api/attempts/{id}/answers/{questionId}` | Owner, attempt in progress | `{ "selected": "B" \| null, "flagged": false }` | `{ saved: true, remainingSeconds }` | `401`; `404`; `409 ATTEMPT_EXPIRED`; `409 ATTEMPT_FINISHED`; `422` invalid option | Overwrites the previous selection for that question |
| API-10 | `POST /api/attempts/{id}/submit` | Owner | none | `{ attemptId, status, score, totalMarks, percent }` | `401`; `404` | Idempotent: resubmitting a submitted attempt returns the same result, scores are never recomputed from a changed quiz |
| API-11 | `GET /api/attempts/{id}/result` | Owner or admin | none | Summary plus per-question `{ question, options, selected, correct, isCorrect, marksAwarded, explanation }` | `401`; `404`; `409 ATTEMPT_NOT_SUBMITTED` | None |
| API-12 | `GET /api/me/attempts?page=` | User | query | Paged list of the user's own attempts | `401` | None |

## PDFs (FEAT-11, FEAT-12, FEAT-17)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-13 | `GET /api/pdfs?exam=&subject=&topic=&year=&q=&sort=&page=` | Anyone, details only, never the file | query | `{ id, slug, title, exam, subject, topic, year, pages, sizeBytes, author, verified, thumbnailUrl? }` list | none beyond standard 500 | None |
| API-14 | `GET /api/pdfs/{slug}` | Anyone | none | One PDF record | `404` if not published | None |
| API-15 | `GET /api/pdfs/{id}/download` | Active user | none | `200` file stream, `application/pdf`, `Content-Disposition: attachment`, `Cache-Control: no-store` | `401`; `403 ACCOUNT_BLOCKED`; `404`; `500 DOWNLOAD_FAILED` | Creates a download row and access ID (DATA-09) before streaming; see `architecture.md` 3.5 |
| API-16 | `GET /api/me/downloads?page=` | User | query | Paged list of the user's own downloads | `401` | None |
| API-28 | `POST /api/admin/pdfs/upload-url`<br>`POST /api/admin/pdfs`<br>`GET /api/admin/pdfs`<br>`GET/PATCH /api/admin/pdfs/{id}`<br>`POST /api/admin/pdfs/{id}/publish`<br>`POST /api/admin/pdfs/{id}/archive`<br>`POST /api/admin/pdfs/{id}/versions` | Admin | Upload URL request; create from temporary key with details; edits; publish/archive/version actions | Presigned URL and temporary key; created/updated PDF record | `413 FILE_TOO_LARGE`; `415 NOT_A_PDF`; `422`; `409 DUPLICATE_FILE` | See the five-step flow in `architecture.md` 3.4; every step is written to the activity log |

## Reports (FEAT-25)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-17 | `POST /api/question-reports` | Active user | `{ "questionId": "...", "message": "..." }` (5 to 500 chars) | `201` created report | `401`; `422`; `429` (limit 5 per hour per user) | None |
| API-32 | `GET /api/admin/reports?status=&page=`<br>`PATCH /api/admin/reports/{id}` | Admin | query / status update | List; updated report | `404`; `422` | None |

## Admin (FEAT-13 through FEAT-20, FEAT-23, FEAT-26)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-20 | `GET /api/admin/overview` | Admin | none | Totals and today's counts for users, attempts, downloads; visits if the analytics tool is connected, else `null`; published counts; 30-day charts; recent items; flags | `401` session missing; non-admin gets the standard 404, not a 403 | None |
| API-21 | `GET /api/admin/storage` | Admin | none | `{ usedBytes, allowanceBytes, objectCount, checkedAt, largest: [...] }` | same as API-20 | Refreshes if the last snapshot is older than 10 minutes |
| API-22 | `GET /api/admin/users?q=&status=&from=&to=&sort=&page=` | Admin | query | Paged user list | same as API-20 | None |
| API-23 | `GET /api/admin/users/{id}` | Admin | none | Profile, paged attempts, paged downloads | `404` | None |
| API-24 | `PATCH /api/admin/users/{id}/status` | Admin | `{ "status": "blocked", "reason": "optional" }` | New status | `404`; `409 CANNOT_BLOCK_ADMIN`; `422` | Logged to `admin_activity_log` (DATA-11) |
| API-25 | `GET /api/admin/attempts?quizId=&userId=&status=&from=&to=&page=` | Admin | query | Paged attempt list | same as API-20 | None |
| API-26 | `GET/POST /api/admin/quizzes`<br>`GET/PATCH /api/admin/quizzes/{id}`<br>`POST /api/admin/quizzes/{id}/publish`<br>`POST /api/admin/quizzes/{id}/archive` | Admin | Quiz fields per `FRONTEND_PRD.md` section 6 | Created/updated/published/archived quiz | `422`; `409 QUIZ_HAS_ATTEMPTS` on an unsafe delete | Publish requires at least 1 question |
| API-27 | `GET/POST /api/admin/questions`<br>`GET/PATCH /api/admin/questions/{id}`<br>`POST /api/admin/questions/{id}/archive`<br>`POST /api/admin/questions/import?dryRun=true\|false` | Admin | Question fields; CSV or JSON import file | Created/updated question; import result | `422 IMPORT_INVALID` with `details: [{ line, reason }]` on any invalid row | Import is one transaction: any invalid row means nothing is saved |
| API-29 | `GET /api/admin/notifications?unread=&type=&page=`<br>`POST /api/admin/notifications/read` | Admin | query; `{ ids: [...] } \| { all: true }` | Paged notifications; mark-read result | `404` | Polled every 60 seconds by the dashboard bell (PROPOSED) |
| API-30 | `GET /api/admin/activity?adminId=&action=&from=&to=&page=` | Admin | query | Paged activity log rows | none beyond standard 500 | Read only |
| API-31 | `GET /api/admin/exports/{users\|attempts\|scores}?filters` | Admin | query filters | CSV file | `422` bad filter | Spreadsheet-formula-injection characters (`=`, `+`, `-`, `@`) are prefixed on export; export is logged |

## Scheduled jobs and health (FEAT-18, FEAT-27, FEAT-28)

| ID | Method & path | Actor / auth | Request | Success response | Errors | Idempotency / side effects |
|---|---|---|---|---|---|---|
| API-33 | `GET /api/cron/digest`<br>`GET /api/cron/finalize-attempts`<br>`GET /api/cron/reconcile-users` | Scheduler / secret header | none | `200` run summary | `404` for any caller without the correct secret header | All three are safe to run twice; `digest` is additionally guarded by `digest_runs` (DATA-15) so one date never sends twice |
| API-34 | `GET /api/health` | Anyone | none | `200 { data: { ok: true } }` | `503` on database failure | No internal detail exposed either way |

## Authorization matrix
Restated from `BACKEND_PRD.md` section 6 for reference in this file:

| Capability | Visitor | User | Admin |
|---|---|---|---|
| Read open pages, list quizzes and PDFs | Yes | Yes | Yes |
| Start and save quiz attempts | No | Yes (active) | Yes |
| Read a result | No | Own only | All |
| Download PDFs | No | Yes (active) | Yes |
| Report a question | No | Yes (active) | Yes |
| Edit own name, delete own account | No | Yes | Yes |
| Admin APIs and pages | 404 | 404 | Yes |

## Error codes used above
`ACCOUNT_BLOCKED` · `ATTEMPT_EXPIRED` · `ATTEMPT_FINISHED` · `ATTEMPT_NOT_SUBMITTED` · `QUIZ_NOT_AVAILABLE` · `QUIZ_HAS_ATTEMPTS` · `CANNOT_BLOCK_ADMIN` · `FILE_TOO_LARGE` · `NOT_A_PDF` · `DUPLICATE_FILE` · `DOWNLOAD_FAILED` · `IMPORT_INVALID`

## Open items that affect this contract
OQ-06 (plan limits may affect whether direct-to-R2 upload in API-28 and the cron schedule behind API-33 work as designed), OQ-08 (final PDF size limit enforced by API-28), DEC-017 and DEC-018 (the visits field in API-20 and the provider behind the notifications in API-29 are both still open). See `DECISION_LOG.md`.
