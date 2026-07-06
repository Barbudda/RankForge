import { NextResponse } from "next/server";
import { SUPPORT_SYSTEM, findAnswer } from "@/lib/support/knowledge";
import { searchCorpus, type RetrievedChunk } from "@/lib/support/corpus";
import { recall } from "@/lib/brain";
import { cliAgentsEnabled, runAgentViaCli } from "@/lib/agents/cli-driver";
import { localAgentsEnabled, completeViaLocal } from "@/lib/agents/local-driver";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Support chatbot endpoint — full RAG, no human support behind it.
 *
 * Retrieval, on every question:
 * 1. PRODUCT corpus (src/lib/support/corpus.ts) — docs/rules/FAQ/pricing/
 *    autonomy/frameworks/legal, embedded locally. Works with zero keys.
 * 2. BRAIN recall — the signed-in user's own workspace memories (their
 *    audits/issues/fixes), owner-scoped by RLS.
 *
 * Generation:
 * - With ANTHROPIC_API_KEY: Claude answers grounded in both blocks, and the
 *   response carries the retrieved sources (internal links).
 * - Without a key: extractive answer composed from the top corpus chunks —
 *   still genuinely useful, still sourced. Keyword KB remains the last net.
 */

/** Input bounds — protect cost and the model context from abuse. */
const MAX_MESSAGES = 24;
const MAX_CONTENT_CHARS = 4_000;

function sourcesOf(chunks: RetrievedChunk[]) {
  // Dedupe by URL, keep retrieval order (best first).
  const seen = new Set<string>();
  const out: { title: string; url: string }[] = [];
  for (const c of chunks) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push({ title: c.title, url: c.url });
    if (out.length >= 3) break;
  }
  return out;
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate + bound every message before anything expensive runs.
  messages = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_CONTENT_CHARS) }));
  if (!messages.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // ── Retrieval ────────────────────────────────────────────────────
  // Product docs (always available, no key, no DB).
  const docs = lastUser ? searchCorpus(lastUser, { limit: 4 }) : [];
  const docsBlock = docs.length
    ? docs
        .map((d) => `### ${d.title} (${d.url})\n${d.text}`)
        .join("\n\n")
    : "";

  // Workspace brain — owner-scoped, semantic, no Anthropic key required.
  const memories = lastUser
    ? await recall(lastUser, { limit: 3 }).catch(() => [])
    : [];
  const memoryBlock = memories.length
    ? memories
        .map((m) => `• [${m.kind}] ${m.title || m.content.slice(0, 140)}`)
        .join("\n")
    : "";

  const sources = sourcesOf(docs);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });

      const history = messages.filter((m) => m.content?.trim()).slice(-12);
      while (history.length && history[0]!.role === "assistant") history.shift();

      let system = SUPPORT_SYSTEM;
      if (docsBlock) {
        system += `\n\nRETRIEVED PRODUCT DOCS (ground your answer in these; they are authoritative and current — prefer them over your general knowledge of RankForge):\n${docsBlock}`;
      }
      if (memoryBlock) {
        system += `\n\nWORKSPACE MEMORY (the signed-in user's own RankForge data — cite it when relevant, never invent beyond it):\n${memoryBlock}`;
      }

      const resp = await client.messages.create({
        model: process.env.RANKFORGE_CHAT_MODEL || "claude-opus-4-8",
        max_tokens: 1024,
        system,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      });

      const answer = resp.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n")
        .trim();

      if (answer) {
        return NextResponse.json({
          answer,
          sources,
          mode: memoryBlock ? "rag+brain" : "rag",
        });
      }
    } catch {
      // Any API/SDK error → fall through to the grounded offline answer.
    }
  }

  // ── Free/local model (Ollama or OpenAI-compatible) ───────────────
  if (!apiKey && localAgentsEnabled && lastUser) {
    try {
      const history = messages
        .filter((m) => m.content?.trim())
        .slice(-8)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");
      let system = SUPPORT_SYSTEM;
      if (docsBlock) system += `\n\nRETRIEVED PRODUCT DOCS (authoritative):\n${docsBlock}`;
      if (memoryBlock) system += `\n\nWORKSPACE MEMORY:\n${memoryBlock}`;
      const answer = await completeViaLocal(
        system,
        `Conversation so far:\n${history}\n\nAnswer the last user message (2-5 sentences, per the rules).`,
      );
      if (answer.trim()) {
        return NextResponse.json({
          answer: answer.trim(),
          sources,
          mode: memoryBlock ? "local-rag+brain" : "local-rag",
        });
      }
    } catch {
      // Local model unavailable → grounded extractive answer below.
    }
  }

  // ── Dev alternative: claude CLI on the founder's subscription ────
  if (!apiKey && cliAgentsEnabled && lastUser) {
    try {
      const history = messages
        .filter((m) => m.content?.trim())
        .slice(-8)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");
      let system = SUPPORT_SYSTEM;
      if (docsBlock) system += `\n\nRETRIEVED PRODUCT DOCS (authoritative):\n${docsBlock}`;
      if (memoryBlock) system += `\n\nWORKSPACE MEMORY:\n${memoryBlock}`;
      const { data } = await runAgentViaCli<{ answer: string }>({
        system,
        prompt: `Conversation so far:\n${history}\n\nAnswer the last user message (2-5 sentences, per the rules).`,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { answer: { type: "string" } },
          required: ["answer"],
        },
      });
      if (data.answer?.trim()) {
        return NextResponse.json({
          answer: data.answer.trim(),
          sources,
          mode: memoryBlock ? "cli-rag+brain" : "cli-rag",
        });
      }
    } catch {
      // CLI unavailable/slow → grounded extractive answer below.
    }
  }

  // ── Extractive fallback (no key / API failure) ───────────────────
  if (docs.length) {
    const top = docs[0]!;
    // Compose from the best chunk, plus a second one when it's nearly as
    // relevant and about something different.
    const second =
      docs[1] && docs[1].score > top.score * 0.8 && docs[1].url !== top.url
        ? docs[1]
        : null;
    const parts = [top.text];
    if (second) parts.push(second.text);
    const answer =
      (memoryBlock ? `From your workspace:\n${memoryBlock}\n\n` : "") +
      parts.join("\n\n");
    return NextResponse.json({
      answer,
      sources,
      mode: memoryBlock ? "corpus+brain" : "corpus",
    });
  }

  // Nothing retrieved — last-resort keyword KB.
  const kb = findAnswer(lastUser);
  return NextResponse.json({
    answer: memoryBlock ? `From your workspace:\n${memoryBlock}\n\n${kb}` : kb,
    sources: [],
    mode: memoryBlock ? "brain+kb" : "kb",
  });
}
