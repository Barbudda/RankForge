import type { Audit, CategoryScore, SeoCategory } from "@/types";
import { CATEGORY_WEIGHTS } from "@/lib/seo/constants";

function cats(
  scores: Partial<Record<SeoCategory, number>>,
  issues: Partial<Record<SeoCategory, number>>,
): CategoryScore[] {
  return (Object.keys(CATEGORY_WEIGHTS) as SeoCategory[]).map((category) => ({
    category,
    score: scores[category] ?? 75,
    issues: issues[category] ?? 0,
    weight: CATEGORY_WEIGHTS[category],
  }));
}

export const mockAudits: Audit[] = [
  {
    id: "audit_acme_2",
    repoId: "repo_acme",
    score: 71,
    previousScore: 65,
    status: "completed",
    createdAt: "2026-06-23T08:42:00.000Z",
    durationMs: 41200,
    totalIssues: 9,
    categories: cats(
      {
        metadata: 62,
        indexing: 58,
        structure: 80,
        images: 74,
        schema: 55,
        "internal-linking": 70,
        performance: 78,
        framework: 85,
      },
      {
        metadata: 2,
        indexing: 2,
        structure: 1,
        images: 1,
        schema: 2,
        "internal-linking": 1,
        performance: 0,
        framework: 0,
      },
    ),
    crawl: {
      pagesScanned: 142,
      pagesWithIssues: 47,
      avgRenderMs: 612,
      brokenLinks: 4,
      renderMode: "rendered",
    },
    frameworkSignals: [
      { label: "App Router", detail: "app/ directory detected", ok: true },
      { label: "generateMetadata", detail: "Used on 18/24 routes", ok: false },
      { label: "next-sitemap", detail: "Not installed", ok: false },
      { label: "Metadata API", detail: "Static metadata on layouts", ok: true },
    ],
  },
  {
    id: "audit_acme_1",
    repoId: "repo_acme",
    score: 65,
    previousScore: 61,
    status: "completed",
    createdAt: "2026-06-09T08:30:00.000Z",
    durationMs: 39800,
    totalIssues: 14,
    categories: cats(
      {
        metadata: 54,
        indexing: 50,
        structure: 76,
        images: 70,
        schema: 48,
        "internal-linking": 64,
        performance: 75,
        framework: 80,
      },
      {},
    ),
    crawl: {
      pagesScanned: 138,
      pagesWithIssues: 61,
      avgRenderMs: 640,
      brokenLinks: 7,
      renderMode: "rendered",
    },
    frameworkSignals: [
      { label: "App Router", detail: "app/ directory detected", ok: true },
      { label: "generateMetadata", detail: "Used on 11/24 routes", ok: false },
      { label: "next-sitemap", detail: "Not installed", ok: false },
    ],
  },
  {
    id: "audit_northstar_1",
    repoId: "repo_northstar",
    score: 64,
    previousScore: 61,
    status: "completed",
    createdAt: "2026-06-22T17:10:00.000Z",
    durationMs: 88400,
    totalIssues: 7,
    categories: cats(
      {
        metadata: 70,
        indexing: 52,
        structure: 75,
        images: 48,
        schema: 50,
        "internal-linking": 66,
        performance: 72,
        framework: 80,
      },
      {
        metadata: 1,
        indexing: 2,
        structure: 0,
        images: 2,
        schema: 1,
        "internal-linking": 1,
        performance: 0,
        framework: 0,
      },
    ),
    crawl: {
      pagesScanned: 386,
      pagesWithIssues: 132,
      avgRenderMs: 305,
      brokenLinks: 11,
      renderMode: "static",
    },
    frameworkSignals: [
      { label: "Content collections", detail: "src/content/ detected", ok: true },
      { label: "MDX frontmatter", detail: "Missing on 23 posts", ok: false },
      { label: "@astrojs/sitemap", detail: "Configured", ok: true },
      { label: "Astro islands", detail: "Minimal client JS", ok: true },
    ],
  },
  {
    id: "audit_studio_1",
    repoId: "repo_studio",
    score: 82,
    previousScore: 81,
    status: "completed",
    createdAt: "2026-06-21T12:05:00.000Z",
    durationMs: 21600,
    totalIssues: 4,
    categories: cats(
      {
        metadata: 86,
        indexing: 84,
        structure: 68,
        images: 88,
        schema: 78,
        "internal-linking": 80,
        performance: 85,
        framework: 88,
      },
      {
        metadata: 0,
        indexing: 0,
        structure: 2,
        images: 0,
        schema: 1,
        "internal-linking": 1,
        performance: 0,
        framework: 0,
      },
    ),
    crawl: {
      pagesScanned: 28,
      pagesWithIssues: 9,
      avgRenderMs: 488,
      brokenLinks: 1,
      renderMode: "rendered",
    },
    frameworkSignals: [
      { label: "Nuxt 3", detail: "nuxt.config.ts detected", ok: true },
      { label: "useSeoMeta", detail: "Used on 24/28 pages", ok: true },
      { label: "@nuxtjs/sitemap", detail: "Configured", ok: true },
      { label: "definePageMeta", detail: "Missing on 4 pages", ok: false },
    ],
  },
];

export function getAudit(id: string): Audit | undefined {
  return mockAudits.find((a) => a.id === id);
}

export function getAuditsForRepo(repoId: string): Audit[] {
  return mockAudits
    .filter((a) => a.repoId === repoId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getLatestAudit(repoId: string): Audit | undefined {
  return getAuditsForRepo(repoId)[0];
}
