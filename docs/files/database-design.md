# Database Design

> Last updated: 2026-11-14
> Status: PROPOSED. Expands the summary in `BACKEND_PRD.md` section 3 into field-level detail. Column types, constraints and indexes below are an engineering elaboration of approved requirements, not separately owner-approved; treat them as the working schema to review at the stack-confirmation checkpoint, not as finalized.
> Engine: Supabase Postgres (FINALIZED, DEC-004 family). Row Level Security is on for every table below with no public policies; all access goes through server code using the service role key (`BACKEND_PRD.md` section 1). Geography and exam content (DATA-16, DATA-17) are content files, not tables, and are not listed here.

## Conventions
- Every table has `id uuid primary key default gen_random_uuid()` unless a natural key is more appropriate (noted per table).
- Timestamps are `timestamptz`, stored in UTC.
- Enums are implemented as Postgres `check` constraints on a `text` column, not native enum types, so new values do not require a type migration.
- Foreign keys use `on delete restrict` by default, except where the business rule requires a cascade or a set-null, noted per table.

## DATA-01: profiles
Our copy of each Clerk user. One row per account.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| clerk_user_id | text | unique, not null |
| email | text | not null |
| full_name | text | nullable |
| avatar_url | text | nullable |
| auth_provider | text | not null, check in (`google`, `email`) |
| status | text | not null, default `active`, check in (`active`, `blocked`, `deleted`) |
| blocked_reason | text | nullable |
| created_at | timestamptz | not null, default now() |
| last_seen_at | timestamptz | nullable |

Indexes: unique on `clerk_user_id`; index on `status` (admin filters, DEC-023 block flow); index on `email` (admin search).
Ownership: the user reads and edits their own row (name only); admins read all (`BACKEND_PRD.md` section 2, 3).
Lifecycle: created and updated by the Clerk webhook (API-01); `status` changed by admin block/unblock (API-24) or by account deletion (API-04), which anonymizes `email`, `full_name`, `avatar_url` and sets `status = 'deleted'` (DEC-024, still OPEN on attempt/download retention).

## DATA-02: quizzes
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| title | text | not null, 3 to 120 chars |
| description | text | nullable |
| exam | text | not null |
| post_slug | text | nullable, references a static exam-content post (DATA-16), not a foreign key since that content is file-based |
| type | text | not null, check in (`topic`, `post_wise`, `mock`, `full_length`) |
| language_label | text | not null, check in (`en`, `ur`, `mixed`) |
| duration_minutes | integer | nullable (null means no timer), check (duration_minutes is null or duration_minutes between 1 and 600) |
| marks_per_question | numeric(6,2) | not null, check (marks_per_question > 0) |
| negative_marking_enabled | boolean | not null, default false |
| negative_marking_value | numeric(6,2) | nullable, check (not negative_marking_enabled or (negative_marking_value >= 0 and negative_marking_value <= marks_per_question)) |
| shuffle_questions | boolean | not null, default false |
| shuffle_options | boolean | not null, default false |
| status | text | not null, default `draft`, check in (`draft`, `published`, `archived`) |
| created_by | uuid | references profiles(id), not null |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now() |

Indexes: index on (`status`, `exam`, `type`) for the public list (API-05); index on `created_by` for admin views.
Rule: a quiz needs at least one row in `quiz_questions` before it can move to `status = 'published'` (enforced in application code, not a database constraint, since the check spans two tables).

## DATA-03: questions
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| language | text | not null, check in (`en`, `ur`, `mixed`) |
| text | text | not null, 3 to 2000 chars |
| explanation | text | nullable, up to 4000 chars |
| exam | text | not null |
| subject | text | not null |
| topic | text | not null |
| difficulty | text | nullable |
| status | text | not null, default `active`, check in (`active`, `archived`) |
| source_note | text | nullable |
| created_by | uuid | references profiles(id), not null |
| created_at | timestamptz | not null, default now() |
| updated_at | timestamptz | not null, default now() |

Indexes: index on (`exam`, `subject`, `topic`); index on `language` (Urdu-content filtering, NFR-07); full-text index on `text` for admin search.
Rule: a question used in any published quiz cannot be deleted, only archived (`BACKEND_PRD.md` 4.5); enforced in application code before a delete is attempted.

