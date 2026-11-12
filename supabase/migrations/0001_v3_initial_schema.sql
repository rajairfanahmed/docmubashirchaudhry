-- docmubashirchaudhry Platform Upgrade (v3.0)
-- Initial PostgreSQL schema, triggers, Row Level Security (RLS), and retention helpers
-- Safe to run in Supabase SQL Editor or via `supabase db push`

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  auth_provider text not null default 'email'
    check (auth_provider in ('google', 'email', 'unknown')),
  display_name text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  is_admin boolean not null default false
);

create index if not exists idx_profiles_created_at
  on public.profiles (created_at desc);

create index if not exists idx_profiles_last_active_at
  on public.profiles (last_active_at desc);

-- Automatically provision a profile whenever a new Supabase Auth user signs up
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_provider text;
  normalized_provider text;
  resolved_name text;
begin
  raw_provider := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  if raw_provider = 'google' then
    normalized_provider := 'google';
  elsif raw_provider = 'email' then
    normalized_provider := 'email';
  else
    normalized_provider := 'unknown';
  end if;

  resolved_name := nullif(
    trim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )),
    ''
  );

  insert into public.profiles (id, email, auth_provider, display_name, created_at, last_active_at, is_admin)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    normalized_provider,
    resolved_name,
    coalesce(new.created_at, now()),
    now(),
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        auth_provider = excluded.auth_provider,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        last_active_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Shared updated_at timestamp trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. PDF Resources (metadata only; private binary files live in Cloudflare R2)
-- ---------------------------------------------------------------------------
create table if not exists public.pdf_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 3 and 200),
  description text not null default '',
  subject text not null check (char_length(trim(subject)) between 2 and 120),
  exam_tag text not null check (char_length(trim(exam_tag)) between 2 and 80),
  tags text[] not null default '{}',
  file_key text not null unique check (char_length(trim(file_key)) >= 5),
  file_size bigint not null check (file_size > 0),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  watermark_confirmed boolean not null default false,
  is_published boolean not null default true,
  download_count bigint not null default 0 check (download_count >= 0),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdf_resources_published_created
  on public.pdf_resources (is_published, created_at desc);

create index if not exists idx_pdf_resources_subject_exam
  on public.pdf_resources (subject, exam_tag);

create index if not exists idx_pdf_resources_downloads
  on public.pdf_resources (download_count desc, created_at desc);

drop trigger if exists trg_pdf_resources_updated_at on public.pdf_resources;
create trigger trg_pdf_resources_updated_at
  before update on public.pdf_resources
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. PDF Access Log (tracks every signed download click by authenticated user)
-- ---------------------------------------------------------------------------
create table if not exists public.pdf_access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pdf_id uuid not null references public.pdf_resources (id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index if not exists idx_pdf_access_log_user_downloaded
  on public.pdf_access_log (user_id, downloaded_at desc);

create index if not exists idx_pdf_access_log_pdf_downloaded
  on public.pdf_access_log (pdf_id, downloaded_at desc);

create index if not exists idx_pdf_access_log_downloaded_at
  on public.pdf_access_log (downloaded_at desc);

create or replace function public.increment_pdf_download_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pdf_resources
  set download_count = download_count + 1
  where id = new.pdf_id;
  return new;
end;
$$;

drop trigger if exists trg_pdf_access_log_increment on public.pdf_access_log;
create trigger trg_pdf_access_log_increment
  after insert on public.pdf_access_log
  for each row execute function public.increment_pdf_download_count();

-- ---------------------------------------------------------------------------
-- 4. Quizzes (Practice Quizzes & Full-Length Mock Exams)
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 3 and 200),
  description text not null default '',
  type text not null check (type in ('practice', 'mock')),
  subject text not null check (char_length(trim(subject)) between 2 and 120),
  exam_tag text not null check (char_length(trim(exam_tag)) between 2 and 80),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  negative_marking boolean not null default false,
  negative_marking_value numeric(4, 2) not null default 0.25
    check (negative_marking_value >= 0 and negative_marking_value <= 5),
  pass_percentage numeric(5, 2) not null default 40.00
    check (pass_percentage >= 0 and pass_percentage <= 100),
  language text not null default 'en'
    check (language in ('en', 'ur', 'bilingual')),
  is_published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quizzes_published_created
  on public.quizzes (is_published, created_at desc);

create index if not exists idx_quizzes_type_subject_exam
  on public.quizzes (type, subject, exam_tag);

drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Quiz Questions (Bilingual English / Urdu support; server-only answer keys)
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes (id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 2 and 120),
  exam_tag text not null check (char_length(trim(exam_tag)) between 2 and 80),
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  language text not null default 'en'
    check (language in ('en', 'ur', 'bilingual')),
  text_en text,
  text_ur text,
  options jsonb not null
    check (
      jsonb_typeof(options) = 'array'
      and jsonb_array_length(options) between 2 and 6
    ),
  correct_option text not null check (char_length(trim(correct_option)) >= 1),
  explanation text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_quiz_questions_prompt_nonempty check (
    (text_en is not null and char_length(trim(text_en)) > 0)
    or (text_ur is not null and char_length(trim(text_ur)) > 0)
  )
);

create index if not exists idx_quiz_questions_quiz_order
  on public.quiz_questions (quiz_id, sort_order, created_at);

create index if not exists idx_quiz_questions_subject_exam_diff
  on public.quiz_questions (subject, exam_tag, difficulty);

drop trigger if exists trg_quiz_questions_updated_at on public.quiz_questions;
create trigger trg_quiz_questions_updated_at
  before update on public.quiz_questions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Quiz Attempts (Server-graded attempt records; private per user)
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  score numeric(8, 2) not null,
  max_score numeric(8, 2) not null check (max_score >= 0),
  percentage numeric(5, 2) not null,
  passed boolean not null default false,
  correct_count integer not null check (correct_count >= 0),
  incorrect_count integer not null check (incorrect_count >= 0),
  unanswered_count integer not null default 0 check (unanswered_count >= 0),
  time_taken_seconds integer not null check (time_taken_seconds >= 0),
  auto_submitted boolean not null default false,
  answers jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_user_created
  on public.quiz_attempts (user_id, created_at desc);

create index if not exists idx_quiz_attempts_quiz_created
  on public.quiz_attempts (quiz_id, created_at desc);

create index if not exists idx_quiz_attempts_created_at
  on public.quiz_attempts (created_at desc);

-- ---------------------------------------------------------------------------
-- 7. First-Party Site Visits (lightweight usage metrics for admin overview)
-- ---------------------------------------------------------------------------
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null check (char_length(path) between 1 and 512),
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_visits_created_at
  on public.site_visits (created_at desc);

create index if not exists idx_site_visits_path_created
  on public.site_visits (path, created_at desc);

create index if not exists idx_site_visits_user_created
  on public.site_visits (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- Note: Next.js API Route Handlers mediate privileged/graded writes & signed
-- URL generation via SUPABASE_SECRET_KEY after strict server session + admin
-- email allow-list verification. Direct PostgREST client access is tightly
-- locked down so private R2 keys and quiz answer keys are never exposed.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pdf_resources enable row level security;
alter table public.pdf_access_log enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.site_visits enable row level security;

-- Profiles: user can read only their own profile and update only display_name
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- PDF access log: users see only their own download history; writes happen server-side
drop policy if exists "pdf_access_log_select_own" on public.pdf_access_log;
create policy "pdf_access_log_select_own"
  on public.pdf_access_log for select
  to authenticated
  using (auth.uid() = user_id);

-- Published quizzes catalog can be read; question answers stay server-sealed
drop policy if exists "quizzes_select_published" on public.quizzes;
create policy "quizzes_select_published"
  on public.quizzes for select
  to anon, authenticated
  using (is_published = true);

-- Quiz attempts: private per user (no public leaderboard); writes graded server-side
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

-- pdf_resources, quiz_questions, and site_visits have NO anon/authenticated
-- direct policies so file_key, correct_option, and visitor logs remain
-- strictly server-mediated through Next.js API Route Handlers.

-- ---------------------------------------------------------------------------
-- 9. Log Retention Maintenance Helper (Open Item #3 safeguard)
-- ---------------------------------------------------------------------------
create or replace function public.prune_v3_analytics_logs(
  visit_retention_days integer default 180,
  pdf_log_retention_days integer default 365
)
returns table (deleted_visits bigint, deleted_pdf_logs bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visits bigint;
  v_pdf_logs bigint;
begin
  if visit_retention_days < 7 or pdf_log_retention_days < 30 then
    raise exception 'Retention windows too short (visits >= 7d, pdf_logs >= 30d)';
  end if;

  delete from public.site_visits
  where created_at < now() - make_interval(days => visit_retention_days);
  get diagnostics v_visits = row_count;

  delete from public.pdf_access_log
  where downloaded_at < now() - make_interval(days => pdf_log_retention_days);
  get diagnostics v_pdf_logs = row_count;

  return query select v_visits, v_pdf_logs;
end;
$$;

revoke all on function public.prune_v3_analytics_logs(integer, integer) from public, anon, authenticated;

