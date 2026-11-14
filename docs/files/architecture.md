# Architecture

> Last updated: 2026-11-14
> Derived from `MASTER_PRD.md` section 9 and 11, `BACKEND_PRD.md` sections 1 to 4 and 7, and `FRONTEND_PRD.md` section 1. Keep this file synchronized with those three; it does not introduce new decisions, only arranges what they already state. Items marked ASSUMPTION or OPEN below carry the same status as in the PRDs; see `DECISION_LOG.md` for the decision record behind each.

## 1. System context

One Next.js application, deployed on Vercel at `https://docmubashirchaudhry.vercel.app` (ASSUMPTION, DEC-004; OQ-01 on the real deployed repo), serves four kinds of traffic from one codebase:

- Public pages (home, exam hubs, Geography, search, information pages): pre-rendered, open to anyone.
- The signed-in user area (`/account`, `/quizzes/*`, `/library/*`): rendered per request after a Clerk session is confirmed.
- The admin area (`/admin/*`): rendered per request after the server confirms a verified, allow-listed admin email (DEC-020).
- The API (`/api/*`): JSON route handlers called by the frontend and by Clerk's webhook and the scheduler.

External providers:

- **Clerk**: identity, sessions, Google OAuth, email and password with verification code (DEC-003). Sends webhooks to our API on user changes.
- **Supabase Postgres**: the single database for everything except Geography and static exam content. Accessed only from the server with the service role key; Row Level Security on, no public policies (`BACKEND_PRD.md` section 1).
- **Cloudflare R2**: private object storage for PDF files and for weekly database backups. No public URLs.
- An email service (DEC-018, OPEN), an analytics tool (DEC-017, OPEN) and an uptime monitor (OPEN) complete the external surface.

```
Visitor / User / Admin (browser)
        |
        v
  Next.js app on Vercel
   - Public pages (pre-rendered)
   - User area (per-request, after Clerk session)
   - Admin area (per-request, after admin check)
   - /api/* route handlers
        |-------------------|-------------------|------------------|
        v                   v                    v                  v
     Clerk            Supabase Postgres        Cloudflare R2     Email / analytics /
 (auth, webhooks)     (all app data except     (PDFs, backups)    uptime (all OPEN)
                       Geography/exam content,
                       accessed server-only)
```

Geography and static exam content (PPSC posts, blueprints, subjects, topics: DATA-16, DATA-17) are content files read at build time, not database tables (FINALIZED for Geography, PROPOSED for exam content).

## 2. Module boundaries

The backend is a modular monolith (`BACKEND_PRD.md` section 1), not separate services. Modules and what each owns:

