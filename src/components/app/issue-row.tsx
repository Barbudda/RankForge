import Link from "next/link";
import { ChevronRight, Gauge, Wand2 } from "lucide-react";
import type { SeoIssue } from "@/types";
import { SeverityBadge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/misc";
import { priorityScore } from "@/lib/scoring";
import { IssueStatusBadge } from "./issue-status-badge";

export function IssueRow({
  issue,
  showRepo,
  repoName,
}: {
  issue: SeoIssue;
  showRepo?: boolean;
  repoName?: string;
}) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface/60"
    >
      {/* Priority gauge */}
      <div className="hidden w-12 shrink-0 text-center sm:block">
        <div className="font-mono text-sm font-semibold tabular-nums text-fg">
          {priorityScore(issue)}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-fg-subtle">
          prio
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium text-fg">{issue.title}</h4>
          {issue.canAutoFix && (
            <span title="Auto-fixable">
              <Wand2 className="size-3.5 shrink-0 text-cyan" />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <CategoryBadge category={issue.category} />
          {showRepo && repoName && (
            <span className="text-xs text-fg-subtle">{repoName}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-fg-subtle">
            <Gauge className="size-3" />
            {issue.confidence}% confidence
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <SeverityBadge impact={issue.impact} />
        <IssueStatusBadge status={issue.status} />
      </div>

      <ChevronRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
