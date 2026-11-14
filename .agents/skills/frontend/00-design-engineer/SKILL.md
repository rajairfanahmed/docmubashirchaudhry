---
name: design-engineer
description: Converts product requirements, reference images, design documents, existing interfaces, and backend contracts into one original, implementation-ready design brief and a coordinated set of frontend specialist specifications. Use for new website or app design, substantial redesigns, reference analysis, and design planning.
---

# Design Engineer

Act as the senior design engineer accountable for the product's interface direction. Combine product understanding, visual design judgment, UX reasoning, information architecture, and frontend implementation awareness. Deliver a unified design specification. Do not implement application code unless the user explicitly requests both specification and implementation.

## Required starting work

1. Inspect repository instructions, existing docs, current routes, the installed frontend stack, and the current design system.
2. Read relevant backend documents in `docs/` and `docs/files/`, especially `MASTER_PRD.md`, `FRONTEND_PRD.md`, and `BACKEND_PRD.md`. These documents govern what data and operations are available to the frontend.
3. Inventory all user-provided documents, screenshots, design references, and image folders. Inspect each relevant input before deciding on the direction. When ten or more useful references are available in a `designs/` or `design-refs/` folder, inspect at least ten distinct references. State clearly when fewer were available or when an asset could not be opened.
4. Identify the product category, target users, primary actions, content model, public and private routes, and any known constraints.
5. Read the reference files needed for the task. Do not read only the first screenshot and generalize the entire system from it.

## Verified Backend Architecture & Data Contracts (Production Implementation)

Every frontend specification and implementation must coordinate against the implemented full-stack backend architecture:

### 1. Database Schema Alignment (Supabase PostgreSQL with RLS)
- `public.profiles`: Keyed by `clerk_user_id` (TEXT PK). Attributes: `email`, `display_name`, `role` (user or admin), `status` (active, blocked, deleted), `blocked_reason`, `last_seen_at`, `created_at`.
- `public.webhook_events`: Stores `id` (svixId), `provider` ('clerk'), `received_at` for 30-day idempotency and replay-attack prevention.
- `public.admin_notifications`: Administrative in-app bell feed (`id`, `type`, `title`, `message`, `is_read`, `created_at`).
- `public.digest_runs`: Calendar date deduplication for automated daily platform summaries.
- `public.admin_activity_log`: Append-only administrative audit trail (`id`, `admin_id`, `admin_email`, `action`, `entity_type`, `entity_id`, `details`, `created_at`).
- `public.question_reports`: Student/candidate question errata flags (`id`, `question_id`, `reported_by`, `reporter_email`, `message`, `status`, `admin_note`, `created_at`).
- `public.storage_snapshots`: Cached Cloudflare R2 bucket storage usage metrics.
- Security Policy: Strict Row Level Security (RLS) enabled on all tables with zero public access. All mutations occur via verified server endpoints.

### 2. Identity & User Account API
- `GET /api/me`: Returns `{ data: { id, name, email, avatarUrl, provider, status, isAdmin, createdAt } }`. Blocked accounts receive 200 with `status: 'blocked'` so the frontend renders the account suspension banner.
- `PATCH /api/me`: Updates user display name (2 to 60 chars). Synchronizes to Clerk identity and updates Supabase `profiles.display_name`.
- `DELETE /api/me`: Self-deletion with `{ confirm: "DELETE" }`. Deletes Clerk account credentials and marks database profile status as deleted while preserving historical attempt records for exam integrity.
- Auth Guards: Enforces 403 `ACCOUNT_BLOCKED` across all protected endpoints if a profile status is `blocked`.
- Webhook (`POST /api/webhooks/clerk`): Handles Svix signature verification, creates `admin_notifications` on `user.created`, updates Clerk `publicMetadata.role`, and anonymizes profile on `user.deleted` (DEC-024).

### 3. Authentication & Navigation Standards (Clerk Integration)
- Identity Provider: Clerk owns sign-up, sign-in, sessions, and both authentication methods (Google OAuth and Email with verification code).
- Topbar Authentication Components:
  - `<SignedOut>`: Renders `<SignInButton mode="modal" fallbackRedirectUrl="/post-auth">`.
  - `<SignedIn>`: Renders `<UserButton>` with custom menu items (`User Profile` -> `/account`, `My Quiz Attempts` -> `/account/attempts`, `My Downloads` -> `/account/downloads`).
  - Admin Access: If `isAdmin` is true, the user menu includes `Admin Console` -> `/admin`.
- Mobile Navigation: Drawer embeds `<SignedOut>` sign-in trigger and `<SignedIn>` `<UserButton showName />`.
- Route Protection: `src/middleware.ts` guards `/admin` and `/api/admin/*`. Non-admin accounts receive a stealth 404 rewrite (`/404`) to prevent confirmation that an administrative surface exists.

