-- RankForge brain — owner-scoped semantic memory.
-- Run in Supabase → SQL Editor (paste + Run), after 0001_init.sql.
--
-- Embeddings are stored as a jsonb array (512-dim, L2-normalized) produced by
-- the in-app local vectorizer (src/lib/brain/embed.ts) — no pgvector extension
-- or external embedding API required. Similarity is computed in the app over a
-- recency-bounded candidate set, which is ample for a solo workspace. (To scale
-- later, swap the jsonb column for a pgvector `vector(512)` + an ANN index and
-- a match RPC — the recall() interface stays the same.)

create table if not exists public.memories (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,             -- fact | audit | issue | fix | note | learning
  repo_id     text references public.repositories (id) on delete cascade,
  title       text not null default '',
  content     text not null,
  metadata    jsonb not null default '{}',
  embedding   jsonb not null default '[]',
  source_id   text,                      -- stable identity for idempotent updates
  created_at  timestamptz not null default now()
);

create index if not exists memories_user_id_idx on public.memories (user_id);
create index if not exists memories_repo_id_idx on public.memories (repo_id);
create index if not exists memories_kind_idx on public.memories (kind);
create index if not exists memories_source_idx on public.memories (user_id, source_id);

alter table public.memories enable row level security;

create policy "own memories" on public.memories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
