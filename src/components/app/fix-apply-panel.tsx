"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wand2,
  Check,
  Loader2,
  FileCode2,
  ChevronRight,
  ShieldCheck,
  GitPullRequest,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import type { SeoIssue } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DiffView } from "@/components/ui/diff-view";
import { SeverityBadge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/misc";
import { prepareFixes, openPullRequests, type PrepareReport } from "@/lib/data/actions";
import { cn } from "@/lib/utils";

/**
 * The "apply fixes → review the changes" experience shown after an audit.
 *
 * 1) The user sees which issues can be fixed automatically (deterministic, no
 *    AI) and ticks the ones to apply. A plain-language line says what each one
 *    changes and which file it touches.
 * 2) "Prepare fixes" runs instantly (no key/LLM) and produces a change report
 *    grouped by file — the actual diff for every change, so nothing is a
 *    black box.
 * 3) "Open pull request" bundles the reviewed changes (still branch-scoped —
 *    nothing merges without the user).
 */

/**
 * The change report itself — the "rapport des modifs": every prepared change
 * grouped by the file it touches, with the actual diff and how to verify it.
 * Presentational, so it can be rendered anywhere.
 */
export function FixChangeReport({ report }: { report: PrepareReport }) {
  const totalChanges = report.files.reduce((n, f) => n + f.changes.length, 0);
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md border border-signal/30 bg-signal/10">
          <Check className="size-4 text-signal" />
        </span>
        <h3 className="text-sm font-semibold text-fg">
          {totalChanges} change{totalChanges > 1 ? "s" : ""} prepared across{" "}
          {report.files.length} file{report.files.length > 1 ? "s" : ""}
        </h3>
      </div>

      <div className="space-y-4">
        {report.files.map((file) => (
          <div key={file.path} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-surface/70 px-4 py-2.5">
              <FileCode2 className="size-4 text-electric-bright" />
              <span className="font-mono text-xs text-fg">{file.path}</span>
              <span className="ml-auto text-[11px] text-fg-subtle">
                {file.changes.length} change{file.changes.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-border">
              {file.changes.map((c) => (
                <div key={c.issueId} className="p-4">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{c.summary}</p>
                      <DiffView diff={c.diff} className="mt-3" />
                      {c.validationSteps.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                            <ListChecks className="size-3.5 text-signal" />
                            How to verify
                          </p>
                          <ol className="list-inside list-decimal space-y-0.5 text-xs text-fg-subtle">
                            {c.validationSteps.slice(0, 3).map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {report.skipped.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-surface/40 p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
            <AlertTriangle className="size-3.5 text-amber" />
            {report.skipped.length} issue{report.skipped.length > 1 ? "s" : ""} need a reviewed fix
          </p>
          <ul className="mt-2 space-y-1 text-xs text-fg-subtle">
            {report.skipped.slice(0, 5).map((s) => (
              <li key={s.issueId}>
                <Link href={`/issues/${s.issueId}`} className="text-electric-bright hover:underline">
                  {s.title}
                </Link>{" "}
                — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Short human "what changes" line derived from the rule id. */
function whatChanges(issue: SeoIssue): string {
  const rule = issue.id.match(/:([a-z0-9-]+)$/i)?.[1] ?? "";
  const file = issue.files[0]?.path;
  const map: Record<string, string> = {
    "framework-robots-missing": "Adds a robots file that allows crawling and points to your sitemap",
    "framework-robots-no-sitemap": "Adds the Sitemap directive to robots",
    "framework-sitemap-missing": "Adds a sitemap listing your public URLs",
    "perf-viewport-missing": "Adds the responsive viewport so pages work on mobile",
    "indexing-html-lang-missing": "Sets the page language on <html>",
    "indexing-canonical-missing": "Adds canonical URLs so pages self-reference",
    "schema-missing": "Adds WebSite structured data (JSON-LD)",
    "schema-website-missing": "Adds Organization/WebSite structured data",
    "meta-og-image-missing": "Adds a social share image (OpenGraph)",
  };
  const base = map[rule] || issue.suggestedFix.summary || "Applies a reviewed fix";
  return file ? `${base} — ${file}` : base;
}

export function FixApplyPanel({ fixable }: { fixable: SeoIssue[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(fixable.map((i) => i.id)),
  );
  const [preparing, setPreparing] = useState(false);
  const [report, setReport] = useState<PrepareReport | null>(null);
  const [opening, setOpening] = useState(false);
  const [prResult, setPrResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allSelected = selected.size === fixable.length && fixable.length > 0;

  if (fixable.length === 0) return null;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const prepare = async () => {
    setPreparing(true);
    setError(null);
    setReport(null);
    setPrResult(null);
    try {
      const res = await prepareFixes([...selected]);
      if (!res.ok && res.files.length === 0) {
        setError(res.error ?? "Could not prepare the fixes.");
        return;
      }
      setReport(res);
      router.refresh();
    } catch {
      setError("Could not prepare the fixes — please try again.");
    } finally {
      setPreparing(false);
    }
  };

  const openPr = async () => {
    if (!report) return;
    setOpening(true);
    setError(null);
    try {
      const res = await openPullRequests(report.preparedIssueIds);
      if (res.ok) {
        setPrResult(`${res.created} pull request${res.created > 1 ? "s" : ""} prepared for review.`);
        router.refresh();
      } else {
        setError(res.error ?? "Could not open the pull requests.");
      }
    } catch {
      setError("Could not open the pull requests — please try again.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-signal/30 bg-signal/[0.07]">
            <Wand2 className="size-4 text-signal" />
          </span>
          <div>
            <CardTitle>Fix it — instantly, and see exactly what changes</CardTitle>
            <CardDescription>
              {fixable.length} issue{fixable.length > 1 ? "s" : ""} can be fixed
              automatically. Pick what to apply, review the diff, then open a
              pull request. No AI required — nothing merges without you.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Selection list */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <button
            type="button"
            onClick={() =>
              setSelected(allSelected ? new Set() : new Set(fixable.map((i) => i.id)))
            }
            className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted hover:text-fg"
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded border",
                allSelected ? "border-signal bg-signal/20 text-signal" : "border-border",
              )}
            >
              {allSelected && <Check className="size-3" />}
            </span>
            {allSelected ? "Deselect all" : "Select all safe fixes"}
          </button>
          <span className="text-xs text-fg-subtle">{selected.size} selected</span>
        </div>

        <ul className="divide-y divide-border">
          {fixable.map((issue) => {
            const checked = selected.has(issue.id);
            return (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => toggle(issue.id)}
                  className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface/50"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                      checked ? "border-signal bg-signal/20 text-signal" : "border-border",
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-fg">{issue.title}</span>
                      <SeverityBadge impact={issue.impact} />
                      <CategoryBadge category={issue.category} />
                    </span>
                    <span className="mt-1 block text-xs text-fg-subtle">
                      {whatChanges(issue)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
            <ShieldCheck className="size-3.5 text-signal" />
            Applied to a RankForge branch as a pull request — never your main branch.
          </span>
          <button
            type="button"
            onClick={prepare}
            disabled={preparing || selected.size === 0}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
          >
            {preparing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {preparing ? "Preparing…" : `Prepare ${selected.size} fix${selected.size > 1 ? "es" : ""}`}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mx-5 mb-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Change report */}
      {report && report.files.length > 0 && (
        <div className="border-t border-border bg-surface/30 p-5">
          <FixChangeReport report={report} />

          {/* Open PR CTA */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {prResult ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-signal">
                <Check className="size-4" />
                {prResult}
              </span>
            ) : (
              <span className="text-xs text-fg-subtle">
                Reviewed the changes? Bundle them into pull requests to review.
                (Connect GitHub to open them for real.)
              </span>
            )}
            {prResult ? (
              <Link
                href="/pull-requests"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-fg transition-colors hover:border-electric/50"
              >
                <GitPullRequest className="size-4" />
                View pull requests
              </Link>
            ) : (
              <button
                type="button"
                onClick={openPr}
                disabled={opening}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
              >
                {opening ? <Loader2 className="size-4 animate-spin" /> : <GitPullRequest className="size-4" />}
                {opening
                  ? "Opening…"
                  : `Open pull request${report.preparedIssueIds.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
