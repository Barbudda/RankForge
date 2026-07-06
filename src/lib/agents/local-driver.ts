/**
 * Free / local LLM driver — an OpenAI-compatible chat backend, no Anthropic
 * key, no per-token billing. Point it at:
 *   • Ollama (default): `ollama serve` on localhost — fully in-build, offline.
 *   • LM Studio / llama.cpp server — any OpenAI-compatible `/chat/completions`.
 *   • A hosted free tier (Groq, Google Gemini via its OpenAI-compat shim, …)
 *     by setting a base URL + free API key.
 *
 * Enable with `RANKFORGE_LLM=ollama` (or `openai-compat`). Config:
 *   RANKFORGE_LLM_BASE_URL  (default http://localhost:11434/v1)
 *   RANKFORGE_LLM_MODEL     (default llama3.1)
 *   RANKFORGE_LLM_API_KEY   (optional — for hosted endpoints)
 *
 * Structured output is done the portable way: request JSON mode and demand a
 * single object matching the schema, then parse it.
 */

const MODE = process.env.RANKFORGE_LLM;
export const localAgentsEnabled = MODE === "ollama" || MODE === "openai-compat";

const BASE_URL = (process.env.RANKFORGE_LLM_BASE_URL || "http://localhost:11434/v1").replace(/\/+$/, "");
const MODEL = process.env.RANKFORGE_LLM_MODEL || "llama3.1";
const API_KEY = process.env.RANKFORGE_LLM_API_KEY || "";
const TIMEOUT_MS = 180_000;

/** Local models are single-GPU — cap concurrency low. */
const MAX_CONCURRENT = 2;
let running = 0;
const waiters: Array<() => void> = [];
async function acquire(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise<void>((r) => waiters.push(r));
  running++;
}
function release() {
  running--;
  waiters.shift()?.();
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in model output.");
  }
  return cleaned.slice(start, end + 1);
}

export interface LocalAgentResult<T> {
  data: T;
  usage: { input: number; output: number };
}

async function chat(
  system: string,
  user: string,
  signal?: AbortSignal,
  jsonMode = true,
): Promise<{ text: string; usage: { input: number; output: number } }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        stream: false,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Local model HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return {
      text,
      usage: {
        input: json.usage?.prompt_tokens ?? 0,
        output: json.usage?.completion_tokens ?? 0,
      },
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** Run one structured-output agent through the local/OpenAI-compatible model. */
export async function runAgentViaLocal<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<LocalAgentResult<T>> {
  const system = `${opts.system}\n\nYou MUST respond with ONLY one JSON object valid against this JSON Schema (no prose, no code fences):\n${JSON.stringify(opts.schema)}`;
  await acquire();
  try {
    const { text, usage } = await chat(system, opts.prompt, opts.signal, true);
    const data = JSON.parse(extractJson(text)) as T;
    return { data, usage };
  } finally {
    release();
  }
}

/** Plain-text completion (used by the support chatbot). */
export async function completeViaLocal(
  system: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  await acquire();
  try {
    const { text } = await chat(system, prompt, signal, false);
    return text.trim();
  } finally {
    release();
  }
}
