// The CLI runs on the user's own machine: auditing http://localhost is the
// point, and there is no hosted server to protect. The SSRF guard reads this
// at call time (not import time), so setting it here is enough.
process.env.RANKFORGE_ALLOW_LOCAL = "1";

import type { Framework, Repository, SeoIssue, Severity } from "@/types";
import { crawl, probeSiteFiles } from "@/lib/agents/crawl";
import { runDeterministicAudit, type EngineIssue } from "@/lib/audit/engine";
import { probeResources } from "@/lib/audit/resource-probe";
import { FIXABLE_RULE_IDS, generateDeterministicFix } from "@/lib/audit/deterministic-fix";
import { SEO_RULES } from "@/lib/audit/rules";

/**
 * rankforge — deterministic technical-SEO audit, from the terminal.
 *
 *   rankforge audit <url> [--pages N] [--framework nextjs] [--json] [--fail-under N] [--no-probe]
 *   rankforge fix <ruleId> [--framework nextjs] [--url https://…]
 *   rankforge rules
 *
 * No AI, no API keys, no telemetry. The same engine that powers rankforge.dev.
 */

const VERSION = "0.1.0";
const APP_URL = "https://rank-forge-blue.vercel.app";

const FRAMEWORKS: Framework[] = ["nextjs", "nuxt", "astro", "sveltekit", "remix", "vite-react", "mdx", "static"];

// ── tiny ANSI helper (zero deps; honors NO_COLOR and non-TTY) ─────────
const useColor = !process.env.NO_COLOR && process.stdout.isTTY && !process.argv.includes("--no-color");
const paint = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const c = {
  bold: paint("1"),
  dim: paint("2"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  blue: paint("34"),
  cyan: paint("36"),
  gray: paint("90"),
};

const IMPACT_ORDER: Severity[] = ["critical", "high", "medium", "low"];
const impactPaint: Record<Severity, (s: string) => string> = {
  critical: c.red,
  high: c.red,
  medium: c.yellow,
  low: c.gray,
};

// ── arg parsing (no deps) ─────────────────────────────────────────────
type Args = { _: string[]; flags: Record<string, string | boolean> };
function parseArgs(argv: string[]): Args {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const [k, inline] = a.slice(2).split("=", 2);
      if (inline !== undefined) out.flags[k!] = inline;
      else if (k!.startsWith("no-")) out.flags[k!.slice(3)] = false;
      else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          out.flags[k!] = next;
          i++;
        } else out.flags[k!] = true;
      }
    } else out._.push(a);
  }
  return out;
}

function fail(msg: string, code = 2): never {
  process.stderr.write(`${c.red("error")} ${msg}\n`);
  process.exit(code);
}

function asFramework(v: unknown): Framework {
  if (v === undefined) return "nextjs";
  if (FRAMEWORKS.includes(v as Framework)) return v as Framework;
  return fail(`Unknown framework "${String(v)}". Use one of: ${FRAMEWORKS.join(", ")}`);
}

function asUrl(v: string | undefined): string {
  if (!v) return fail("Missing <url>. Example: rankforge audit https://example.com");
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    return u.toString();
  } catch {
    return fail(`Not a valid URL: ${v}`);
  }
}

function synthRepo(url: string, framework: Framework): Repository {
  return {
    id: "cli",
    framework,
    productionUrl: url,
    fullName: "local/site",
    defaultBranch: "main",
    score: 0,
  } as unknown as Repository;
}

// ── audit ─────────────────────────────────────────────────────────────
async function cmdAudit(args: Args) {
  const url = asUrl(args._[1]);
  const framework = asFramework(args.flags.framework);
  const maxPages = Math.max(1, Math.min(Number(args.flags.pages) || 8, 24));
  const json = args.flags.json === true;
  const probe = args.flags.probe !== false;
  const failUnder = args.flags["fail-under"] !== undefined ? Number(args.flags["fail-under"]) : null;

  const started = Date.now();
  if (!json) process.stderr.write(`${c.dim(`crawling ${url} (up to ${maxPages} pages)…`)}\n`);

  const repo = synthRepo(url, framework);
  const [pages, siteFiles] = await Promise.all([
    crawl(url, { maxPages, deadlineMs: 90_000 }),
    probeSiteFiles(url),
  ]);
  const resources =
    probe && maxPages > 1 ? await probeResources(pages, url).catch(() => undefined) : undefined;
  const engine = runDeterministicAudit(repo, pages, siteFiles, resources);

  const scores = engine.categoryScores as Record<string, number>;
  const scoreValues = Object.values(scores);
  const overall = scoreValues.length
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 0;
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const issues = [...engine.issues].sort(
    (a, b) =>
      IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) ||
      b.affectedUrls.length - a.affectedUrls.length,
  );

  if (json) {
    process.stdout.write(
      JSON.stringify(
        {
          url,
          pagesCrawled: pages.length,
          elapsedSeconds: Number(elapsed),
          overall,
          categoryScores: scores,
          issues: issues.map(compactIssue),
          siteSignals: engine.siteSignals,
        },
        null,
        2,
      ) + "\n",
    );
  } else {
    printReport({ url, pages: pages.length, elapsed, overall, scores, issues, engine });
  }

  if (failUnder !== null && overall < failUnder) {
    if (!json) process.stderr.write(`\n${c.red("✗")} score ${overall} is below --fail-under ${failUnder}\n`);
    process.exit(1);
  }
}

