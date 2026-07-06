import type { AuditRunner } from "./types";
import { MockAuditRunner } from "./mock-runner";
import { agentsEnabled } from "@/lib/agents/client";
import { SwarmAuditRunner } from "@/lib/agents/swarm-runner";

export type * from "./types";
export { SEO_RULES, getRule } from "./rules";

/**
 * Returns the active audit runner. When ANTHROPIC_API_KEY is set, the live
 * agent swarm (crawler + one agent per SEO category) runs; otherwise it falls
 * back to the mock runner. Same interface either way — the UI doesn't change.
 */
export function getAuditRunner(): AuditRunner {
  return agentsEnabled ? new SwarmAuditRunner() : new MockAuditRunner();
}