| Module | Owns | Does not own |
|---|---|---|
| identity | Mirroring Clerk users into `profiles`, admin-email check, blocked-user check | Passwords, sessions, Google sign-in (Clerk's job) |
| quizzes | Quiz and question CRUD, publishing, import | Scoring an in-progress attempt (that is `attempts`) |
| attempts | Starting, saving, submitting, expiring, scoring quiz attempts | Quiz content itself |
| pdfs | Upload, versioning, publishing, download, stamping, storage measurement | Email sending |
| notifications | Admin bell items, new-user email trigger, daily digest content | How the email is actually sent (provider is OPEN, DEC-018) |
| admin | Admin-only read surfaces: dashboard totals, user list and detail, participation, activity log, exports | Any business rule already owned by another module; admin reads through the same functions other modules expose |
| analytics | Visit-count integration (OPEN, DEC-017) | Named user activity (that stays in `attempts` and `pdfs`) |
| jobs | Scheduled work: daily digest, attempt-expiry sweep, weekly reconciliation, weekly backup, health check | Anything triggered by a direct user request |

Rule carried from `BACKEND_PRD.md` section 2: the browser is never a trusted enforcement boundary. Every rule above is enforced in the module's server code, not in the client.

## 3. Request flows

### 3.1 Identity sync (FEAT-06; `BACKEND_PRD.md` 4.1)
1. A visitor signs up or signs in through Clerk's dialog (UI-010). Clerk owns the credential, the Google flow and the verification code.
2. Clerk calls `POST /api/webhooks/clerk` (API-01) on `user.created`, `user.updated` or `user.deleted`.
3. The server verifies the Clerk signature and a 5-minute timestamp window; invalid requests get 400 and nothing is written.
4. The event ID is recorded in `webhook_events` (DATA-14) before anything else, so a retried webhook is a no-op.
5. `user.created` upserts a `profiles` row (DATA-01), creates an admin notification, and queues the immediate admin email (DEC-008).
6. If a signed-in user calls any API before the webhook lands, the server creates the profile from the Clerk session data as a safety net, so the user is never blocked by webhook delay.

### 3.2 Admin gating (FEAT-13; `BACKEND_PRD.md` 4.2)
Every request under `/admin` or `/api/admin/*` is checked, server-side, against four conditions: a valid Clerk session exists, the primary email is verified, that email is in the `ADMIN_EMAILS` environment variable (DEC-020), and the profile is not blocked. Failing any condition returns the same 404 as an unknown route. No admin state is ever decided in the browser.

### 3.3 Taking a quiz (FEAT-08, FEAT-09; `BACKEND_PRD.md` 4.4)
1. `POST /api/quizzes/{id}/attempts` (API-07): if an unexpired in-progress attempt already exists, it is returned as is; otherwise a new attempt snapshots the quiz's current settings and questions (with a stored shuffle seed), so later edits to the quiz never change an attempt already in progress.
2. The browser never receives correct answers before submission (API-08 strips them).
3. `PUT /api/attempts/{id}/answers/{questionId}` (API-09) saves one answer at a time, rejected with 409 once the deadline passes.
4. `POST /api/attempts/{id}/submit` (API-10) is idempotent and scores from the snapshot, never from the live quiz.
5. A scheduled job (`GET /api/cron/finalize-attempts`, part of API-33) sweeps expired, unfinalized attempts in bulk; any read of an expired attempt also finalizes it immediately as a safety net.

### 3.4 PDF upload (FEAT-17; `BACKEND_PRD.md` 4.6)
1. Admin requests a short-lived presigned upload URL (`POST /api/admin/pdfs/upload-url`, part of API-28) and uploads directly to a temporary R2 key, bypassing serverless request-size limits.
2. Admin submits the file's details; the server verifies the object exists, checks size and PDF signature, reads the page count, and computes a SHA-256 before moving the object to its final private key.
3. Any failed check deletes the temporary object and returns a clear error; nothing partial is left in the published library.

### 3.5 PDF download and stamping (FEAT-11, FEAT-12; `BACKEND_PRD.md` 4.7)
1. An active, signed-in, non-blocked user requests `GET /api/pdfs/{id}/download` (API-15).
2. The server creates a download row and access ID (DATA-09) before streaming anything.
3. The original file is read from the private bucket, stamped per page with the user's name, email and access ID (the owner's own watermark is left untouched), and streamed with `Content-Disposition: attachment` and `Cache-Control: no-store`.
4. Risk R-04 (stamping inside a serverless function's time and memory limits) is unresolved; the two fallback options on the table are caching a per-user stamped copy briefly, or moving stamping to a small separate worker. This is decided at the stack-confirmation stage, not here.

### 3.6 Admin dashboard (FEAT-14, FEAT-15; `BACKEND_PRD.md` 4.10)
`GET /api/admin/overview` (API-20) reads totals across modules; it does not own a separate copy of the data. The storage bar (`GET /api/admin/storage`, API-21) reads the latest `storage_snapshots` row and refreshes it if older than 10 minutes, rather than listing the bucket on every dashboard load.

### 3.7 Notifications (FEAT-18; `BACKEND_PRD.md` 4.8)
New-user and quiz-join events write to `admin_notifications` (DATA-10) immediately, for the dashboard bell. A scheduled job (`GET /api/cron/digest`, part of API-33) runs once daily, builds the summary email from rows not yet in `digest_runs` (DATA-15) for that date, and records the run so it can never send twice for the same day.

### 3.8 Backups and health (FEAT-27, FEAT-28; `BACKEND_PRD.md` 4.12)
A weekly GitHub Actions job, separate from the Vercel app, dumps the database, encrypts it, and uploads it to a separate R2 prefix, keeping the last 8 copies. `GET /api/health` (API-34) is polled by an external uptime monitor (OPEN) and checks the database connection only, returning 200 or 503 with no internal detail exposed.

## 4. What is explicitly not in this architecture

- No queue or message broker. Background work is scheduled jobs only (Vercel Cron or GitHub Actions), not event-driven processing.
- No cache layer. The admin bell polls the server every 60 seconds rather than using a push channel; there is no real-time transport (`BACKEND_PRD.md` section 1, 4.8).
- No ORM. The Supabase client is called directly from server code (`BACKEND_PRD.md` section 1).
- No separate backend service or second repository. One Next.js application holds the frontend, the API and the scheduled job handlers.

## 5. Environments and deployment

- Hosting: Vercel, production at `https://docmubashirchaudhry.vercel.app` (owner-provided). Staging and preview environments for Supabase and Clerk are PROPOSED, pending plan-limit verification (OQ-06).
- Secrets: Clerk, Supabase and R2 keys are set in Vercel environment variables (owner-provided, not independently verified). The `ADMIN_EMAILS` list lives the same way, read only by the server (DEC-020).
- Migrations: SQL migration files in the repository, applied to a staging Supabase project before production, each with a rollback note (`BACKEND_PRD.md` section 9).

## 6. Open items that affect this architecture

See `DECISION_LOG.md` for full context. The ones with direct architectural weight: OQ-01 (confirm the real deployed stack before building against these assumptions), OQ-06 (Vercel, Supabase, Clerk and R2 plan limits, which affect whether direct-to-R2 upload and the cron schedule work as designed), R-04 (PDF stamping inside serverless limits, fallback undecided).
