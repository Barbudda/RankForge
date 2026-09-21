"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search, Terminal, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The free, no-signup audit form + its report. Posts to /api/public-audit
 * (bounded: 3 pages) and renders a scored, evidenced report inline, then
 * hands off to the three deeper paths: the free app, the CLI, the editor
 * agent. Every number shown is measured by the deterministic engine.
 */

type Issue = {
  ruleId: string;
  category: string;
  impact: "critical" | "high" | "medium" | "low";
  title: string;
  evidence: string;
  affectedCount: number;
  affectedUrls: string[];
  fixTemplate: boolean;
};

type Report = {
  url: string;
  pagesCrawled: number;
  elapsedMs: number;
  overall: number;
  categoryScores: { category: string; score: number }[];
  issues: Issue[];
  signals: { orphanPages: number; maxDepth: number; brokenInternalLinks: number; linkSuggestions: number };
};

const CATEGORY_LABEL: Record<string, string> = {
  metadata: "Metadata",
  indexing: "Indexing",
  structure: "Page structure",
  images: "Images",
  schema: "Structured data",
  "internal-linking": "Internal linking",
  performance: "Performance",
  framework: "Framework",
};

const IMPACT_CLASS: Record<Issue["impact"], string> = {
  critical: "border-danger/40 bg-danger/10 text-danger",
  high: "border-danger/30 bg-danger/[0.07] text-danger",
  medium: "border-amber/30 bg-amber/10 text-amber",
  low: "border-border bg-surface text-fg-subtle",
};

function scoreTone(score: number) {
  if (score >= 80) return "text-signal";
  if (score >= 65) return "text-cyan";
  if (score >= 50) return "text-amber";
  return "text-danger";
}
function barTone(score: number) {
  if (score >= 80) return "bg-signal";
  if (score >= 65) return "bg-cyan";
  if (score >= 50) return "bg-amber";
  return "bg-danger";
}

function CopyCmd({ cmd }: { cmd: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(cmd);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="group flex w-full items-center gap-2 rounded-lg border border-border bg-code px-3 py-2 text-left font-mono text-xs text-fg-muted transition-colors hover:border-electric/40"
      aria-label="Copy command"
    >
      <span className="truncate">{cmd}</span>
      <span className="ml-auto shrink-0 text-fg-subtle">
        {ok ? <Check className="size-3.5 text-signal" /> : <Copy className="size-3.5" />}
      </span>
    </button>
  );
}

export function PublicAudit() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/public-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Audit failed.");
      else setReport(data as Report);
    } catch {
      setError("Couldn't reach the audit service — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cliCmd = `npx rankforge-cli audit ${report?.url ?? (url.trim() || "https://your-site.com")}`;

  return (
    <div>
      {/* Form */}
      <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
        <label className="flex h-12 flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface/70 px-4 transition-colors focus-within:border-electric">
          <Search className="size-4 shrink-0 text-fg-subtle" />
          <span className="sr-only">Site URL</span>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-site.com"
            required
            className="h-full w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-electric px-6 font-medium text-white shadow-[0_10px_40px_-10px_var(--color-electric)] transition-colors hover:bg-electric-bright disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {loading ? "Auditing…" : "Audit for free"}
        </button>
      </form>
      <p className="mt-2.5 text-xs text-fg-subtle">
        No signup. Crawls 3 pages, measures everything, keeps nothing. Full crawl in the free app or the CLI.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-fg-muted" role="status" aria-live="polite">
          Crawling the rendered pages, measuring images and links, building the internal link graph…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Report */}
      {report && (
        <div className="mt-10 space-y-8">
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface/70 p-6 md:flex-row md:items-center md:gap-10">
            <div className="shrink-0">
              <div className="text-xs text-fg-subtle">Technical SEO score</div>
              <div className={cn("mt-1 font-mono text-6xl font-semibold tabular-nums leading-none", scoreTone(report.overall))}>
                {report.overall}
                <span className="text-2xl text-fg-subtle">/100</span>
              </div>
              <div className="mt-2 truncate text-xs text-fg-subtle">
                {report.url} · {report.pagesCrawled} page{report.pagesCrawled > 1 ? "s" : ""} · {(report.elapsedMs / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {report.categoryScores.map((c) => (
                <div key={c.category} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-fg-muted">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span className={cn("block h-full rounded-full", barTone(c.score))} style={{ width: `${c.score}%` }} />
                  </span>
                  <span className={cn("w-8 text-right font-mono text-xs tabular-nums", scoreTone(c.score))}>{c.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-fg">
              {report.issues.length === 0 ? "No issues detected" : `${report.issues.length} issue${report.issues.length > 1 ? "s" : ""} found`}
              <span className="ml-2 text-sm font-normal text-fg-subtle">every one measured, with evidence</span>
            </h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/60">
              {report.issues.map((i) => (
                <li key={i.ruleId} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase", IMPACT_CLASS[i.impact])}>
                      {i.impact}
                    </span>
                    <span className="font-medium text-fg">{i.title}</span>
                    <span className="text-xs text-fg-subtle">({i.affectedCount})</span>
                    {i.fixTemplate && (
                      <span className="rounded border border-signal/30 bg-signal/10 px-1.5 py-0.5 font-mono text-[11px] text-signal">ready patch</span>
                    )}
                  </div>
                  {i.evidence && <p className="mt-1.5 text-sm text-fg-muted">{i.evidence}</p>}
                  {i.affectedUrls.length > 0 && (
                    <p className="mt-1.5 truncate font-mono text-xs text-fg-subtle">
                      → {i.affectedUrls.join(", ")}
                      {i.affectedCount > i.affectedUrls.length ? ` +${i.affectedCount - i.affectedUrls.length} more` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-subtle">
              Site signals: {report.signals.orphanPages} orphan page{report.signals.orphanPages === 1 ? "" : "s"} · max click depth {report.signals.maxDepth} · {report.signals.brokenInternalLinks} broken internal links · {report.signals.linkSuggestions} internal-link suggestions
            </p>
          </div>

          {/* Deeper paths */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-electric/30 bg-electric/[0.05] p-5">
              <h3 className="font-semibold text-fg">The full audit, free</h3>
              <p className="mt-1.5 text-sm text-fg-muted">Up to 24 pages, audit history, and every fix as a diff grouped by file.</p>
              <Link href="/signup" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-electric-bright hover:underline">
                Create a free account <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-surface/60 p-5">
              <h3 className="font-semibold text-fg">Unlimited, in your terminal</h3>
              <p className="mt-1.5 text-sm text-fg-muted">The same engine as an open-source CLI. Audits localhost too.</p>
              <div className="mt-4"><CopyCmd cmd={cliCmd} /></div>
            </div>
            <div className="rounded-xl border border-border bg-surface/60 p-5">
              <h3 className="font-semibold text-fg">Fixed by your editor</h3>
              <p className="mt-1.5 text-sm text-fg-muted">Connect the agent to Claude Code or Cursor — it audits and patches your repo.</p>
              <Link href="/docs/agent" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-electric-bright hover:underline">
                <Terminal className="size-4" /> Set up the agent
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
