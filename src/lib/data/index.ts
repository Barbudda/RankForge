import { cache } from "react";
import type {
  AgentSettings,
  Audit,
  DashboardStats,
  PullRequest,
  Repository,
  ScoreTrendPoint,
  SeoIssue,
} from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { impactPoints } from "@/lib/scoring";
import {
  toAgentSettings,
  toAudit,
  toIssue,
  toPullRequest,
  toRepository,
} from "./mappers";

/**
 * Production data access layer. Every page reads through these functions,
 * which query the owner's Supabase tables (RLS auto-scopes rows to the
 * authenticated user). A fresh account is empty until repos are connected or
 * the Dev "Sample data" set is seeded.
 */

async function db() {
  if (!isSupabaseConfigured) return null;
  return createClient();
}

/**
 * Surface query failures instead of rendering a pristine-but-wrong empty
 * account: log the detail server-side, throw a generic error that the (app)
 * error boundary presents as a retryable failure. `maybeSingle()` not-found
 * results have error === null and are unaffected.
 */
function unwrap<T>(
  fn: string,
  res: { data: T | null; error: { message: string } | null },
): T | null {
  if (res.error) {
    console.error(`[data] ${fn}:`, res.error.message);
    throw new Error(`Failed to load data (${fn}).`);
  }
  return res.data;
}

export const EMPTY_STATS: DashboardStats = {
  globalScore: 0,
  scoreDelta: 0,
  repositories: 0,
  openIssues: 0,
  prsCreated: 0,
  impactFixed: 0,
};

/** Sensible default behavior for a brand-new account. */
export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  mode: "draft_pr",
  weeklyAudit: true,
  maxPrsPerWeek: 5,
  allowedCategories: [
    "metadata",
    "indexing",
    "structure",
    "images",
    "schema",
    "internal-linking",
    "performance",
    "framework",
  ],
  excludedPaths: [],
};

/** cache(): deduped per request — dashboard + stats share one query. */
export const getRepositories = cache(async (): Promise<Repository[]> => {
  const supabase = await db();
  if (!supabase) return [];
  const data = unwrap(
    "getRepositories",
    await supabase
      .from("repositories")
      .select("*")
      .order("connected_at", { ascending: false }),
  );
  return (data ?? []).map(toRepository);
});

export async function getRepository(id: string): Promise<Repository | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("repositories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toRepository(data) : null;
}

export async function getAudit(id: string): Promise<Audit | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toAudit(data) : null;
}

export async function getAuditsForRepo(repoId: string): Promise<Audit[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toAudit);
}

export async function getLatestAudit(repoId: string): Promise<Audit | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toAudit(data) : null;
}

export async function getIssue(id: string): Promise<SeoIssue | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toIssue(data) : null;
}

export async function getIssuesForRepo(repoId: string): Promise<SeoIssue[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("issues")
    .select("*")
    .eq("repo_id", repoId)
    .order("confidence", { ascending: false });
  return (data ?? []).map(toIssue);
}

export async function getIssuesForAudit(auditId: string): Promise<SeoIssue[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("issues")
    .select("*")
    .eq("audit_id", auditId)
    .order("confidence", { ascending: false });
  return (data ?? []).map(toIssue);
}

export async function getPullRequest(id: string): Promise<PullRequest | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("pull_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toPullRequest(data) : null;
}

/** cache(): deduped per request — PR list + stats share one query. */
export const getPullRequests = cache(async (): Promise<PullRequest[]> => {
  const supabase = await db();
  if (!supabase) return [];
  const data = unwrap(
    "getPullRequests",
    await supabase
      .from("pull_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  );
  return (data ?? []).map(toPullRequest);
});

export async function getPullRequestsForRepo(
  repoId: string,
): Promise<PullRequest[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("pull_requests")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toPullRequest);
}

export async function getPullRequestForIssue(
  issueId: string,
): Promise<PullRequest | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("pull_requests")
    .select("*")
    .contains("issue_ids", [issueId])
    .limit(1)
    .maybeSingle();
  return data ? toPullRequest(data) : null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await db();
  if (!supabase) return EMPTY_STATS;
  const [repos, issues, prs] = await Promise.all([
    getRepositories(),
    supabase.from("issues").select("*"),
    getPullRequests(),
  ]);
  const issueList = (unwrap("getDashboardStats.issues", issues) ?? []).map(
    toIssue,
  );
  return computeStats(repos, issueList, prs);
}

