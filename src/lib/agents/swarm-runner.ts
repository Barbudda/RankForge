import type { Repository } from "@/types";
import type { AuditResult, AuditRunner } from "@/lib/audit/types";
import { runAuditSwarm } from "./audit-swarm";

/**
 * AuditRunner backed by the agent swarm. Drops into getAuditRunner() behind
 * the same interface as MockAuditRunner — the UI doesn't change.
 */
export class SwarmAuditRunner implements AuditRunner {
  async run(repo: Repository): Promise<AuditResult> {
    const { audit, issues } = await runAuditSwarm(repo);
    return { audit, issues };
  }
}
