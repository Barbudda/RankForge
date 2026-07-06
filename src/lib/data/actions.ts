"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { AgentMode, AgentSettings, Framework } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  mockAudits,
  mockIssues,
  mockPullRequests,
  mockRepositories,
  sampleAgentSettings,
} from "@/lib/sample";
import {
  fromAgentSettings,
  fromAudit,
  fromIssue,
  fromPullRequest,
  fromRepository,
} from "./mappers";
import { getIssue, getPullRequestForIssue, getRepository } from "./index";
import { buildPrFromIssue } from "./pr-builder";
import { generateDeterministicFix } from "@/lib/audit/deterministic-fix";

type Result = { ok: boolean; error?: string };

/** One file's worth of changes in a prepared-fix report. */
export interface FileChange {
  path: string;
  changes: {
    issueId: string;
    title: string;
    category: string;
    impact: string;
    summary: string;
    diff: string;
    validationSteps: string[];
  }[];
}

export interface PrepareReport {
  ok: boolean;
  error?: string;
  /** Number of issues successfully prepared. */
  preparedCount: number;
  /** Grouped by the file each change touches. */
  files: FileChange[];
  /** Issues that couldn't be auto-prepared (need an AI/manual fix). */
  skipped: { issueId: string; title: string; reason: string }[];
  /** Ids that now have a persisted fix, ready to become a pull request. */
  preparedIssueIds: string[];
}

/**
 * Prepare deterministic fixes for a batch of issues — INSTANT, no LLM, no key.
 * Generates the real patch for each mechanically-fixable issue, persists it
 * onto the issue, and returns a report grouped by the files that change so the
 * user can review exactly what will happen before opening a pull request.
 */
export async function prepareFixes(issueIds: string[]): Promise<PrepareReport> {
  const empty: PrepareReport = {
    ok: false,
    preparedCount: 0,
    files: [],
    skipped: [],
    preparedIssueIds: [],
  };
  const ctx = await authed();
  if (!ctx) return { ...empty, error: "Not signed in." };
  if (!issueIds.length) return { ...empty, error: "Select at least one fix." };

  const byPath = new Map<string, FileChange["changes"]>();
  const skipped: PrepareReport["skipped"] = [];
  const preparedIssueIds: string[] = [];

  for (const issueId of issueIds) {
    const issue = await getIssue(issueId);
    if (!issue) {
      skipped.push({ issueId, title: issueId, reason: "Issue not found." });
      continue;
    }
    const repo = await getRepository(issue.repoId);
    if (!repo) {
      skipped.push({ issueId, title: issue.title, reason: "Repository not found." });
      continue;
    }
    // Reuse an existing diff (from a prior generate, or the sample dataset);
    // otherwise generate a deterministic patch on the spot.
    const existing = issue.suggestedFix.diff.trim() ? issue.suggestedFix : null;
    const fix = existing ?? generateDeterministicFix(issue, repo);
    if (!fix) {
      skipped.push({
        issueId,
        title: issue.title,
        reason: "This issue needs a reviewed or AI-generated fix — open it individually.",
      });
      continue;
    }

    // Only write when we generated something new.
    if (!existing) {
      const { error } = await ctx.supabase
        .from("issues")
        .update({ suggested_fix: fix })
        .eq("id", issueId);
      if (error) {
        skipped.push({ issueId, title: issue.title, reason: "Could not save the fix." });
        continue;
      }
    }

    preparedIssueIds.push(issueId);
    const path = fix.filesChanged[0] ?? issue.files[0]?.path ?? "(file)";
    const list = byPath.get(path) ?? [];
    list.push({
      issueId,
      title: issue.title,
      category: issue.category,
      impact: issue.impact,
      summary: fix.summary,
      diff: fix.diff,
      validationSteps: fix.validationSteps,
    });
    byPath.set(path, list);
    revalidatePath(`/issues/${issueId}`);
  }

  const files: FileChange[] = [...byPath.entries()].map(([path, changes]) => ({
    path,
    changes,
  }));

  return {
    ok: preparedIssueIds.length > 0,
    error: preparedIssueIds.length === 0 ? "None of the selected issues could be auto-fixed." : undefined,
    preparedCount: preparedIssueIds.length,
    files,
    skipped,
    preparedIssueIds,
  };
}

