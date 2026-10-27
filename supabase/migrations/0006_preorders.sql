-- ─────────────────────────────────────────────────────────────────────
-- 0006 · Pre-orders: until payments open, choosing Pro or Studio leaves an
-- email, and Septune writes to it the day the plan opens.
--
-- Written only by the server (service-role key) after its own checks: rate
-- limit, format, a honeypot. No policy at all on purpose, so the list can't
-- be read, filled or emptied through the public API key.
-- Run it in the Supabase SQL editor after 0005; running it again changes nothing.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.preorders (
  id           text primary key default gen_random_uuid()::text,
  email        text not null check (char_length(email) between 3 and 254),
  plan         text not null check (plan in ('pro', 'studio')),
  -- Page the pre-order came from: pricing, billing…
  source       text check (char_length(source) <= 40),
  created_at   timestamptz not null default now(),
  -- Set when the "it's open" email has gone out.
  notified_at  timestamptz,
  unique (email, plan)
);
create index if not exists preorders_pending_idx on public.preorders (plan) where notified_at is null;

alter table public.preorders enable row level security;
