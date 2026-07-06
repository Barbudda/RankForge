import { randomUUID } from "node:crypto";
import type {
  Audit,
  CategoryScore,
  Repository,
  SeoCategory,
  SeoIssue,
} from "@/types";
import type { AuditResult, CrawledPage } from "@/lib/audit/types";
import { CATEGORY_META, CATEGORY_WEIGHTS } from "@/lib/seo/constants";
import { computeOverallScore } from "@/lib/scoring";
import { crawl, probeSiteFiles } from "./crawl";
import {
  runDeterministicAudit,
  type EngineIssue,
  type EngineResult,
} from "@/lib/audit/engine";
import { probeResources } from "@/lib/audit/resource-probe";
import { Swarm, runAgent } from "./orchestrator";
import { agentsEnabled } from "./client";
import { remember } from "@/lib/brain";

/**
 * Audit runner — DETERMINISTIC-FIRST.
 *
 * The core audit (crawl → parse → rule engine → link graph → content analysis)
 * runs entirely in-process with NO external API and NO LLM. When an LLM is
 * configured, a single bounded enrichment agent adds content-quality findings
 * the deterministic rules can't judge (readability, topical coverage). The
 * audit is fully useful with zero keys — the LLM is strictly additive.
 */

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Empty fix placeholder — filled in later by the fix swarm on demand. */
const EMPTY_FIX: SeoIssue["suggestedFix"] = {
  summary: "",
  filesChanged: [],
  diff: "",
  branchName: "",
  prTitle: "",
  prDescription: "",
  validationSteps: [],
  rollbackNotes: "",
  confidence: 0,
};

export interface AuditSwarmResult extends AuditResult {
  telemetry: Swarm["telemetry"];
  siteSignals: EngineResult["siteSignals"];
}

// ── Optional LLM enrichment (content quality) ───────────────────────
const ENRICH_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["issues"],
  properties: {
    issues: {
      type: "array",
      description:
        "Content-quality issues that require reading the actual copy (NOT mechanical checks like missing tags — those are handled elsewhere).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "title", "description", "impact", "confidence", "evidence", "affectedUrls"],
        properties: {
          category: { type: "string", enum: ["metadata", "structure", "internal-linking"] },
          title: { type: "string" },
          description: { type: "string" },
          impact: { type: "string", enum: ["critical", "high", "medium", "low"] },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
          evidence: { type: "string" },
          affectedUrls: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["url"],
              properties: { url: { type: "string" }, note: { type: "string" } },
            },
          },
        },
      },
    },
  },
};

interface EnrichOutput {
  issues: Array<{
    category: "metadata" | "structure" | "internal-linking";
    title: string;
    description: string;
    impact: SeoIssue["impact"];
    confidence: number;
    evidence: string;
    affectedUrls: { url: string; note?: string }[];
  }>;
}

/** Compact per-page view for the enrichment agent (text-focused). */
function contentSummary(page: CrawledPage): string {
  return [
    `URL: ${page.url}`,
    `Title: ${page.title ?? "(none)"}`,
    `H1: ${page.h1s.join(" | ") || "(none)"}`,
    `Words: ${page.wordCount}`,
    `Text (excerpt): ${page.textContent.slice(0, 1400)}`,
  ].join("\n");
}

async function enrich(
  repo: Repository,
  pages: CrawledPage[],
  swarm: Swarm,
): Promise<EnrichOutput["issues"]> {
  // Only the richest few pages — keep it to one bounded call.
  const sample = [...pages]
    .filter((p) => p.statusCode < 300 && p.wordCount > 40)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 6);
  if (sample.length === 0) return [];

  const out = await runAgent<EnrichOutput>({
    label: "audit:content-quality",
    system: [
      "You are a senior SEO content strategist. You review the ACTUAL copy of pages for content-quality issues that mechanical checks miss:",
      "- Weak/uncompelling titles & headings (not length — quality and keyword intent).",
      "- Thin, generic, or off-topic body content; missing topical coverage a searcher would expect.",
      "- Internal-linking/anchor opportunities implied by the content.",
      "Report ONLY issues you can evidence from the provided text. Do NOT report missing tags, canonicals, alt text, schema, or other mechanical items — those are handled deterministically. Never promise rankings. Be concise and concrete.",
    ].join("\n"),
    prompt: `Repository: ${repo.fullName} (${repo.framework}).\n\nPages:\n\n${sample.map(contentSummary).join("\n\n---\n\n")}\n\nReturn content-quality issues only.`,
    schema: ENRICH_SCHEMA,
    maxTokens: 3000,
    swarm,
  });
  return out.issues ?? [];
}

/**
 * Run the audit: crawl, run the deterministic engine (always), optionally
 * enrich with one content-quality LLM pass. Returns a scored Audit + issues.
 */
