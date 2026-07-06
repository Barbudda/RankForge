import type { FixSuggestion, Repository, SeoIssue } from "@/types";
import { Swarm, runAgent } from "./orchestrator";
import { recall, remember } from "@/lib/brain";

/**
 * Fix swarm — turns an SEO issue into a concrete, reviewable patch via a
 * three-stage pipeline: locate the files → generate the diff → validate it.
 * Every change is branch-scoped; RankForge never force-pushes to a default
 * branch (enforced in the prompts and reflected in the output).
 */

const LOCATE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["files"],
  properties: {
    files: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "reason", "confidence"],
        properties: {
          path: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
    },
  },
};

const PATCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "filesChanged",
    "diff",
    "branchName",
    "prTitle",
    "prDescription",
    "validationSteps",
    "rollbackNotes",
  ],
  properties: {
    summary: { type: "string" },
    filesChanged: { type: "array", items: { type: "string" } },
    diff: {
      type: "string",
      description: "A unified diff (+/- lines) implementing the fix.",
    },
    branchName: {
      type: "string",
      description: "A dedicated branch, e.g. rankforge/seo-<slug>.",
    },
    prTitle: { type: "string" },
    prDescription: { type: "string" },
    validationSteps: { type: "array", items: { type: "string" } },
    rollbackNotes: { type: "string" },
  },
};

const VALIDATE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["confidence", "approved", "concerns"],
  properties: {
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    approved: { type: "boolean" },
    concerns: { type: "array", items: { type: "string" } },
  },
};

interface LocateOut {
  files: { path: string; reason: string; confidence: number }[];
}
type PatchOut = Omit<FixSuggestion, "confidence">;
interface ValidateOut {
  confidence: number;
  approved: boolean;
  concerns: string[];
}

function issueBlock(issue: SeoIssue, repo: Repository): string {
  return [
    `Repository: ${repo.fullName} · framework: ${repo.framework} · default branch: ${repo.defaultBranch}`,
    `Issue: ${issue.title} [${issue.category}, impact ${issue.impact}, risk ${issue.risk}]`,
    `Description: ${issue.description}`,
    `Evidence: ${issue.evidence}`,
    `Affected URLs: ${issue.affectedUrls.map((u) => u.url).join(", ") || "(n/a)"}`,
  ].join("\n");
}

export interface FixSwarmResult {
  fix: FixSuggestion;
  telemetry: Swarm["telemetry"];
}

/** Run the locate → patch → validate pipeline for one issue. */
export async function runFixSwarm(
  issue: SeoIssue,
  repo: Repository,
  opts?: {
    files?: Record<string, string>;
    onProgress?: (label: string) => void;
  },
): Promise<FixSwarmResult> {
  const swarm = new Swarm(opts?.onProgress);
  const base = issueBlock(issue, repo);

  // Brain: recall similar fixes RankForge has generated before, to reuse what
  // worked for this framework/category.
  const priorFixes = await recall(`${issue.title} ${issue.description}`, {
    repoId: repo.id,
    kind: "fix",
    limit: 4,
  }).catch(() => []);
  const priorBlock = priorFixes.length
    ? `\n\nPrior fixes from RankForge's memory (reuse the approach where it fits):\n${priorFixes
        .map((m) => `• ${m.title || m.content.slice(0, 100)}`)
        .join("\n")}`
    : "";

  const fileHints = issue.files.length
    ? `\nLikely files (from the audit): ${issue.files.map((f) => f.path).join(", ")}`
    : "";
  const repoFiles = opts?.files
    ? `\n\nRepository files provided:\n${Object.entries(opts.files)
        .map(([p, c]) => `--- ${p} ---\n${c.slice(0, 4000)}`)
        .join("\n\n")}`
    : "";

  const located = await runAgent<LocateOut>({
    label: "fix:locate",
    system: `You map a technical-SEO issue to the exact source files to edit in a ${repo.framework} repository. Prefer the framework's idiomatic location (e.g. Next.js App Router metadata in layout/page files). Be specific and conservative.`,
    prompt: `${base}${fileHints}${repoFiles}\n\nList the files to edit.`,
    schema: LOCATE_SCHEMA,
    maxTokens: 2000,
    swarm,
  });

  const targetFiles =
    located.files.map((f) => f.path).join(", ") ||
    issue.files.map((f) => f.path).join(", ") ||
    "(infer from framework conventions)";

  const patch = await runAgent<PatchOut>({
    label: "fix:patch",
    system: `You generate a minimal, correct unified diff that fixes the technical-SEO issue for a ${repo.framework} repository. Keep the change small and reviewable, on a dedicated branch (never the default branch). Output valid diff syntax with +/- lines and clear hunks. Include a concise PR title/description, validation steps, and rollback notes. Never claim the change affects search rankings.`,
    prompt: `${base}\n\nFiles to edit: ${targetFiles}${repoFiles}${priorBlock}\n\nProduce the patch.`,
    schema: PATCH_SCHEMA,
    maxTokens: 8000,
    swarm,
  });

  const review = await runAgent<ValidateOut>({
    label: "fix:validate",
    system: `You are a skeptical reviewer. Judge whether the proposed diff correctly and safely fixes the issue for ${repo.framework}, without breaking the build or touching unrelated code. Return a 0–100 confidence, an approved flag, and any concrete concerns.`,
    prompt: `${base}\n\nProposed change:\nSummary: ${patch.summary}\nFiles: ${patch.filesChanged.join(", ")}\nDiff:\n${patch.diff}\n\nReview it.`,
    schema: VALIDATE_SCHEMA,
    maxTokens: 2000,
    swarm,
  });

  const fix: FixSuggestion = {
    ...patch,
    validationSteps: [
      ...patch.validationSteps,
      ...review.concerns.map((c) => `Reviewer concern: ${c}`),
    ],
    confidence: review.confidence,
  };

  // Learning loop: remember this fix so similar future issues reuse it.
  await remember({
    kind: "fix",
    repoId: repo.id,
    sourceId: `fix:${issue.id}`,
    title: `Fix: ${issue.title}`,
    content: `[${issue.category}] ${fix.summary} Files: ${fix.filesChanged.join(", ")}. Confidence ${fix.confidence}. Branch ${fix.branchName}.`,
    metadata: {
      issueId: issue.id,
      category: issue.category,
      confidence: fix.confidence,
    },
  }).catch(() => 0);

  return { fix, telemetry: swarm.telemetry };
}
