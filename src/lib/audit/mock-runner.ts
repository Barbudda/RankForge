import type { Repository } from "@/types";
import { getLatestAudit, getIssuesForRepo } from "@/lib/sample";
import type { AuditResult, AuditRunner } from "./types";

/**
 * Returns the latest fixture audit for a repo, simulating a short crawl
 * delay. This is what the "Run audit" buttons would call in mock mode.
 * Swap for a LiveAuditRunner (real Crawler + rules) without touching the UI.
 */
export class MockAuditRunner implements AuditRunner {
  async run(repo: Repository): Promise<AuditResult> {
    const audit = getLatestAudit(repo.id);
    const issues = getIssuesForRepo(repo.id);
    if (!audit) {
      throw new Error(`No mock audit available for repo ${repo.id}`);
    }
    return { audit, issues };
  }
}
