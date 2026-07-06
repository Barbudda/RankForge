/**
 * RankForge's brain — self-contained semantic memory (RAG + memory + a
 * learning loop). Local embeddings (no external API/model), persisted in
 * Supabase, owner-scoped by RLS. The agent swarms recall prior knowledge to
 * ground their work and write outcomes back so RankForge gets smarter over
 * time; recall also works with no Anthropic key (e.g. the support chatbot).
 */
export { embed, cosine, EMBED_DIM } from "./embed";
export { remember, recall, brainStats } from "./store";
export type { MemoryKind, MemoryInput, RecalledMemory } from "./store";