## DATA-04: question_options
Exactly four rows per question, one marked correct.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| question_id | uuid | references questions(id) on delete cascade, not null |
| label | text | not null, check in (`A`, `B`, `C`, `D`) |
| text | text | not null, 1 to 500 chars |
| is_correct | boolean | not null, default false |

Constraints: unique (`question_id`, `label`); a partial unique index on (`question_id`) where `is_correct` ensures exactly one correct option per question (`create unique index on question_options (question_id) where is_correct`); application code also checks all four option texts differ after trimming, since that comparison is awkward to express as a plain constraint.

## DATA-05: quiz_questions
Which questions belong to a quiz, in order, with an optional per-quiz marks override.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| quiz_id | uuid | references quizzes(id) on delete cascade, not null |
| question_id | uuid | references questions(id), not null |
| section_id | uuid | references quiz_sections(id), nullable (mocks only) |
| order_index | integer | not null |
| marks_override | numeric(6,2) | nullable |

Indexes: unique (`quiz_id`, `question_id`); index on (`quiz_id`, `order_index`).

## DATA-13: quiz_sections
Named sections inside a full-length mock test.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| quiz_id | uuid | references quizzes(id) on delete cascade, not null |
| title | text | not null |
| order_index | integer | not null |

## DATA-06: quiz_attempts
One row per attempt. Stores a snapshot so later quiz edits never change a stored result.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| quiz_id | uuid | references quizzes(id), not null |
| user_id | uuid | references profiles(id), not null |
| status | text | not null, default `in_progress`, check in (`in_progress`, `submitted`, `auto_submitted`) |
| snapshot | jsonb | not null, the quiz settings and questions as they existed at start, including the shuffle seed |
| started_at | timestamptz | not null, default now() |
| deadline_at | timestamptz | nullable |
| submitted_at | timestamptz | nullable |
| score | numeric(8,2) | nullable |
| total_marks | numeric(8,2) | nullable |
| correct_count | integer | nullable |
| incorrect_count | integer | nullable |
| unanswered_count | integer | nullable |
| percent | numeric(5,2) | nullable |

