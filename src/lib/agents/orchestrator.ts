import type Anthropic from "@anthropic-ai/sdk";
import { AGENT_MODEL, getAnthropic } from "./client";
import { cliAgentsEnabled, runAgentViaCli } from "./cli-driver";
import { localAgentsEnabled, runAgentViaLocal } from "./local-driver";

/**
 * Minimal swarm orchestration primitives, mirroring the shape of the workflow
 * tooling used to build RankForge:
 *   - runAgent(): one Claude call that returns validated structured output
 *     (via a forced "emit" tool — the most SDK-robust structured-output path).
 *   - mapLimit()/parallel(): concurrency-capped fan-out.
 * A Swarm object threads telemetry (agent count + token spend) through a run.
 */

export interface SwarmTelemetry {
  agents: number;
  inputTokens: number;
  outputTokens: number;
}

/** Accumulates per-run telemetry across all agent calls in a swarm. */
export class Swarm {
  readonly telemetry: SwarmTelemetry = {
    agents: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  constructor(
    /** Optional progress sink (label of each agent as it completes). */
    private readonly onProgress?: (label: string) => void,
  ) {}

  record(label: string, usage: { input: number; output: number }) {
    this.telemetry.agents += 1;
    this.telemetry.inputTokens += usage.input;
    this.telemetry.outputTokens += usage.output;
    this.onProgress?.(label);
  }
}

export interface AgentRunOptions {
  label: string;
  system: string;
  prompt: string;
  /** JSON Schema for the forced tool's input (the structured result shape). */
  schema: Record<string, unknown>;
  maxTokens?: number;
  toolDescription?: string;
  swarm?: Swarm;
  signal?: AbortSignal;
}

/**
 * Run one agent and return its structured output. Uses a single forced tool
 * call so the model must return JSON matching `schema`.
 */
export async function runAgent<T>(opts: AgentRunOptions): Promise<T> {
  const anthropic = getAnthropic();
  if (!anthropic) {
    // Free/local model (Ollama or any OpenAI-compatible endpoint) — no key.
    if (localAgentsEnabled) {
      const { data, usage } = await runAgentViaLocal<T>({
        system: opts.system,
        prompt: opts.prompt,
        schema: opts.schema,
        signal: opts.signal,
      });
      opts.swarm?.record(opts.label, usage);
      return data;
    }
    // Dev alternative: the local claude CLI on the founder's subscription.
    if (cliAgentsEnabled) {
      const { data, usage } = await runAgentViaCli<T>({
        system: opts.system,
        prompt: opts.prompt,
        schema: opts.schema,
        signal: opts.signal,
      });
      opts.swarm?.record(opts.label, usage);
      return data;
    }
    throw new Error(
      "No generative model configured (set ANTHROPIC_API_KEY, RANKFORGE_LLM=ollama, or RANKFORGE_LLM=claude-cli).",
    );
  }

  const toolName = "emit";
  const res = await anthropic.messages.create(
    {
      model: AGENT_MODEL,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      tools: [
        {
          name: toolName,
          description:
            opts.toolDescription ?? "Return the structured result for this task.",
          input_schema: opts.schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: toolName },
    },
    { signal: opts.signal },
  );

  opts.swarm?.record(opts.label, {
    input: res.usage.input_tokens,
    output: res.usage.output_tokens,
  });

  const block = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!block) {
    throw new Error(`Agent "${opts.label}" returned no structured output.`);
  }
  return block.input as T;
}

/** Concurrency-capped map — runs at most `limit` tasks at once. */
export async function mapLimit<I, O>(
  items: readonly I[],
  limit: number,
  fn: (item: I, index: number) => Promise<O>,
): Promise<O[]> {
  const results = new Array<O>(items.length);
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  };
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    worker,
  );
  await Promise.all(workers);
  return results;
}

/** Run thunks concurrently with a cap (default 6). */
export function parallel<O>(
  thunks: ReadonlyArray<() => Promise<O>>,
  limit = 6,
): Promise<O[]> {
  return mapLimit(thunks, limit, (t) => t());
}