function compactIssue(i: EngineIssue) {
  return {
    ruleId: i.ruleId,
    category: i.category,
    impact: i.impact,
    title: i.title,
    evidence: i.evidence,
    affectedCount: i.affectedUrls.length,
    affectedUrls: i.affectedUrls.slice(0, 10),
    likelyFiles: i.files.map((f) => f.path),
    fixTemplate: FIXABLE_RULE_IDS.includes(i.ruleId),
  };
}

function bar(score: number, width = 12): string {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * width);
  const tone = score >= 80 ? c.green : score >= 60 ? c.yellow : c.red;
  return tone("█".repeat(filled)) + c.gray("░".repeat(width - filled));
}

function printReport(r: {
  url: string;
  pages: number;
  elapsed: string;
  overall: number;
  scores: Record<string, number>;
  issues: EngineIssue[];
  engine: ReturnType<typeof runDeterministicAudit>;
}) {
  const out: string[] = [];
  const w = (s = "") => out.push(s);

  w("");
  w(`${c.bold("RankForge audit")}  ${c.cyan(r.url)}`);
  w(c.dim(`${r.pages} pages · ${r.elapsed}s · deterministic — no AI, no external API`));
  w("");

  const tone = r.overall >= 80 ? c.green : r.overall >= 60 ? c.yellow : c.red;
  w(`${c.bold("Score")}  ${tone(c.bold(`${r.overall}/100`))}`);
  for (const [cat, score] of Object.entries(r.scores)) {
    w(`  ${cat.padEnd(17)} ${bar(score)}  ${String(score).padStart(3)}`);
  }
  w("");

  if (r.issues.length === 0) {
    w(`${c.green("✓")} No issues detected. Nice.`);
  } else {
    w(`${c.bold("Issues")} ${c.dim(`(${r.issues.length})`)}`);
    for (const i of r.issues) {
      const tag = impactPaint[i.impact](i.impact.toUpperCase().padEnd(8));
      const fixable = i.ruleId && FIXABLE_RULE_IDS.includes(i.ruleId) ? c.green(" · fix template") : "";
      w(`  ${tag} ${c.bold(i.title)} ${c.dim(`(${i.affectedUrls.length})`)}${fixable}`);
      if (i.evidence) w(`           ${c.dim(i.evidence)}`);
      const urls = i.affectedUrls.slice(0, 3).map((u) => u.url);
      if (urls.length) {
        const more = i.affectedUrls.length > 3 ? c.dim(` +${i.affectedUrls.length - 3} more`) : "";
        w(`           ${c.gray("→")} ${urls.join(c.gray(", "))}${more}`);
      }
    }
    w("");
  }

  const s = r.engine.siteSignals;
  const signals: string[] = [];
  if (s.orphanPages?.length) signals.push(`${s.orphanPages.length} orphan page${s.orphanPages.length > 1 ? "s" : ""}`);
  if (typeof s.maxDepth === "number") signals.push(`max click depth ${s.maxDepth}`);
  if (s.brokenInternalLinks?.length) signals.push(`${s.brokenInternalLinks.length} broken internal links`);
  if (s.duplicateClusters?.length) signals.push(`${s.duplicateClusters.length} near-duplicate clusters`);
  if (s.linkSuggestions?.length) signals.push(`${s.linkSuggestions.length} internal-link suggestions`);
  if (signals.length) {
    w(`${c.bold("Site signals")}  ${c.dim(signals.join(" · "))}`);
    w("");
  }

  const fixable = r.issues.filter((i) => i.ruleId && FIXABLE_RULE_IDS.includes(i.ruleId));
  if (fixable.length) {
    w(`${c.green("✚")} ${fixable.length} issue${fixable.length > 1 ? "s have" : " has"} a ready patch: ${c.cyan(`rankforge fix <ruleId> --framework <fw>`)}`);
  }
  w(c.dim(`Full report, patches by file & the editor agent: ${APP_URL}`));
  w("");
  process.stdout.write(out.join("\n"));
}

