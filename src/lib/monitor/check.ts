import type { CategoryScore, Framework, Repository, SeoCategory } from "@/types";
import { crawlSite, probeSiteFiles } from "@/lib/agents/crawl";
import { runDeterministicAudit } from "@/lib/audit/engine";
import { runGeoAudit } from "@/lib/audit/geo";
import { buildSnapshot, diffSnapshots, type SiteSnapshot, type SnapshotDiff } from "@/lib/audit/snapshot";
import { fetchVitals } from "@/lib/audit/vitals";
import { computeOverallScore } from "@/lib/scoring";
import { CATEGORY_WEIGHTS } from "@/lib/seo/constants";

/**
 * One monitoring check of a site: probe the site files, crawl (links first,
 * then the pages the previous check knew about and the sitemap entries, so a
 * page that disappears is noticed), run the deterministic engine, snapshot it
 * and diff it against the previous snapshot.
 *
 * Deliberately lighter than a full audit: no image/link resource probing,
 * three parallel requests, robots.txt honoured. It runs every day on other
 * people's servers.
 */

export interface SiteCheckResult {
  snapshot: SiteSnapshot;
  diff: SnapshotDiff | null;
  pages: number;
  crawlComplete: boolean;
  topIssues: { title: string; impact: string; count: number }[];
}

function weightedOverall(cats: Record<string, number>): number {
  const list: CategoryScore[] = (Object.entries(cats) as [SeoCategory, number][]).map(([category, score]) => ({
    category,
    score,
    issues: 0,
    weight: CATEGORY_WEIGHTS[category],
  }));
  return computeOverallScore(list);
}

export function isSnapshot(v: unknown): v is SiteSnapshot {
  const s = v as SiteSnapshot | null;
  return Boolean(s && typeof s === "object" && typeof s.v === "number" && s.pages && Array.isArray(s.issues));
}

export async function runSiteCheck(input: {
  url: string;
  framework: Framework;
  maxPages: number;
  previous?: SiteSnapshot | null;
  deadlineMs?: number;
}): Promise<SiteCheckResult> {
  const siteFiles = await probeSiteFiles(input.url);
  const seeds = [
    ...Object.keys(input.previous?.pages ?? {}).map((p) => ({ url: p, via: "seed" as const })),
    ...(siteFiles.sitemapUrls ?? []).slice(0, 1000).map((u) => ({ url: u, via: "sitemap" as const })),
  ];
  const crawl = await crawlSite(input.url, {
    maxPages: input.maxPages,
    hardCap: 500,
    concurrency: 3,
    deadlineMs: input.deadlineMs ?? 120_000,
    robotsTxt: siteFiles.robotsTxt,
    seeds,
  });
  if (crawl.pages.length === 0) {
    throw new Error(
      crawl.blockedByRobots.length
        ? "robots.txt disallows RankForgeBot on this site, so it can't be checked."
        : "The site could not be reached.",
    );
  }

  const key = process.env.CRUX_API_KEY;
  const vitalsRes = key ? await fetchVitals(input.url, key) : null;
  const files = { ...siteFiles, crawlComplete: crawl.complete, vitals: vitalsRes?.ok ? vitalsRes.report : null };

  const repo = {
    id: "monitor",
    framework: input.framework,
    productionUrl: input.url,
    fullName: "monitor/site",
    defaultBranch: "main",
    score: 0,
  } as unknown as Repository;
  const engine = runDeterministicAudit(repo, crawl.pages, files);
  const overall = weightedOverall(engine.categoryScores);
  const geo = runGeoAudit(crawl.pages, files);
  const snapshot = buildSnapshot({ url: input.url, pages: crawl.pages, engine, overall, geo, siteFiles: files });

  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const topIssues = [...engine.issues]
    .sort((a, b) => rank[a.impact] - rank[b.impact] || b.affectedUrls.length - a.affectedUrls.length)
    .slice(0, 5)
    .map((i) => ({ title: i.title, impact: i.impact, count: i.affectedUrls.length }));

  return {
    snapshot,
    diff: input.previous ? diffSnapshots(input.previous, snapshot) : null,
    pages: crawl.pages.length,
    crawlComplete: crawl.complete,
    topIssues,
  };
}
