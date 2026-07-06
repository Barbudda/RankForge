import { spawn } from "node:child_process";

/**
 * Dev-only LLM driver: runs agents through the local `claude` CLI in headless
 * mode (`claude -p --output-format json`), which authenticates with the
 * founder's Claude Code SUBSCRIPTION — no ANTHROPIC_API_KEY, no per-token
 * billing. Never active in production (the CLI doesn't exist on Vercel).
 *
 * Enable with `RANKFORGE_LLM=claude-cli` in .env.local. Optional:
 * `RANKFORGE_CLI_MODEL=opus|sonnet|haiku` to override the session model.
 *
 * Structured output: instead of the SDK's forced-tool call, the prompt
 * demands a single JSON object matching the schema, and we parse it from the
 * CLI's `result` field (with code-fence stripping as a safety net).
 */

export const cliAgentsEnabled =
  process.env.RANKFORGE_LLM === "claude-cli" &&
  process.env.NODE_ENV !== "production";

const CLI_TIMEOUT_MS = 240_000;
/** The CLI spawns a full Claude Code process — cap concurrency hard. */
const MAX_CONCURRENT = 2;

let running = 0;
const waiters: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  running++;
}

function release() {
  running--;
  waiters.shift()?.();
}

function runCli(prompt: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ["-p", "--output-format", "json"];
    const model = process.env.RANKFORGE_CLI_MODEL;
    if (model) args.push("--model", model);

    // Fixed argv (prompt goes through stdin) — nothing user-controlled ever
    // reaches the shell line. shell:true only resolves claude.cmd on Windows.
    const child = spawn("claude", args, { shell: true, windowsHide: true });

    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("claude CLI timed out."));
    }, CLI_TIMEOUT_MS);
    const onAbort = () => {
      child.kill();
      reject(new Error("Aborted."));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new Error(`claude CLI not available: ${e.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (code !== 0 && !out.trim()) {
        reject(new Error(`claude CLI exited ${code}: ${err.slice(0, 300)}`));
      } else {
        resolve(out);
      }
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/** Extract the first top-level JSON object from a text blob. */
function extractJson(text: string): string {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in CLI output.");
  }
  return cleaned.slice(start, end + 1);
}

export interface CliAgentResult<T> {
  data: T;
  usage: { input: number; output: number };
}

/** Run one structured-output agent through the claude CLI. */
export async function runAgentViaCli<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<CliAgentResult<T>> {
  const fullPrompt = [
    opts.system,
    "",
    "---",
    "",
    opts.prompt,
    "",
    "OUTPUT FORMAT (mandatory): respond with ONLY one JSON object that is",
    "valid against this JSON Schema. No prose, no explanations, no code",
    "fences — the raw JSON object and nothing else.",
    JSON.stringify(opts.schema),
  ].join("\n");

  await acquire();
  try {
    const raw = await runCli(fullPrompt, opts.signal);
    const envelope = JSON.parse(extractJson(raw)) as {
      is_error?: boolean;
      result?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    if (envelope.is_error || typeof envelope.result !== "string") {
      throw new Error("claude CLI returned an error result.");
    }
    const data = JSON.parse(extractJson(envelope.result)) as T;
    return {
      data,
      usage: {
        input: envelope.usage?.input_tokens ?? 0,
        output: envelope.usage?.output_tokens ?? 0,
      },
    };
  } finally {
    release();
  }
}