/** Open (simulated) pull requests for a batch of prepared issues. */
export async function openPullRequests(
  issueIds: string[],
): Promise<Result & { created: number }> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in.", created: 0 };
  let created = 0;
  for (const issueId of issueIds) {
    const res = await createPullRequest(issueId);
    if (res.ok) created++;
  }
  revalidateApp();
  return { ok: created > 0, created, error: created ? undefined : "No pull requests were created." };
}

/** Log the detailed error server-side; return a generic message to clients. */
function fail(context: string, error: { message: string }, friendly: string): Result {
  console.error(`[actions] ${context}:`, error.message);
  return { ok: false, error: friendly };
}

async function authed() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

function revalidateApp() {
  for (const p of [
    "/dashboard",
    "/repositories",
    "/pull-requests",
    "/settings",
    "/billing",
  ]) {
    revalidatePath(p);
  }
}

/** Persist the agent settings the owner edited in Settings. */
export async function saveAgentSettings(settings: AgentSettings): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { error } = await ctx.supabase
    .from("agent_settings")
    .upsert(fromAgentSettings(settings, ctx.userId));
  revalidatePath("/settings");
  if (error) return fail("saveAgentSettings", error, "Could not save settings. Please try again.");
  return { ok: true };
}

/** Persist the per-repo modification level picked on the repo detail page. */
export async function setRepoAgentLevel(
  repoId: string,
  level: AgentMode,
): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { error } = await ctx.supabase
    .from("repositories")
    .update({ agent_level: level })
    .eq("id", repoId);
  revalidatePath("/repositories");
  revalidatePath(`/repositories/${repoId}`);
  if (error) return fail("setRepoAgentLevel", error, "Could not save the modification level.");
  return { ok: true };
}

/** Connect a repository — inserts an owner-scoped repo row from manual input. */
export async function connectRepository(input: {
  fullName: string;
  productionUrl: string;
  framework: Framework;
}): Promise<Result & { id?: string }> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const parts = input.fullName.trim().split("/");
  const owner = parts[0]?.trim() ?? "";
  const name = parts.slice(1).join("/").trim();
  if (!owner || !name) {
    return { ok: false, error: 'Use the "owner/repo" format.' };
  }

  // The production URL is later rendered as an anchor href — only allow
  // http(s) so a javascript:/data: URI can never be stored.
  let productionUrl: string;
  try {
    const parsed = new URL(input.productionUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("bad scheme");
    }
    productionUrl = parsed.toString();
  } catch {
    return { ok: false, error: "Enter a valid http(s) production URL." };
  }

  // Idempotent: a double submit or reconnect must not create duplicates.
  const fullName = `${owner}/${name}`;
  const { data: existing } = await ctx.supabase
    .from("repositories")
    .select("id")
    .eq("full_name", fullName)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "This repository is already connected." };
  }

  // Inherit the workspace's default modification level for the new repo.
  const { data: settings } = await ctx.supabase
    .from("agent_settings")
    .select("mode")
    .maybeSingle();

  const { data, error } = await ctx.supabase
    .from("repositories")
    .insert({
      user_id: ctx.userId,
      name,
      owner,
      full_name: fullName,
      framework: input.framework,
      default_branch: "main",
      production_url: productionUrl,
      pages: 0,
      score: 0,
      score_delta: 0,
      open_issues: 0,
      open_pull_requests: 0,
      private: false,
      last_audit_at: null,
      connected_at: new Date().toISOString(),
      detection_confidence: 0,
      agent_level: settings?.mode ?? "draft_pr",
    })
    .select("id")
    .single();

  revalidateApp();
  if (error) {
    return fail(
      "connectRepository",
      error,
      "Could not connect the repository. Please try again.",
    );
  }
  return { ok: true, id: data?.id };
}

