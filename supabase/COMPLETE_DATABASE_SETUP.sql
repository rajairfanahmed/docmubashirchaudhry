-- ============================================================================
-- DocMubashir Exam Portal - Complete Database Schema & Initial Data Setup
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New query -> RUN
-- 100% compatible with Clerk user IDs (text) and zero foreign-key type mismatches.
-- ============================================================================

-- 1. PROFILES TABLE (Mirrors Clerk identity + User state)
create table if not exists public.profiles (
  clerk_user_id text primary key,
  id text not null,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_admin boolean not null default false,
  status text not null default 'active' check (status in ('active', 'blocked', 'deleted')),
  blocked_reason text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- Ensure all columns exist if table was partially created
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clerk_user_id') then
    alter table public.profiles add column clerk_user_id text primary key;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'id') then
    alter table public.profiles add column id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text not null default 'active' check (status in ('active', 'blocked', 'deleted'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'blocked_reason') then
    alter table public.profiles add column blocked_reason text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_seen_at') then
    alter table public.profiles add column last_seen_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text not null default 'user' check (role in ('user', 'admin'));
  end if;
end $$;

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_created_at on public.profiles (created_at desc);

-- 2. QUIZZES TABLE (Catalog of practice quizzes & timed mock exams)
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  type text not null default 'practice' check (type in ('practice', 'mock')),
  subject text not null default 'General Knowledge',
  exam_tag text not null default 'PPSC',
  time_limit_seconds integer,
  negative_marking boolean not null default false,
  negative_marking_value numeric(4, 2) not null default 0.25,
  pass_percentage numeric(5, 2) not null default 40.0,
  language text not null default 'en' check (language in ('en', 'ur', 'bilingual')),
  is_published boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quizzes_slug on public.quizzes (slug);
create index if not exists idx_quizzes_published on public.quizzes (is_published, type, created_at desc);

-- 3. QUIZ QUESTIONS TABLE
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes (id) on delete cascade,
  subject text not null default 'General Knowledge',
  exam_tag text not null default 'PPSC',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  language text not null default 'en' check (language in ('en', 'ur', 'bilingual')),
  text_en text,
  text_ur text,
  options jsonb not null default '[]'::jsonb,
  correct_option text not null,
  explanation text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quiz_questions_quiz_order on public.quiz_questions (quiz_id, sort_order, created_at);

-- 4. QUIZ ATTEMPTS TABLE (Stores student scores; user_id is text for Clerk IDs)
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
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

create index if not exists idx_quiz_attempts_user_created on public.quiz_attempts (user_id, created_at desc);
create index if not exists idx_quiz_attempts_quiz_created on public.quiz_attempts (quiz_id, created_at desc);
create index if not exists idx_quiz_attempts_created_at on public.quiz_attempts (created_at desc);

-- 5. PDF RESOURCES TABLE (Metadata for verified past paper downloads)
create table if not exists public.pdf_resources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  subject text not null default 'General Knowledge',
  exam_tag text not null default 'PPSC',
  year integer not null default 2026,
  language text not null default 'en' check (language in ('en', 'ur', 'bilingual')),
  page_count integer not null default 1,
  file_bytes bigint not null default 0,
  file_key text not null,
  sha256 text not null default '',
  is_published boolean not null default false,
  download_count integer not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pdf_resources_slug on public.pdf_resources (slug);
create index if not exists idx_pdf_resources_published on public.pdf_resources (is_published, exam_tag, year desc);

-- 6. PDF ACCESS LOG (Records authorized student downloads)
create table if not exists public.pdf_access_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  pdf_id uuid not null references public.pdf_resources (id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index if not exists idx_pdf_access_log_user_downloaded on public.pdf_access_log (user_id, downloaded_at desc);
create index if not exists idx_pdf_access_log_pdf_downloaded on public.pdf_access_log (pdf_id, downloaded_at desc);

-- 7. SITE VISITS TABLE (Usage analytics for admin dashboard)
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_visits_created_at on public.site_visits (created_at desc);
create index if not exists idx_site_visits_path_created on public.site_visits (path, created_at desc);

-- 8. ADMIN NOTIFICATIONS TABLE (Admin notification bell queue)
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('new_user', 'quiz_joined')),
  user_id text,
  quiz_id uuid references public.quizzes (id) on delete set null,
  title text not null default '',
  message text not null default '',
  read_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_unread on public.admin_notifications (read_at, created_at desc);

-- 9. ADMIN ACTIVITY LOG (Append-only audit trail)
create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null,
  admin_email text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_activity_log_admin_time on public.admin_activity_log (admin_id, created_at desc);
create index if not exists idx_admin_activity_log_entity on public.admin_activity_log (entity_type, entity_id);

-- 10. QUESTION REPORTS TABLE (Student question feedback & error flags)
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  reported_by text not null,
  reporter_email text not null default '',
  message text not null check (char_length(trim(message)) between 5 and 500),
  status text not null default 'new' check (status in ('new', 'looked_at', 'fixed', 'not_an_issue')),
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_reports_status_time on public.question_reports (status, created_at desc);

-- 11. STORAGE SNAPSHOTS TABLE (Cloudflare R2 usage metric cache)
create table if not exists public.storage_snapshots (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null,
  total_bytes bigint not null default 0,
  object_count integer not null default 0,
  measured_at timestamptz not null default now()
);

create index if not exists idx_storage_snapshots_measured on public.storage_snapshots (bucket_name, measured_at desc);

-- 12. DIGEST RUNS TABLE (Daily summary email deduplication)
create table if not exists public.digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date unique not null,
  sent_at timestamptz not null default now(),
  recipient_count integer not null default 0
);