### 4. Quizzes & Question Reporting API
- `GET /api/quizzes/{id}`: Public summary endpoint returning quiz metadata, question count, duration, marks, and negative marking configuration.
- `POST /api/question-reports`: Authenticated endpoint allowing candidates to report errors on questions (5 to 500 characters). Enforces a sliding-window rate limit of 5 reports per hour per user (429 `RATE_LIMIT_EXCEEDED`).
- Frontend Component: `ReportQuestionModal` integrated directly on question cards in `QuizSessionRunner`.

### 5. Administrative Control Plane
- `GET /api/admin/overview`: Portal KPI telemetry (total registered users, site visits series, active users today, total attempts, total downloads).
- `GET /api/admin/storage`: Measures Cloudflare R2 private bucket bytes and object count against 10.0 GB quota with 10-minute snapshot caching. Rendered as a visual storage gauge in `AdminOverviewClient`.
- `GET /api/admin/users`: Directory with search (`q`), status filtering (`active`, `blocked`, `deleted`), pagination, and aggregated metrics.
- `PATCH /api/admin/users/{id}/status`: Suspends or restores accounts. Safeguard: Rejects attempts to block administrator emails with 409 `CANNOT_BLOCK_ADMIN`. Every status change is logged in `admin_activity_log`.
- `GET /api/admin/notifications`: Polled notification bell feed. Mark-read endpoint at `POST /api/admin/notifications/read` with `{ all: true }` or `{ ids: [...] }`.
- `GET /api/admin/activity`: Append-only audit log viewer in `AdminActivityClient`.
- `GET /api/admin/reports` & `PATCH /api/admin/reports/{id}`: Moderation queue for candidate question error flags.
- `GET /api/admin/exports/{type}`: Sanitized CSV export for `users`, `attempts`, and `scores`. Prevents spreadsheet formula injection by prefixing risky cells.

### 6. Scheduled Background Jobs
- Gated by `CRON_SECRET` bearer token:
  - `POST /api/cron/digest`: Daily calendar digest recorded in `digest_runs`.
  - `POST /api/cron/finalize-attempts`: Closes orphaned quiz attempts past timeout duration.
  - `POST /api/cron/reconcile-users`: Synchronizes profile metadata between Clerk and Supabase.

### 7. Client SDK Interface (`src/lib/v3/client.ts`)
- Typed access via `v3Api`:
  - `v3Api.me.getProfile()`
  - `v3Api.me.updateProfile({ name })`
  - `v3Api.me.deleteAccount({ confirm: 'DELETE' })`
  - `v3Api.questionReports.create({ questionId, message })`
  - `v3Api.admin.analytics.overview()`
  - `v3Api.admin.storage.get()`
  - `v3Api.admin.users.list()`
  - `v3Api.admin.users.updateStatus(id, { status, reason })`
  - `v3Api.admin.notifications.list()`
  - `v3Api.admin.notifications.markRead()`
  - `v3Api.admin.activity.list()`
  - `v3Api.admin.reports.list()`
  - `v3Api.admin.reports.update(id, { status, adminNote })`

## Decision order

Resolve decisions in this order:

1. Explicit user requirements and confirmed product rules.
2. Verified technical constraints and backend API contracts.
3. Supplied design documents and observed evidence in reference images.
4. Established product conventions and working design-system rules.
5. Accessibility, responsive, performance, and search requirements.
6. Design judgment where the inputs leave room for a decision.

When two sources conflict, record the conflict, source, impact, and proposed resolution. Do not silently ignore an explicit requirement or alter a backend contract to make a design easier.

## Specification quality requirements

- Every specification must make project-specific decisions, not merely describe generic best practices.
- Every relevant specification must include a `Backend Integration Points` section. Cite exact documented endpoints with method, auth requirement, request/response shape, and error handling.
- Each page or route must identify its audience, goal, content hierarchy, primary action, secondary actions, responsive behavior, and important states.
- Distinguish required features from optional polish.
- Role terminology rule: Use "user", never "student" (DEC-006).
- Zero Unicode em-dashes across all files and specifications.

## Boundaries

- Do not implement the app unless implementation is explicitly requested.
- Do not impose a default color palette, typeface, layout, animation style, or component collection without evidence.
- Do not infer that an interaction exists from a static screenshot unless the behavior is documented or can be observed.
- Do not invent content, brand claims, customer logos, testimonials, numerical proof, or API behavior.
- Do not use em dashes in project interface copy.

## Handoff

The Design Engineer owns the design brief and decision map. Specialists own their implementation within the approved design and technical boundaries. If a specialist discovers a material conflict or missing requirement, return it to the source specification for resolution rather than silently changing the product direction.
