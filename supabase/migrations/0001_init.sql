-- RankForge — initial schema (auth-linked, owner-scoped via RLS).
-- Run in Supabase → SQL Editor (paste + Run), or `supabase db push`.
--
-- Design notes:
-- * Every domain row carries user_id = auth.users.id; RLS limits each user
--   to their own rows (solo product, but future-proof for multi-tenant).
-- * Rich nested structures (category scores, diffs, checklists, …) are stored
--   as jsonb — they are read-mostly blobs produced by the audit engine.
-- * Text primary keys default to a uuid string but allow seeding stable ids
--   (e.g. the Dev "sample data" set: repo_acme, audit_acme_2, …).

-- ── profiles: one row per authenticated user (the account owner) ──────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null default 'You',
  email         text not null,
  avatar_url    text,
  github_login  text,
  workspace_name text not null default 'My workspace',
  plan          text not null default 'growth',
  created_at    timestamptz not null default now()
);

-- ── repositories ─────────────────────────────────────────────────────────
create table if not exists public.repositories (
  id                  text primary key default gen_random_uuid()::text,
  user_id             uuid not null references auth.users (id) on delete cascade,
  name                text not null,
  owner               text not null,
  full_name           text not null,
  framework           text not null,
  default_branch      text not null default 'main',
  production_url      text not null default '',
  pages               int  not null default 0,
  score               int  not null default 0,
  score_delta         int  not null default 0,
  open_issues         int  not null default 0,
  open_pull_requests  int  not null default 0,
  private             boolean not null default false,
  last_audit_at       timestamptz,
  connected_at        timestamptz not null default now(),
  detection_confidence int not null default 0,
  agent_level         text not null default 'draft_pr'
);
create index if not exists repositories_user_id_idx on public.repositories (user_id);

-- ── audits ───────────────────────────────────────────────────────────────
create table if not exists public.audits (
  id               text primary key default gen_random_uuid()::text,
  user_id          uuid not null references auth.users (id) on delete cascade,
  repo_id          text not null references public.repositories (id) on delete cascade,
  score            int  not null,
  previous_score   int,
  status           text not null default 'completed',
  created_at       timestamptz not null default now(),
  duration_ms      int  not null default 0,
  total_issues     int  not null default 0,
  categories       jsonb not null default '[]',
  crawl            jsonb not null default '{}',
  framework_signals jsonb not null default '[]'
);
create index if not exists audits_repo_id_idx on public.audits (repo_id);

-- ── issues ───────────────────────────────────────────────────────────────
create table if not exists public.issues (
  id            text primary key default gen_random_uuid()::text,
  user_id       uuid not null references auth.users (id) on delete cascade,
  repo_id       text not null references public.repositories (id) on delete cascade,
  audit_id      text references public.audits (id) on delete cascade,
  title         text not null,
  description   text not null default '',
  category      text not null,
  impact        text not null,
  effort        text not null,
  risk          text not null,
  confidence    int  not null default 0,
  status        text not null default 'open',
  affected_urls jsonb not null default '[]',
  evidence      text not null default '',
  suggested_fix jsonb not null default '{}',
  files         jsonb not null default '[]',
  can_auto_fix  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists issues_repo_id_idx on public.issues (repo_id);
create index if not exists issues_audit_id_idx on public.issues (audit_id);

-- ── pull_requests ────────────────────────────────────────────────────────
create table if not exists public.pull_requests (
  id              text primary key default gen_random_uuid()::text,
  user_id         uuid not null references auth.users (id) on delete cascade,
  repo_id         text not null references public.repositories (id) on delete cascade,
  issue_ids       jsonb not null default '[]',
  number          int  not null,
  title           text not null,
  description     text not null default '',
  branch_name     text not null,
  base_branch     text not null default 'main',
  status          text not null default 'open',
  files           jsonb not null default '[]',
  additions       int  not null default 0,
  deletions       int  not null default 0,
  checklist       jsonb not null default '[]',
  expected_impact text not null default '',
  risk            text not null default 'low',
  url             text,
  created_at      timestamptz not null default now()
);
create index if not exists pull_requests_repo_id_idx on public.pull_requests (repo_id);

-- ── agent_settings: one row per user ─────────────────────────────────────
create table if not exists public.agent_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  mode               text not null default 'draft_pr',
  weekly_audit       boolean not null default true,
  max_prs_per_week   int not null default 5,
  allowed_categories jsonb not null default '[]',
  excluded_paths     jsonb not null default '[]',
  updated_at         timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.repositories   enable row level security;
alter table public.audits         enable row level security;
alter table public.issues         enable row level security;
alter table public.pull_requests  enable row level security;
alter table public.agent_settings enable row level security;

-- Policies scope every row to its owner. Notes (Supabase best practice):
--   * (select auth.uid()) is wrapped in a subquery so the planner evaluates it
--     ONCE per query (initPlan) instead of once per row — big RLS speedup.
--   * `to authenticated` ensures the anon role can't even attempt access.
--   * `for all` + both using/with check covers select/insert/update/delete and
--     prevents reassigning a row's owner on update.

-- profiles & agent_settings are keyed by the user id directly
create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own settings" on public.agent_settings
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- domain tables are scoped by user_id
create policy "own repositories" on public.repositories
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own audits" on public.audits
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own issues" on public.issues
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own pull_requests" on public.pull_requests
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── New-user bootstrap: create profile + default settings on signup ──────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  insert into public.agent_settings (user_id, allowed_categories)
  values (
    new.id,
    '["metadata","indexing","structure","images","schema","internal-linking","performance","framework"]'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A trigger fires regardless of EXECUTE grants, so revoke direct RPC access to
-- this SECURITY DEFINER function from the API roles (it must not be a callable
-- public endpoint). The on-signup trigger keeps working.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