Indexes: index on (`user_id`, `quiz_id`, `status`) to find an existing in-progress attempt quickly (API-07's no-duplicate rule); index on `deadline_at` where `status = 'in_progress'` for the expiry sweeper job.
Rule: at most one `in_progress` attempt per (`user_id`, `quiz_id`); enforced in application code at creation time (`BACKEND_PRD.md` 9, concurrency).

## DATA-07: attempt_answers
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| attempt_id | uuid | references quiz_attempts(id) on delete cascade, not null |
| question_id | uuid | not null, matched against the attempt's own snapshot, not a live foreign key to `questions` |
| selected_label | text | nullable, check in (`A`, `B`, `C`, `D`) |
| flagged | boolean | not null, default false |
| updated_at | timestamptz | not null, default now() |

Indexes: unique (`attempt_id`, `question_id`), so saving an answer is an upsert (API-09).

## DATA-08: pdf_resources
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| slug | text | unique, not null |
| title | text | not null, 3 to 150 chars |
| description | text | nullable |
| exam | text | not null |
| subject | text | nullable |
| topic | text | nullable |
| year | integer | nullable, check (year is null or year between 1990 and extract(year from now())::int) |
| author | text | not null, default `Doc Mubashir Chaudhry` |
| rights_note | text | nullable |
| storage_key | text | not null |
| size_bytes | bigint | not null |
| pages | integer | not null |
| sha256 | text | not null |
| version | integer | not null, default 1 |
| status | text | not null, default `draft`, check in (`draft`, `published`, `archived`) |
| verified | boolean | not null, default false |
| created_by | uuid | references profiles(id), not null |
| created_at | timestamptz | not null, default now() |

Indexes: index on (`status`, `exam`, `subject`); index on `slug`.
Rule: replacing the file creates the next `version` row (or increments `version` with the old object kept at a separate storage key); exact versioning mechanics are an implementation detail left open at build time.

## DATA-09: pdf_downloads
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| pdf_id | uuid | references pdf_resources(id), not null |
| user_id | uuid | references profiles(id), not null |
| access_id | text | unique, not null, the ID stamped on the file |
| status | text | not null, default `started`, check in (`started`, `completed`, `failed`) |
| created_at | timestamptz | not null, default now() |

Indexes: index on (`user_id`, `created_at`) for My Downloads (API-16) and the admin's per-user view; index on `pdf_id` for per-resource download counts; index on (`user_id`, `created_at`) also supports the daily-volume flag (FEAT-29).

## DATA-10: admin_notifications
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| type | text | not null, check in (`new_user`, `quiz_joined`) |
| user_id | uuid | references profiles(id), nullable (kept even if the user is later deleted, so set null rather than cascade) |
| quiz_id | uuid | references quizzes(id), nullable |
| read_at | timestamptz | nullable |
| email_status | text | not null, default `pending`, check in (`pending`, `sent`, `failed`) |
| created_at | timestamptz | not null, default now() |

`user_id` and `quiz_id` use `on delete set null` so a notification history survives account deletion, consistent with DATA-01's anonymize-not-delete approach (DEC-024).
Retention: 90 days (`BACKEND_PRD.md` section 3), removed by a scheduled job not yet specified in detail.

## DATA-15: digest_runs
Prevents the daily summary email from sending twice for the same date.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| run_date | date | unique, not null |
| sent_at | timestamptz | not null, default now() |
| recipient_count | integer | not null |

## DATA-11: admin_activity_log
Append-only.

| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| admin_id | uuid | references profiles(id), not null |
| action | text | not null |
| entity_type | text | not null |
| entity_id | uuid | nullable |
| details | jsonb | nullable |
| created_at | timestamptz | not null, default now() |

Indexes: index on (`admin_id`, `created_at`); index on (`entity_type`, `entity_id`).
Rule: rows are inserted only, never updated or deleted by application code.

## DATA-12: question_reports
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| question_id | uuid | references questions(id), not null |
| reported_by | uuid | references profiles(id), not null |
| message | text | not null, 5 to 500 chars |
| status | text | not null, default `new`, check in (`new`, `looked_at`, `fixed`, `not_an_issue`) |
| created_at | timestamptz | not null, default now() |

Indexes: index on (`status`, `created_at`).

## DATA-14: webhook_events
| Column | Type | Constraints |
|---|---|---|
| id | text | primary key, the provider's event ID |
| provider | text | not null, default `clerk` |
| received_at | timestamptz | not null, default now() |

Retention: 30 days (`BACKEND_PRD.md` section 3), removed by a scheduled job not yet specified in detail.

## DATA-18: storage_snapshots
| Column | Type | Constraints |
|---|---|---|
| id | uuid | primary key |
| used_bytes | bigint | not null |
| object_count | integer | not null |
| checked_at | timestamptz | not null, default now() |

Only the latest row matters for the dashboard; older rows can be pruned by a scheduled job, kept briefly for a trend line if the dashboard ever wants one (not currently specified).

## Entity relationship summary
```
profiles 1---* quiz_attempts *---1 quizzes
quizzes 1---* quiz_questions *---1 questions 1---4 question_options
quizzes 1---* quiz_sections
quiz_attempts 1---* attempt_answers
profiles 1---* pdf_downloads *---1 pdf_resources
profiles 1---* admin_notifications (nullable link, survives deletion)
profiles 1---* admin_activity_log (as admin_id)
profiles 1---* question_reports (as reported_by)
```

## Retention summary
Restated from `BACKEND_PRD.md` section 3 for reference here:
- `profiles`: kept (anonymized) until deletion; see DEC-024, still OPEN on attempt/download handling.
- `quiz_attempts`, `attempt_answers`: kept until account deletion, then kept anonymously for statistics (PROPOSED, OPEN).
- `pdf_downloads`, `admin_activity_log`: 12 months (OPEN, exact period not yet owner-confirmed).
- `admin_notifications`: 90 days.
- `webhook_events`: 30 days.
- Weekly encrypted database backups: last 8 copies kept in R2.

## Open items that affect this schema
DEC-024 (exact attempt/download handling on account deletion), DEC-025 (whether a negative `score` is floored before storage or only at display time; this schema currently stores the raw, possibly negative value and leaves flooring to the API layer), OQ-07 (the `allowanceBytes` figure the storage bar compares `storage_snapshots` against lives in configuration, not in this table). See `DECISION_LOG.md`.