export async function runAuditSwarm(
  repo: Repository,
  opts?: { maxPages?: number; onProgress?: (label: string) => void; enrich?: boolean },
): Promise<AuditSwarmResult> {
  const started = Date.now();
  const swarm = new Swarm(opts?.onProgress);

  // Budget the crawl to stay comfortably within a serverless function limit
  // (the audit pages set maxDuration=60). Fewer pages + a ~45s wall-clock
  // deadline keeps a real audit well under the timeout on any Vercel plan.
  const [pages, siteFiles] = await Promise.all([
    crawl(repo.productionUrl, { maxPages: opts?.maxPages ?? 8, deadlineMs: 45_000 }),
    probeSiteFiles(repo.productionUrl),
  ]);
  opts?.onProgress?.(`crawl:${pages.length}-pages`);

  // Measure real resources (images + links) — bounded, best-effort. If it
  // fails or times out, the HTML-level rules still stand.
  const resources = await probeResources(pages, repo.productionUrl).catch(() => undefined);
  opts?.onProgress?.("probe:resources");

  // ── Deterministic base (no LLM, no external API) ──────────────────
  const engine = runDeterministicAudit(repo, pages, siteFiles, resources);
  opts?.onProgress?.("engine:deterministic");

  const auditId = `audit_${randomUUID()}`;
  const nowIso = new Date().toISOString();

  const mapEngineIssue = (i: EngineIssue): SeoIssue => ({
    id: `iss_${repo.id}:${i.ruleId}`,
    repoId: repo.id,
    auditId,
    title: i.title,
    description: i.description,
    category: i.category,
    impact: i.impact,
    effort: i.effort,
    risk: i.risk,
    confidence: i.confidence,
    status: "open",
    affectedUrls: i.affectedUrls,
    evidence: i.evidence,
    suggestedFix: EMPTY_FIX,
    files: i.files,
    canAutoFix: i.canAutoFix,
    createdAt: nowIso,
  });

  const issues: SeoIssue[] = engine.issues.map(mapEngineIssue);

  // ── Optional LLM enrichment (content quality) ─────────────────────
  if (agentsEnabled && opts?.enrich !== false) {
    try {
      const extra = await enrich(repo, pages, swarm);
      for (const e of extra) {
        if (e.affectedUrls?.length) {
          issues.push({
            id: `iss_${repo.id}:llm-content:${slug(e.title)}`,
            repoId: repo.id,
            auditId,
            title: e.title,
            description: e.description,
            category: e.category as SeoCategory,
            impact: e.impact,
            effort: "medium",
            risk: "low",
            confidence: e.confidence,
            status: "open",
            affectedUrls: e.affectedUrls,
            evidence: e.evidence,
            suggestedFix: EMPTY_FIX,
            files: [],
            canAutoFix: false,
            createdAt: nowIso,
          });
        }
      }
    } catch {
      /* enrichment is best-effort — the deterministic audit stands alone */
    }
  }

  // ── Scores from the engine + brain learning loop ──────────────────
  const categoryScores: CategoryScore[] = (Object.keys(CATEGORY_META) as SeoCategory[]).map(
    (category) => ({
      category,
      score: engine.categoryScores[category] ?? 100,
      issues: issues.filter((i) => i.category === category).length,
      weight: CATEGORY_WEIGHTS[category],
    }),
  );
  const score = computeOverallScore(categoryScores);
  const avgRenderMs = pages.length
    ? Math.round(pages.reduce((s, p) => s + p.renderMs, 0) / pages.length)
    : 0;

  const audit: Audit = {
    id: auditId,
    repoId: repo.id,
    score,
    previousScore: repo.score || null,
    status: "completed",
    createdAt: nowIso,
    durationMs: Date.now() - started,
    totalIssues: issues.length,
    categories: categoryScores,
    crawl: {
      pagesScanned: pages.length,
      pagesWithIssues: new Set(
        issues.flatMap((i) => i.affectedUrls.map((u) => u.url)),
      ).size,
      avgRenderMs,
      brokenLinks: engine.siteSignals.brokenInternalLinks.length,
      renderMode: "static",
    },
    frameworkSignals: [],
  };

  // Persist to the brain so future audits + the chatbot recall continuity.
  const weakest = [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((c) => `${c.category} (${c.score})`)
    .join(", ");
  await remember([
    {
      kind: "audit",
      repoId: repo.id,
      sourceId: audit.id,
      title: `Audit ${nowIso.slice(0, 10)} — score ${score}`,
      content: `Audit of ${repo.fullName}: score ${score}, ${issues.length} issues over ${pages.length} pages. Weakest: ${weakest}. Orphans: ${engine.siteSignals.orphanPages.length}, max depth ${engine.siteSignals.maxDepth}, ${engine.siteSignals.linkSuggestions.length} internal-link opportunities.`,
      metadata: { score, totalIssues: issues.length },
    },
    ...issues.slice(0, 40).map((i) => ({
      kind: "issue" as const,
      repoId: repo.id,
      sourceId: `issue:${i.id}`,
      title: i.title,
      content: `[${i.category}, ${i.impact} impact] ${i.description} Evidence: ${i.evidence}`,
      metadata: { category: i.category, impact: i.impact, issueId: i.id },
    })),
  ]).catch(() => 0);

  return { audit, issues, telemetry: swarm.telemetry, siteSignals: engine.siteSignals };
}
