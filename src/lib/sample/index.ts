import type { AgentSettings, DashboardStats, ScoreTrendPoint } from "@/types";
import { mockRepositories } from "./core";
import { mockIssues } from "./issues";
import { mockPullRequests } from "./pull-requests";
import { impactPoints } from "@/lib/scoring";

export * from "./core";
export * from "./audits";
export * from "./issues";
export * from "./pull-requests";

/**
 * Sample dataset — demo content used only when the test dataset is enabled
 * (Dev mode). Never shown to a real production user. The production app reads
 * everything through src/lib/data, which returns this only behind the cookie.
 */

export const sampleAgentSettings: AgentSettings = {
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
  ],
  excludedPaths: ["/legal/**", "/admin/**"],
};

export function computeDashboardStats(): DashboardStats {
  const repositories = mockRepositories.length;
  const openIssues = mockIssues.filter(
    (i) => i.status === "open" || i.status === "pr_open",
  ).length;
  const prsCreated = mockPullRequests.filter((p) => p.status !== "simulated").length;

  const merged = mockPullRequests.filter((p) => p.status === "merged");
  const impactFixed = merged
    .flatMap((p) => p.issueIds)
    .map((id) => mockIssues.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .reduce((sum, i) => sum + impactPoints(i), 0);

  const totalPages = mockRepositories.reduce((s, r) => s + r.pages, 0) || 1;
  const globalScore = Math.round(
    mockRepositories.reduce((s, r) => s + r.score * r.pages, 0) / totalPages,
  );
  const scoreDelta = Math.round(
    mockRepositories.reduce((s, r) => s + r.scoreDelta * r.pages, 0) / totalPages,
  );

  return { globalScore, scoreDelta, repositories, openIssues, prsCreated, impactFixed };
}

export const sampleScoreTrend: ScoreTrendPoint[] = [
  { label: "Apr", score: 58 },
  { label: "May", score: 63 },
  { label: "Jun 1", score: 66 },
  { label: "Jun 9", score: 68 },
  { label: "Jun 16", score: 70 },
  { label: "Jun 23", score: 72 },
];

export function computeTopOpportunities(limit = 5) {
  return [...mockIssues]
    .filter((i) => i.status === "open" || i.status === "pr_open")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
