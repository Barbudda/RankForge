-- ─────────────────────────────────────────────────────────────────────
-- 0005 · Billing (Stripe) and write protection for server-managed columns.
--
--   profiles        + Stripe customer / subscription fields
--   billing_events  Stripe event ids already applied (webhook idempotency)
--
-- Why the triggers: the "own profile" and "own monitors" policies let a
-- signed-in user update their own rows, all columns included. Without the
-- triggers below, anyone could set their own plan to 'studio' from the
-- browser, or rewrite a monitor's last check to dodge the rate limit.
-- Plan, billing and check-result columns are now written only by the
-- service role (Stripe webhook, cron, "Check now") or the SQL editor.
--
-- Run this once in the Supabase SQL editor, after 0004.
-- ─────────────────────────────────────────────────────────────────────

-- ── Billing fields ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists cancel_at              timestamptz;

-- Stripe retries webhooks and may send an event twice: each id is applied
-- once. No policy on purpose: only the service role reads or writes it.
create table if not exists public.billing_events (
  id          text primary key,
  type        text not null,
  created_at  timestamptz not null default now()
);
alter table public.billing_events enable row level security;

-- ── profiles: plan and billing fields are server-managed ─────────────
-- current_user is the request's role under PostgREST ('anon' or
-- 'authenticated' for browser calls, 'service_role' for the secret key),
-- and the function owner inside security-definer functions such as
-- handle_new_user(), so sign-up keeps working.
create or replace function public.protect_profile_billing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.subscription_status := null;
      new.current_period_end := null;
      new.cancel_at := null;
    elsif new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status is distinct from old.subscription_status
       or new.current_period_end is distinct from old.current_period_end
       or new.cancel_at is distinct from old.cancel_at then
      raise exception 'plan and billing fields are managed by RankForge'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_billing on public.profiles;
create trigger protect_profile_billing
  before insert or update on public.profiles
  for each row execute function public.protect_profile_billing();

-- ── monitors: check results are server-managed ──────────────────────
-- Users still create monitors and change their settings (enabled,
-- frequency, alert address, webhook, alert level) through RLS.
create or replace function public.protect_monitor_results()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.last_check_at := null;
      new.next_check_at := now();
      new.last_level := null;
      new.last_summary := null;
      new.last_snapshot := null;
    elsif new.last_check_at is distinct from old.last_check_at
       or new.next_check_at is distinct from old.next_check_at
       or new.last_level is distinct from old.last_level
       or new.last_summary is distinct from old.last_summary
       or new.last_snapshot is distinct from old.last_snapshot then
      raise exception 'check results are written by RankForge'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_monitor_results on public.monitors;
create trigger protect_monitor_results
  before insert or update on public.monitors
  for each row execute function public.protect_monitor_results();

-- ── monitor_checks: users read and delete their history, never write it ──
drop policy if exists "own monitor checks" on public.monitor_checks;
drop policy if exists "read own monitor checks" on public.monitor_checks;
drop policy if exists "delete own monitor checks" on public.monitor_checks;
create policy "read own monitor checks" on public.monitor_checks
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "delete own monitor checks" on public.monitor_checks
  for delete to authenticated
  using ((select auth.uid()) = user_id);