/** Disconnect a repository (cascade removes its audits, issues and PRs). */
export async function disconnectRepository(repoId: string): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { error } = await ctx.supabase
    .from("repositories")
    .delete()
    .eq("id", repoId);
  revalidateApp();
  if (error) return fail("disconnectRepository", error, "Could not disconnect the repository.");
  return { ok: true };
}

/**
 * Create a (simulated) pull request from an issue's generated fix — the
 * real persistence behind the "Create pull request" button. Idempotent per
 * issue; flips the issue to pr_open and bumps the repo's PR counter.
 */
export async function createPullRequest(
  issueId: string,
): Promise<Result & { prId?: string }> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const issue = await getIssue(issueId);
  if (!issue) return { ok: false, error: "Issue not found." };
  if (!issue.suggestedFix.diff.trim()) {
    return { ok: false, error: "Generate a fix first — this issue has no diff yet." };
  }

  // Idempotency: one PR per issue.
  const existing = await getPullRequestForIssue(issueId);
  if (existing) return { ok: true, prId: existing.id };

  const repo = await getRepository(issue.repoId);
  const pr = buildPrFromIssue(issue, repo, `pr_${randomUUID()}`);

  const { error } = await ctx.supabase
    .from("pull_requests")
    .insert(fromPullRequest(pr, ctx.userId));
  if (error) {
    return fail("createPullRequest", error, "Could not create the pull request.");
  }

  await ctx.supabase
    .from("issues")
    .update({ status: "pr_open" })
    .eq("id", issueId);
  if (repo) {
    await ctx.supabase
      .from("repositories")
      .update({ open_pull_requests: repo.openPullRequests + 1 })
      .eq("id", repo.id);
  }

  revalidateApp();
  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/pr`);
  if (repo) revalidatePath(`/repositories/${repo.id}`);
  return { ok: true, prId: pr.id };
}

/** Seed the labelled sample dataset into the owner's account (idempotent). */
export async function seedSampleData(): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const { supabase, userId } = ctx;

  // Insert in FK order: repositories → audits → issues → pull_requests.
  const steps = [
    supabase
      .from("repositories")
      .upsert(mockRepositories.map((r) => fromRepository(r, userId))),
    supabase.from("audits").upsert(mockAudits.map((a) => fromAudit(a, userId))),
    supabase.from("issues").upsert(mockIssues.map((i) => fromIssue(i, userId))),
    supabase
      .from("pull_requests")
      .upsert(mockPullRequests.map((p) => fromPullRequest(p, userId))),
  ];

  for (const step of steps) {
    const { error } = await step;
    if (error) return { ok: false, error: error.message };
  }

  // Only create settings if the user has none — never clobber saved settings.
  await supabase
    .from("agent_settings")
    .upsert(fromAgentSettings(sampleAgentSettings, userId), {
      ignoreDuplicates: true,
    });

  revalidateApp();
  return { ok: true };
}

/** Remove the sample repos (cascade clears their audits/issues/PRs). */
export async function clearSampleData(): Promise<Result> {
  const ctx = await authed();
  if (!ctx) return { ok: false, error: "Not signed in." };
  const ids = mockRepositories.map((r) => r.id);
  const { error } = await ctx.supabase
    .from("repositories")
    .delete()
    .in("id", ids);
  revalidateApp();
  return { ok: !error, error: error?.message };
}

/** Whether the sample dataset is currently loaded (for the Dev toggle). */
export async function hasSampleData(): Promise<boolean> {
  const ctx = await authed();
  if (!ctx) return false;
  const { data } = await ctx.supabase
    .from("repositories")
    .select("id")
    .in(
      "id",
      mockRepositories.map((r) => r.id),
    )
    .limit(1);
  return (data?.length ?? 0) > 0;
}
