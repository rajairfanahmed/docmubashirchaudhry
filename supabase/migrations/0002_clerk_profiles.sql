-- ============================================================================
-- 0002_clerk_profiles.sql: Clerk User Identity and Supabase Database Sync
-- Decouples profiles from Supabase Auth (auth.users) so Clerk is the sole
-- identity provider, while Supabase acts strictly as the PostgreSQL database.
-- ============================================================================

create table if not exists public.profiles (
  clerk_user_id text primary key,
  id text,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- Ensure indexes for lookups and sorting
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_created_at on public.profiles (created_at desc);

-- If the table existed previously with a foreign key to auth.users, decouple it
do $$
begin
  -- Add clerk_user_id column if it was not present
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'clerk_user_id'
  ) then
    alter table public.profiles add column clerk_user_id text;
  end if;

  -- Add role column if not present
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role text not null default 'user' check (role in ('user', 'admin'));
  end if;
end $$;
