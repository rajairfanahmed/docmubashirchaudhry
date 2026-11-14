-- ============================================================================
-- 0003_backend_prd_alignment.sql: Backend PRD & Database Design Alignment
-- Implements DATA-10, DATA-11, DATA-12, DATA-14, DATA-15, DATA-18 tables
-- and enhances profiles (DATA-01) with status, blocked_reason, and last_seen_at.
-- ============================================================================

-- 1. Enhance public.profiles (DATA-01)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'status'
  ) then
    alter table public.profiles
      add column status text not null default 'active'
      check (status in ('active', 'blocked', 'deleted'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'blocked_reason'
  ) then
    alter table public.profiles add column blocked_reason text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_seen_at'
  ) then
    alter table public.profiles add column last_seen_at timestamptz;
  end if;
end $$;

create index if not exists idx_profiles_status on public.profiles (status);

-- 2. Webhook Events deduplication (DATA-14)
create table if not exists public.webhook_events (
  id text primary key,
  provider text not null default 'clerk',
  received_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_received_at on public.webhook_events (received_at desc);

-- 3. Admin Notifications (DATA-10)
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

create index if not exists idx_admin_notifications_unread
  on public.admin_notifications (read_at, created_at desc);

-- 4. Digest Runs deduplication (DATA-15)
create table if not exists public.digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date unique not null,
  sent_at timestamptz not null default now(),
  recipient_count integer not null default 0
);

-- 5. Admin Activity Log (DATA-11)
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

create index if not exists idx_admin_activity_log_admin_time
  on public.admin_activity_log (admin_id, created_at desc);

create index if not exists idx_admin_activity_log_entity
  on public.admin_activity_log (entity_type, entity_id);

-- 6. Question Reports (DATA-12)
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

create index if not exists idx_question_reports_status_time
  on public.question_reports (status, created_at desc);

create index if not exists idx_question_reports_reporter
  on public.question_reports (reported_by, created_at desc);

-- 7. Storage Snapshots (DATA-18)
create table if not exists public.storage_snapshots (
  id uuid primary key default gen_random_uuid(),
  used_bytes bigint not null,
  object_count integer not null,
  checked_at timestamptz not null default now()
);

create index if not exists idx_storage_snapshots_checked_at
  on public.storage_snapshots (checked_at desc);

-- 8. Row Level Security (RLS) Enablement
alter table public.webhook_events enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.digest_runs enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.question_reports enable row level security;
alter table public.storage_snapshots enable row level security;

-- All privileged access is routed strictly server-side through Supabase service role key
