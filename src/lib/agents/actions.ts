"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getIssue, getRepository } from "@/lib/data";
import { fromAudit, fromIssue } from "@/lib/data/mappers";
import { agentsEnabled } from "./client";
import { runAuditSwarm } from "./audit-swarm";
import { runFixSwarm } from "./fix-swarm";
import { generateDeterministicFix } from "@/lib/audit/deterministic-fix";

type Result = { ok: boolean; error?: string; configured?: boolean };

async function authedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function revalidateApp() {
  for (const p of ["/dashboard", "/repositories", "/pull-requests"]) {
    revalidatePath(p);
  }
}

/**
 * Launch the audit swarm on a connected repository: crawl the production site,
 * fan out one agent per SEO category, then persist the scored audit + issues.
 */
export async function runAudit(
  repoId: string,
): Promise<
  Result & { auditId?: string; score?: number; issues?: number; agents?: number }
> {
  // The audit engine is deterministic — it runs the full crawl + rule engine +
  // link-graph + content analysis with NO API key. An LLM only adds optional
  // content-quality enrichment, so we never gate the audit on `agentsEnabled`.
  const userId = await authedUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const repo = await getRepository(repoId);
  if (!repo) return { ok: false, error: "Repository not found." };

  let result;
  try {
    result = await runAuditSwarm(repo);
  } catch (e) {
    return {
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "Audit swarm failed.",
    };
  }
  const { audit, issues, telemetry } = result;

  const supabase = await createClient();
  const { error: auditErr } = await supabase
    .from("audits")
    .insert(fromAudit(audit, userId));
  if (auditErr) {
    console.error("[runAudit] audit insert:", auditErr.message);
    return { ok: false, configured: true, error: "Could not save the audit." };
  }

  if (issues.length) {
    // Issue ids are deterministic per (repo, category, title): re-detected
    // issues update their existing row instead of duplicating it.
    const { error: issuesErr } = await supabase
      .from("issues")
      .upsert(issues.map((i) => fromIssue(i, userId)), { onConflict: "id" });
    if (issuesErr) {
      console.error("[runAudit] issues upsert:", issuesErr.message);
      return { ok: false, configured: true, error: "Could not save the issues." };
    }
  }

  // Retire previously-open issues this audit did NOT re-detect (site fixed
  // them out-of-band). "ignored" — never "fixed": green stays validated-only.
  // pr_open rows are left alone; they have live PRs attached.
  await supabase
    .from("issues")
    .update({ status: "ignored" })
    .eq("repo_id", repo.id)
    .eq("status", "open")
    .neq("audit_id", audit.id);

  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "pr_open",
  ).length;
  await supabase
    .from("repositories")
    .update({
      score: audit.score,
      score_delta:
        audit.previousScore != null ? audit.score - audit.previousScore : 0,
      open_issues: openIssues,
      last_audit_at: audit.createdAt,
      pages: audit.crawl.pagesScanned,
    })
    .eq("id", repo.id);

  revalidateApp();
  revalidatePath(`/repositories/${repo.id}`);
  revalidatePath(`/audits/${audit.id}`);

  return {
    ok: true,
    configured: true,
    auditId: audit.id,
    score: audit.score,
    issues: issues.length,
    agents: telemetry.agents,
  };
}

/**
 * Generate a fix for one issue. DETERMINISTIC-FIRST: mechanical issues
 * (viewport, lang, canonical, robots, sitemap, JSON-LD, social tags) get a
 * real template patch with NO LLM and NO key. Everything else falls back to
 * the LLM fix pipeline when a driver (API key / CLI / local model) is present.
 */
export async function generateFix(issueId: string): Promise<Result> {
  const userId = await authedUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const issue = await getIssue(issueId);
  if (!issue) return { ok: false, error: "Issue not found." };
  const repo = await getRepository(issue.repoId);
  if (!repo) return { ok: false, error: "Repository not found." };

  // 1) Deterministic path — no LLM, no key.
  let fix = generateDeterministicFix(issue, repo);

  // 2) LLM fallback for judgment-heavy issues (content, links, complex fixes).
  if (!fix) {
    if (!agentsEnabled) {
      return {
        ok: false,
        configured: false,
        error:
          "This one needs an AI-assisted fix, which isn't enabled on this instance. Mechanical fixes (metadata, robots, sitemap, viewport…) still work — review this issue and apply it by hand.",
      };
    }
    try {
      ({ fix } = await runFixSwarm(issue, repo));
    } catch (e) {
      return {
        ok: false,
        configured: true,
        error: e instanceof Error ? e.message : "Fix generation failed.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("issues")
    .update({ suggested_fix: fix })
    .eq("id", issueId);
  if (error) {
    console.error("[generateFix] update:", error.message);
    return { ok: false, configured: true, error: "Could not save the fix." };
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/pr`);
  return { ok: true, configured: true };
}
