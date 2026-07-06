-- RankForge hardening — idempotency constraints surfaced by the July review.
-- Run in Supabase → SQL Editor (paste + Run), after 0002_brain.sql.

-- A repository can only be connected once per account (double-submit guard).
create unique index if not exists repositories_user_fullname_uidx
  on public.repositories (user_id, full_name);

-- Brain memories: one row per (user, source_id) so remember() can upsert
-- atomically instead of delete-then-insert. Full (non-partial) index so
-- PostgREST's ON CONFLICT (user_id, source_id) inference matches it; NULL
-- source_ids stay unrestricted (NULLs are distinct in unique indexes).
create unique index if not exists memories_user_source_uidx
  on public.memories (user_id, source_id);
