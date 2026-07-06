import { GitPullRequest, Check, FileCode2, ShieldAlert, GitBranch } from "lucide-react";
import type { PullRequest, Repository } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DiffView } from "@/components/ui/diff-view";
import { RiskBadge } from "@/components/ui/badge";
import { PrStatusBadge } from "./issue-status-badge";
import { PR_ICON_COLOR } from "./pr-row";
import { PrActionBar } from "./pr-action-bar";
import { MetaItem } from "@/components/ui/misc";

/** Full GitHub-style pull-request preview shared by real and simulated PRs. */
export function PrPreview({
  pr,
  repo,
  issueId,
}: {
  pr: PullRequest;
  repo?: Repository | null;
  /** When set, the action bar persists a real PR for this issue on click. */
  issueId?: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main */}
      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-5">
            <GitPullRequest
              className={`size-5 ${PR_ICON_COLOR[pr.status] ?? "text-fg-subtle"}`}
            />
            <h2 className="flex-1 text-base font-semibold text-fg">{pr.title}</h2>
            <PrStatusBadge status={pr.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1 font-mono text-electric-bright">
              <GitBranch className="size-3.5" />
              {pr.branchName}
            </span>
            <span className="text-fg-subtle">→ {pr.baseBranch}</span>
            <span className="ml-auto font-mono">
              <span className="text-signal">+{pr.additions}</span>{" "}
              <span className="text-danger">−{pr.deletions}</span>
            </span>
          </div>
          <div className="px-5 pb-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {pr.description}
            </p>
          </div>
        </Card>

        {/* Files changed */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
            <FileCode2 className="size-4 text-fg-subtle" />
            Files changed ({pr.files.length})
          </h3>
          <div className="space-y-4">
            {pr.files.map((file) => (
              <div key={file.path}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-fg-muted">{file.path}</span>
                  <span className="font-mono">
                    <span className="text-signal">+{file.additions}</span>{" "}
                    <span className="text-danger">−{file.deletions}</span>
                  </span>
                </div>
                <DiffView diff={file.diff} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card className="p-5">
          <PrActionBar status={pr.status} url={pr.url} issueId={issueId} />
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <div className="space-y-4 px-5 pb-5">
            {repo && (
              <MetaItem label="Repository">{repo.fullName}</MetaItem>
            )}
            <MetaItem label="Risk">
              <RiskBadge risk={pr.risk} />
            </MetaItem>
            <MetaItem label="Expected impact">
              <span className="text-fg-muted">{pr.expectedImpact}</span>
            </MetaItem>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Review checklist</CardTitle>
          </CardHeader>
          <ul className="space-y-2.5 px-5 pb-5">
            {pr.checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                    item.done ? "bg-signal/15" : "border border-border"
                  }`}
                >
                  {item.done && <Check className="size-2.5 text-signal" />}
                </span>
                <span className={item.done ? "text-fg-muted" : "text-fg"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface/40 p-4 text-xs text-fg-subtle">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber" />
          RankForge never commits to your default branch. Every change is a PR
          you review and merge.
        </div>
      </div>
    </div>
  );
}
