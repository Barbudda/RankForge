-- ─────────────────────────────────────────────────────────────────────
-- 0007 · Index user_id where the RLS policies filter on it.
--
-- Every policy on these tables checks (select auth.uid()) = user_id, and
-- Supabase's performance advisor flags the foreign key as unindexed.
-- Run it in the Supabase SQL editor after 0006; running it again changes nothing.
-- ─────────────────────────────────────────────────────────────────────

create index if not exists audits_user_id_idx        on public.audits (user_id);
create index if not exists issues_user_id_idx        on public.issues (user_id);
create index if not exists pull_requests_user_id_idx on public.pull_requests (user_id);
