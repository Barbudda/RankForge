/**
 * RankForge agent swarms — in-app multi-agent orchestration that powers SEO
 * audits (fan-out by category) and modifications (locate → patch → validate).
 * Gated on ANTHROPIC_API_KEY via `agentsEnabled`; the app falls back to the
 * rules/mock engine when it's unset.
 */
export { agentsEnabled, AGENT_MODEL } from "./client";
export { Swarm, runAgent, parallel, mapLimit } from "./orchestrator";
export type { SwarmTelemetry } from "./orchestrator";
export { runAuditSwarm } from "./audit-swarm";
export type { AuditSwarmResult } from "./audit-swarm";
export { runFixSwarm } from "./fix-swarm";
export type { FixSwarmResult } from "./fix-swarm";
export { SwarmAuditRunner } from "./swarm-runner";
