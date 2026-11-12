# Database & Storage Design (Supabase PostgreSQL + Cloudflare R2)

> Status: Migration & Type Contracts Ready (SQL ready to apply in Supabase)  
> Last updated: 2026-11-12

## 1. Hybrid storage split
| Data category | Storage engine | Access model |
|---|---|---|
| Country facts (`250` records), Geography guide, exam hub static text, public v2.0 JSON slices | Git-tracked JSON (`src/data/`) + static `/public/data/v1/` | Public, anonymous, CDN-cached (`npm run validate`) |
| User profiles, PDF metadata, download logs, quizzes, question bank, graded attempts, first-party page visits | **Supabase PostgreSQL** (`supabase/migrations/0001_v3_initial_schema.sql`) | Server Route Handlers + Row Level Security (RLS) |
| Protected study PDF binaries (`<= 50 MB`) | **Cloudflare R2 Private Bucket** (`docmubashirchaudhary`) | Private S3 API only; presigned upload/download URLs (`120-300s`) |

## 2. Canonical PostgreSQL schema (`supabase/migrations/0001_v3_initial_schema.sql`)
1. `public.profiles`:
   - `id uuid primary key references auth.users(id) on delete cascade`
   - `email text not null unique`
   - `auth_provider text check (auth_provider in ('google', 'email', 'unknown'))`
   - `display_name text`
   - `created_at timestamptz`, `last_active_at timestamptz`
   - `is_admin boolean not null default false` (client updates blocked; admin authority enforced server-side via `ADMIN_EMAILS`)
2. `public.pdf_resources`:
   - `id uuid primary key`, `slug text unique` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
   - `title`, `description`, `subject`, `exam_tag`, `tags text[]`
   - `file_key text unique` (Cloudflare R2 object key, server-only)
   - `file_size bigint (> 0)`, `sha256 text` (optional 64-hex), `watermark_confirmed boolean`
   - `is_published boolean`, `download_count bigint`, `uploaded_by uuid -> profiles.id`
   - `created_at`, `updated_at`
3. `public.pdf_access_log`:
   - `id uuid primary key`, `user_id uuid -> profiles.id on delete cascade`, `pdf_id uuid -> pdf_resources.id on delete cascade`, `downloaded_at timestamptz`
   - Indexed by `(user_id, downloaded_at desc)`, `(pdf_id, downloaded_at desc)`, `(downloaded_at desc)`.
4. `public.quizzes`:
   - `id uuid primary key`, `slug text unique`, `title`, `description`
   - `type text check (type in ('practice', 'mock'))`
   - `subject`, `exam_tag`, `time_limit_seconds integer` (nullable for untimed practice; > 0 when timed)
   - `negative_marking boolean`, `negative_marking_value numeric(4,2)` (0..5, default `0.25`), `pass_percentage numeric(5,2)` (0..100, default `40.00`)
   - `language text check (language in ('en', 'ur', 'bilingual'))`
   - `is_published boolean`, `created_by uuid -> profiles.id`
5. `public.quiz_questions`:
   - `id uuid primary key`, `quiz_id uuid -> quizzes.id on delete cascade` (nullable for general question bank items)
   - `subject`, `exam_tag`, `difficulty check ('easy'|'medium'|'hard')`, `language check ('en'|'ur'|'bilingual')`
   - `text_en text`, `text_ur text` (constraint `chk_quiz_questions_prompt_nonempty` requires at least one non-empty prompt)
   - `options jsonb` (array length 2..6), `correct_option text`, `explanation text`, `sort_order integer`
6. `public.quiz_attempts`:
   - `id uuid primary key`, `user_id uuid -> profiles.id on delete cascade`, `quiz_id uuid -> quizzes.id on delete cascade`
   - `score numeric(8,2)`, `max_score numeric(8,2)`, `percentage numeric(5,2)`, `passed boolean`
   - `correct_count`, `incorrect_count`, `unanswered_count`, `time_taken_seconds`, `auto_submitted boolean`
   - `answers jsonb`, `started_at timestamptz`, `created_at timestamptz`
7. `public.site_visits`:
   - `id uuid primary key`, `path text check (1..512)`, `user_id uuid -> profiles.id on delete set null`, `created_at timestamptz`

## 3. Database triggers & maintenance RPC
- `handle_new_auth_user()` (`after insert on auth.users`): automatically inserts/upserts the `public.profiles` row, normalizes email lowercase, derives `auth_provider` (`google`, `email`, `unknown`), and extracts `display_name`.
- `touch_updated_at()`: keeps `updated_at` current on updates to `pdf_resources`, `quizzes`, and `quiz_questions`.
- `increment_pdf_download_count()` (`after insert on pdf_access_log`): atomically increments `pdf_resources.download_count`.
- `prune_v3_analytics_logs(visit_retention_days integer default 180, pdf_log_retention_days integer default 365)`: `security definer` retention helper (minimum `7d` visits, `30d` download logs), revoked from `public`, `anon`, and `authenticated` and callable only via the admin route (`POST /api/admin/analytics/prune`) using `SUPABASE_SECRET_KEY`.

## 4. Row Level Security (RLS) model
RLS is enabled on all 7 tables:
- `profiles`: authenticated users can `SELECT` their own row and `UPDATE` only their own non-privilege fields (`is_admin` escalation blocked in `with check`).
- `pdf_access_log` & `quiz_attempts`: authenticated users can `SELECT` only rows where `auth.uid() = user_id` (no public leaderboard, no cross-user leakage).
- `quizzes`: `anon` and `authenticated` may `SELECT` only `is_published = true` rows.
- `pdf_resources`, `quiz_questions`, and `site_visits`: zero direct `anon` or `authenticated` policies. This guarantees `file_key` (Cloudflare R2 private object path), `correct_option`, `explanation`, and visitor logs are never readable directly via Supabase's public PostgREST API. All reads/writes go through verified Next.js server routes.

## 5. Cloudflare R2 bucket configuration checklist
- Keep `Public R2.dev Subdomain Access` **DISABLED** on the `docmubashirchaudhary` bucket.
- Do not set any `CLOUDFLARE_R2_PUBLIC_URL` variable in Vercel.
- Add a bucket CORS rule permitting `PUT` and `HEAD` from `https://docmubashirchaudhry.vercel.app` and `http://localhost:3000` (with `AllowedHeaders: ["content-type"]`) so browser-direct admin uploads via `/api/admin/pdfs/upload-url` succeed cleanly for files up to `50 MB`.
