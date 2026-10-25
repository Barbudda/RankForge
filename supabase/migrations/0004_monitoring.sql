-- ─────────────────────────────────────────────────────────────────────
-- 0004 · Monitoring: RankForge checks a site on a schedule, compares it
-- with the previous check and alerts when something critical changes.
--
--   monitors        one row per watched site (settings + last snapshot)
--   monitor_checks  one row per check (scores, level, changes) = history
--
-- Scheduled checks run server-side with the service-role key (cron route);
-- everything a user does goes through RLS like the other tables.
-- Run this once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.monitors (
  repo_id        text primary key references public.repositories (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  enabled        boolean not null default true,
  frequency      text not null default 'daily' check (frequency in ('daily', 'weekly')),
  alert_email    text,
  webhook_url    text,
  min_level      text not null default 'warning' check (min_level in ('critical', 'warning', 'info')),
  last_check_at  timestamptz,
  next_check_at  timestamptz not null default now(),
  last_level     text,
  last_summary   text,
  last_snapshot  jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists monitors_user_id_idx on public.monitors (user_id);
create index if not exists monitors_due_idx on public.monitors (next_check_at) where enabled;

create table if not exists public.monitor_checks (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references auth.users (id) on delete cascade,
  repo_id     text not null references public.repositories (id) on delete cascade,
  created_at  timestamptz not null default now(),
  trigger     text not null default 'scheduled' check (trigger in ('scheduled', 'manual')),
  status      text not null default 'ok' check (status in ('ok', 'error')),
  overall     int,
  geo_score   int,
  pages       int not null default 0,
  level       text not null default 'none' check (level in ('none', 'info', 'warning', 'critical')),
  summary     text not null default '',
  changes     jsonb not null default '[]',
  alerted     boolean not null default false,
  error       text
);
create index if not exists monitor_checks_repo_idx on public.monitor_checks (repo_id, created_at desc);
create index if not exists monitor_checks_user_idx on public.monitor_checks (user_id);

alter table public.monitors       enable row level security;
alter table public.monitor_checks enable row level security;

create policy "own monitors" on public.monitors
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own monitor checks" on public.monitor_checks
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── Plans: starter/growth/agency/enterprise → free/pro/studio ──────────
alter table public.profiles alter column plan set default 'free';
update public.profiles set plan = 'free' where plan not in ('free', 'pro', 'studio');