/**
 * Page-weighted score trend over the last two months. Audits are bucketed by
 * day; each repo's latest known score is carried forward, and days are scored
 * with the same sum(score×pages)/sum(pages) math as the dashboard stat —
 * so a multi-repo account gets one coherent line, not interleaved zigzags.
 */
export async function getScoreTrend(): Promise<ScoreTrendPoint[]> {
  const supabase = await db();
  if (!supabase) return [];
  const since = new Date(Date.now() - 60 * 86400_000).toISOString();
  const [auditsRes, repos] = await Promise.all([
    supabase
      .from("audits")
      .select("repo_id, created_at, score")
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    getRepositories(),
  ]);
  const audits = (unwrap("getScoreTrend", auditsRes) ?? []) as {
    repo_id: string;
    created_at: string;
    score: number;
  }[];
  if (!audits.length) return [];

  const pagesByRepo = new Map(repos.map((r) => [r.id, Math.max(1, r.pages)]));
  const latest = new Map<string, number>(); // repo → carried-forward score
  const byDay = new Map<string, { repo_id: string; score: number }[]>();
  for (const a of audits) {
    const day = a.created_at.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(a);
    byDay.set(day, list);
  }

  const points: ScoreTrendPoint[] = [];
  for (const [day, dayAudits] of byDay) {
    for (const a of dayAudits) latest.set(a.repo_id, a.score);
    let weighted = 0;
    let pages = 0;
    for (const [repoId, score] of latest) {
      const p = pagesByRepo.get(repoId) ?? 1;
      weighted += score * p;
      pages += p;
    }
    points.push({
      label: new Date(day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: Math.round(weighted / (pages || 1)),
    });
  }
  return points;
}

export async function getTopOpportunities(limit = 5): Promise<SeoIssue[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("issues")
    .select("*")
    .in("status", ["open", "pr_open"])
    .order("confidence", { ascending: false })
    .limit(limit);
  return (data ?? []).map(toIssue);
}

export async function getAgentSettings(): Promise<AgentSettings> {
  const supabase = await db();
  if (!supabase) return DEFAULT_AGENT_SETTINGS;
  const { data } = await supabase
    .from("agent_settings")
    .select("*")
    .maybeSingle();
  return data ? toAgentSettings(data) : DEFAULT_AGENT_SETTINGS;
}

/** Page-weighted global score + counts, from the owner's live data. */
function computeStats(
  repos: Repository[],
  issues: SeoIssue[],
  prs: PullRequest[],
): DashboardStats {
  const repositories = repos.length;
  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "pr_open",
  ).length;
  const prsCreated = prs.filter((p) => p.status !== "simulated").length;

  const merged = prs.filter((p) => p.status === "merged");
  const impactFixed = merged
    .flatMap((p) => p.issueIds)
    .map((id) => issues.find((i) => i.id === id))
    .filter((i): i is SeoIssue => Boolean(i))
    .reduce((sum, i) => sum + impactPoints(i), 0);

  const totalPages = repos.reduce((s, r) => s + r.pages, 0) || 1;
  const globalScore = Math.round(
    repos.reduce((s, r) => s + r.score * r.pages, 0) / totalPages,
  );
  const scoreDelta = Math.round(
    repos.reduce((s, r) => s + r.scoreDelta * r.pages, 0) / totalPages,
  );

  return {
    globalScore,
    scoreDelta,
    repositories,
    openIssues,
    prsCreated,
    impactFixed,
  };
}