-- 13. WEBHOOK EVENTS TABLE (Clerk webhook replay attack prevention)
create table if not exists public.webhook_events (
  id text primary key,
  provider text not null default 'clerk',
  received_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_received_at on public.webhook_events (received_at desc);

-- 14. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.pdf_resources enable row level security;
alter table public.pdf_access_log enable row level security;
alter table public.site_visits enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.question_reports enable row level security;
alter table public.storage_snapshots enable row level security;
alter table public.digest_runs enable row level security;
alter table public.webhook_events enable row level security;

-- Allow public read of published quizzes
drop policy if exists "quizzes_select_published" on public.quizzes;
create policy "quizzes_select_published" on public.quizzes for select to anon, authenticated using (is_published = true);

-- Allow public read of published pdf resources
drop policy if exists "pdf_resources_select_published" on public.pdf_resources;
create policy "pdf_resources_select_published" on public.pdf_resources for select to anon, authenticated using (is_published = true);

-- 15. SEED INITIAL QUIZZES (PPSC Intelligence Officer Mock & World Geography Practice)
insert into public.quizzes (id, slug, title, description, type, subject, exam_tag, time_limit_seconds, negative_marking, negative_marking_value, pass_percentage, language, is_published)
values
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'ppsc-intelligence-officer-full-mock',
    'PPSC Intelligence Officer (BS-16) Full Mock Exam',
    'Timed competitive simulation modeled on the official PPSC syllabus covering General Knowledge, Pakistan Affairs, and Computer Basics.',
    'mock',
    'Multiple Subjects',
    'PPSC',
    5400,
    true,
    0.25,
    40.0,
    'en',
    true
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'world-geography-capitals-practice',
    'World Geography & Capitals Practice Quiz',
    'Self-paced untimed practice quiz covering sovereign state capitals, geographical coordinates, and international borders.',
    'practice',
    'Geography',
    'PPSC',
    null,
    false,
    0.0,
    50.0,
    'en',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  is_published = true;

-- 16. SEED INITIAL SAMPLE QUESTIONS
insert into public.quiz_questions (id, quiz_id, subject, exam_tag, difficulty, language, text_en, options, correct_option, explanation, sort_order)
values
  (
    'b1c2d3e4-0001-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Computer Science',
    'PPSC',
    'easy',
    'en',
    'Which keyboard shortcut reverses (undoes) the last edit in Microsoft Word and Windows applications?',
    '[{"id": "a", "text": "Ctrl + Y"}, {"id": "b", "text": "Ctrl + Z"}, {"id": "c", "text": "Ctrl + X"}, {"id": "d", "text": "Ctrl + U"}]'::jsonb,
    'b',
    'Ctrl + Z performs Undo, whereas Ctrl + Y repeats/redoes an action, Ctrl + X cuts selected items, and Ctrl + U toggles underline formatting.',
    1
  ),
  (
    'b1c2d3e4-0002-4000-8000-000000000002',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Computer Science',
    'PPSC',
    'easy',
    'en',
    'Which type of computer memory is volatile and loses its stored contents immediately when electrical power is turned off?',
    '[{"id": "a", "text": "ROM (Read-Only Memory)"}, {"id": "b", "text": "RAM (Random Access Memory)"}, {"id": "c", "text": "SSD (Solid State Drive)"}, {"id": "d", "text": "Optical Blu-ray Disc"}]'::jsonb,
    'b',
    'RAM requires continuous power to retain active instructions and data; ROM and secondary drives (SSD/optical disks) are non-volatile.',
    2
  ),
  (
    'b1c2d3e4-0003-4000-8000-000000000003',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Pakistan Affairs',
    'PPSC',
    'medium',
    'en',
    'On which date did the Constitution of the Islamic Republic of Pakistan (1973) come into formal force?',
    '[{"id": "a", "text": "23 March 1973"}, {"id": "b", "text": "10 April 1973"}, {"id": "c", "text": "14 August 1973"}, {"id": "d", "text": "12 April 1973"}]'::jsonb,
    'c',
    'The National Assembly passed the 1973 Constitution on 10 April 1973, it was authenticated on 12 April 1973, and came into force on 14 August 1973.',
    3
  ),
  (
    'b1c2d3e4-0004-4000-8000-000000000004',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'General Knowledge',
    'PPSC',
    'medium',
    'en',
    'Where is the permanent Secretariat of the Shanghai Cooperation Organisation (SCO) located?',
    '[{"id": "a", "text": "Astana"}, {"id": "b", "text": "Beijing"}, {"id": "c", "text": "Tashkent"}, {"id": "d", "text": "Moscow"}]'::jsonb,
    'b',
    'The SCO Secretariat is headquartered in Beijing, China, while its Regional Anti-Terrorist Structure (RATS) Executive Committee is based in Tashkent, Uzbekistan.',
    4
  )
on conflict (id) do nothing;

-- 17. SEED INITIAL PDF RESOURCES
insert into public.pdf_resources (id, slug, title, description, subject, exam_tag, year, page_count, file_bytes, file_key, is_published)
values
  (
    'c1d2e3f4-0001-4000-8000-000000000001',
    'ppsc-intelligence-officer-past-paper-2023-solved',
    'PPSC Intelligence Officer Past Paper 2023 (Verified Solved)',
    'Complete authentic 100-question past paper with verified answers, official syllabus notes, and candidate guidance.',
    'Pakistan Affairs',
    'PPSC',
    2023,
    14,
    1420500,
    'pdfs/ppsc/ppsc-intelligence-officer-2023-solved.pdf',
    true
  ),
  (
    'c1d2e3f4-0002-4000-8000-000000000002',
    'world-geography-country-capitals-reference-handbook',
    'World Geography: Comprehensive Country Capitals Handbook',
    'Reference handbook listing all 250 ISO 3166-1 sovereign states, official capitals, currency designations, and UN M49 regions.',
    'Geography',
    'PPSC',
    2026,
    22,
    2150000,
    'pdfs/geography/world-geography-handbook-2026.pdf',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  is_published = true;