// ── fix ───────────────────────────────────────────────────────────────
function cmdFix(args: Args) {
  const ruleId = args._[1];
  if (!ruleId) return fail(`Missing <ruleId>. Fixable rules: ${FIXABLE_RULE_IDS.join(", ")}`);
  if (!FIXABLE_RULE_IDS.includes(ruleId)) {
    return fail(`No deterministic patch for "${ruleId}". Fixable rules: ${FIXABLE_RULE_IDS.join(", ")}`);
  }
  const framework = asFramework(args.flags.framework);
  const url = typeof args.flags.url === "string" ? asUrl(args.flags.url) : "https://example.com/";
  const repo = synthRepo(url, framework);
  const issue = {
    id: `iss_cli:${ruleId}`,
    repoId: "cli",
    title: ruleId,
    description: "",
    category: "framework",
    impact: "medium",
    effort: "low",
    risk: "low",
    confidence: 90,
    status: "open",
    affectedUrls: [{ url }],
    evidence: "",
    canAutoFix: true,
    files: [],
  } as unknown as SeoIssue;
  const fix = generateDeterministicFix(issue, repo);
  if (!fix) return fail("No template available for this rule.");

  if (args.flags.json === true) {
    process.stdout.write(JSON.stringify(fix, null, 2) + "\n");
    return;
  }
  const out: string[] = [];
  out.push("");
  out.push(`${c.bold(fix.summary)}`);
  out.push(c.dim(`files: ${fix.filesChanged.join(", ")} · branch: ${fix.branchName} · confidence ${fix.confidence}%`));
  out.push("");
  for (const line of fix.diff.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) out.push(c.bold(line));
    else if (line.startsWith("@@")) out.push(c.cyan(line));
    else if (line.startsWith("+")) out.push(c.green(line));
    else if (line.startsWith("-")) out.push(c.red(line));
    else out.push(c.dim(line));
  }
  out.push("");
  out.push(`${c.bold("Verify")}`);
  for (const step of fix.validationSteps) out.push(`  • ${step}`);
  out.push("");
  process.stdout.write(out.join("\n"));
}

// ── rules ─────────────────────────────────────────────────────────────
function cmdRules(args: Args) {
  if (args.flags.json === true) {
    process.stdout.write(
      JSON.stringify(
        SEO_RULES.map((r) => ({
          id: r.id,
          category: r.category,
          title: r.title,
          impact: r.defaultImpact,
          canAutoFix: r.canAutoFix,
        })),
        null,
        2,
      ) + "\n",
    );
    return;
  }
  const out: string[] = [""];
  out.push(`${c.bold("Rule catalog")} ${c.dim(`(${SEO_RULES.length} documented classes; the engine checks ~35)`)}`);
  let last = "";
  for (const r of SEO_RULES) {
    if (r.category !== last) {
      out.push("");
      out.push(c.cyan(r.category));
      last = r.category;
    }
    const auto = r.canAutoFix ? c.green(" auto-fix") : "";
    out.push(`  ${impactPaint[r.defaultImpact as Severity](r.defaultImpact.padEnd(8))} ${r.title}${auto}`);
  }
  out.push("");
  process.stdout.write(out.join("\n"));
}

// ── help / main ───────────────────────────────────────────────────────
function help() {
  process.stdout.write(`
${c.bold("rankforge")} ${c.dim(`v${VERSION}`)} — deterministic technical-SEO audit. No AI, no API keys.

${c.bold("Usage")}
  rankforge audit <url> [--pages N] [--framework nextjs] [--json] [--fail-under N] [--no-probe]
  rankforge fix <ruleId> [--framework nextjs] [--url https://…] [--json]
  rankforge rules [--json]

${c.bold("Examples")}
  rankforge audit http://localhost:3000
  rankforge audit https://example.com --pages 12 --framework astro
  rankforge audit https://example.com --json --fail-under 80     ${c.dim("# CI gate")}
  rankforge fix framework-robots-missing --framework nextjs

${c.bold("Flags")}
  --pages N        pages to crawl, breadth-first (default 8, max 24)
  --framework fw   ${FRAMEWORKS.join(" | ")}
  --json           machine-readable output
  --fail-under N   exit 1 if the overall score is below N (for CI)
  --no-probe       skip real image/link probing (faster)
  --no-color       plain output (also: NO_COLOR=1)

${c.dim(`Hosted app, patches by file & the editor agent (MCP): ${APP_URL}`)}
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (args.flags.version === true || cmd === "version") {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (!cmd || args.flags.help === true || cmd === "help") return help();
  try {
    if (cmd === "audit") await cmdAudit(args);
    else if (cmd === "fix") cmdFix(args);
    else if (cmd === "rules") cmdRules(args);
    else fail(`Unknown command "${cmd}". Try: rankforge --help`);
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }
}

main();
