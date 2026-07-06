"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { SeoCategory, SeoIssue, Severity } from "@/types";
import { IssueRow } from "./issue-row";
import { CATEGORY_META } from "@/lib/seo/constants";
import { sortByPriority } from "@/lib/scoring";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const IMPACTS: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];

export function IssuesTable({
  issues,
  repoNameById,
  showRepo = false,
}: {
  issues: SeoIssue[];
  repoNameById?: Record<string, string>;
  showRepo?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SeoCategory | "all">("all");
  const [impact, setImpact] = useState<Severity | "all">("all");
  const [autoFixOnly, setAutoFixOnly] = useState(false);

  const categories = useMemo(() => {
    const present = new Set(issues.map((i) => i.category));
    return (Object.keys(CATEGORY_META) as SeoCategory[]).filter((c) =>
      present.has(c),
    );
  }, [issues]);

  const filtered = useMemo(() => {
    const result = issues.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (impact !== "all" && i.impact !== impact) return false;
      if (autoFixOnly && !i.canAutoFix) return false;
      if (query && !i.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
    return sortByPriority(result);
  }, [issues, category, impact, autoFixOnly, query]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 transition-colors focus-within:border-electric">
          <Search className="size-4 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues…"
            aria-label="Search issues"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SeoCategory | "all")}
            aria-label="Filter by category"
            className="h-10 rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg outline-none focus-visible:border-electric focus-visible:ring-2 focus-visible:ring-electric/30"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/60 p-1">
            {IMPACTS.map((im) => (
              <button
                key={im}
                onClick={() => setImpact(im)}
                aria-pressed={impact === im}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                  impact === im
                    ? "bg-electric/15 text-electric-bright"
                    : "text-fg-subtle hover:text-fg",
                )}
              >
                {im}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoFixOnly((v) => !v)}
            aria-pressed={autoFixOnly}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
              autoFixOnly
                ? "border-cyan/40 bg-cyan/10 text-cyan"
                : "border-border bg-surface/60 text-fg-muted hover:text-fg",
            )}
          >
            <SlidersHorizontal className="size-4" />
            Auto-fixable
          </button>
        </div>
      </div>

      <div className="text-xs text-fg-subtle">
        Showing {filtered.length} of {issues.length} issues, sorted by priority.
      </div>

      {/* List */}
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface/40">
        {filtered.length === 0 ? (
          <EmptyState
            title="No issues match your filters"
            description="Try clearing the search or selecting a different category."
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                showRepo={showRepo}
                repoName={repoNameById?.[issue.repoId]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
