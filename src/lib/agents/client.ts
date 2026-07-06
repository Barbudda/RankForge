import Anthropic from "@anthropic-ai/sdk";
import { cliAgentsEnabled } from "./cli-driver";
import { localAgentsEnabled } from "./local-driver";

/**
 * LLM client for RankForge's generative agents (fix generation + optional
 * audit enrichment + chatbot). Server-only. A generative model can come from:
 *  - the Anthropic SDK (ANTHROPIC_API_KEY) — production path,
 *  - the local `claude` CLI on the founder's subscription (RANKFORGE_LLM=claude-cli),
 *  - a free/local OpenAI-compatible model, e.g. Ollama (RANKFORGE_LLM=ollama).
 * With none of these, `agentsEnabled` is false and generative-only features
 * degrade gracefully (the deterministic audit + deterministic fixes + the
 * extractive chatbot all still work with zero configuration).
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;

/** Default agent model — overridable, but never silently downgraded. */
export const AGENT_MODEL = process.env.RANKFORGE_AGENT_MODEL || "claude-opus-4-8";

/** True when a generative LLM is available (SDK key, dev CLI, or local model). */
export const agentsEnabled = Boolean(API_KEY) || cliAgentsEnabled || localAgentsEnabled;

let client: Anthropic | null = null;

/** Lazily-constructed singleton; null when no key is configured. */
export function getAnthropic(): Anthropic | null {
  if (!API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: API_KEY });
  return client;
}
