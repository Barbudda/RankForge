import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { cosine, embed } from "./embed";

/**
 * RankForge's brain — a persistent, owner-scoped memory in Supabase that the
 * product writes facts/audits/issues/fixes to and recalls from by meaning
 * (semantic retrieval over local embeddings). Independent of the Anthropic
 * key: remembering and recalling work offline; the agent swarms simply read
 * and write it when they run. Every call is best-effort — a brain failure
 * never breaks an audit, fix, or chat response.
 */

export type MemoryKind =
  | "fact"
  | "audit"
  | "issue"
  | "fix"
  | "note"
  | "learning";

export interface MemoryInput {
  kind: MemoryKind;
  content: string;
  title?: string;
  repoId?: string | null;
  /** Stable identity for idempotent updates (re-audits replace, not duplicate). */
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecalledMemory {
  id: string;
  kind: MemoryKind;
  title: string;
  content: string;
  repoId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  /** Cosine similarity to the query (0–1). */
  score: number;
}

interface MemoryRow {
  id: string;
  kind: MemoryKind;
  repo_id: string | null;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  created_at: string;
}

async function ctx() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/** Store one or many memories (embeds content; idempotent by sourceId). */
export async function remember(
  items: MemoryInput | MemoryInput[],
): Promise<number> {
  const c = await ctx();
  if (!c) return 0;
  const arr = (Array.isArray(items) ? items : [items]).filter((i) =>
    i.content?.trim(),
  );
  if (!arr.length) return 0;

  const rows = arr.map((i) => ({
    user_id: c.userId,
    kind: i.kind,
    repo_id: i.repoId ?? null,
    title: i.title ?? "",
    content: i.content,
    metadata: i.metadata ?? {},
    embedding: embed(`${i.title ?? ""}\n${i.content}`),
    source_id: i.sourceId ?? null,
  }));

  try {
    const sourced = rows.filter((r) => r.source_id);
    const fresh = rows.filter((r) => !r.source_id);
    if (sourced.length) {
      // Atomic idempotent upsert on the (user_id, source_id) partial unique
      // index (migration 0003) — no delete-then-insert race.
      const { error } = await c.supabase
        .from("memories")
        .upsert(sourced, { onConflict: "user_id,source_id" });
      if (error) return 0;
    }
    if (fresh.length) {
      const { error } = await c.supabase.from("memories").insert(fresh);
      if (error) return 0;
    }
    return rows.length;
  } catch {
    return 0;
  }
}

/** Recall the most semantically-relevant memories for a query. */
export async function recall(
  query: string,
  opts?: {
    repoId?: string | null;
    kind?: MemoryKind;
    limit?: number;
    minScore?: number;
  },
): Promise<RecalledMemory[]> {
  const c = await ctx();
  if (!c || !query?.trim()) return [];
  const limit = opts?.limit ?? 6;
  const minScore = opts?.minScore ?? 0.06;

  try {
    let q = c.supabase
      .from("memories")
      .select("id,kind,repo_id,title,content,metadata,embedding,created_at")
      .order("created_at", { ascending: false })
      .limit(400);
    if (opts?.repoId) q = q.eq("repo_id", opts.repoId);
    if (opts?.kind) q = q.eq("kind", opts.kind);

    const { data, error } = await q;
    if (error || !data) return [];

    const qVec = embed(query);
    return (data as MemoryRow[])
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        content: r.content,
        repoId: r.repo_id,
        metadata: r.metadata ?? {},
        createdAt: r.created_at,
        score: cosine(qVec, Array.isArray(r.embedding) ? r.embedding : []),
      }))
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Memory counts for the brain dashboard. */
export async function brainStats(
  repoId?: string,
): Promise<{ total: number; byKind: Record<string, number> }> {
  const c = await ctx();
  if (!c) return { total: 0, byKind: {} };
  try {
    let q = c.supabase.from("memories").select("kind");
    if (repoId) q = q.eq("repo_id", repoId);
    const { data } = await q;
    const byKind: Record<string, number> = {};
    for (const r of (data as { kind: string }[]) ?? []) {
      byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    }
    return { total: (data ?? []).length, byKind };
  } catch {
    return { total: 0, byKind: {} };
  }
}
