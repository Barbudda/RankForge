import Link from "next/link";
import { GitPullRequest } from "lucide-react";
import type { PullRequest, PullRequestStatus } from "@/types";
import { PrStatusBadge } from "./issue-status-badge";
import { timeAgo } from "@/lib/utils";

/** Status → icon color. Signal green is reserved for merged (validated). */
export const PR_ICON_COLOR: Record<PullRequestStatus, string> = {
  merged: "text-violet",
  open: "text-electric-bright",
  closed: "text-danger",
  draft: "text-fg-subtle",
  simulated: "text-cyan",
};

export function PrRow({
  pr,
  repoName,
}: {
  pr: PullRequest;
  repoName?: string;
}) {
  return (
    <Link
      href={`/pull-requests/${pr.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface/60"
    >
      <GitPullRequest
        className={`size-4.5 shrink-0 ${PR_ICON_COLOR[pr.status] ?? "text-fg-subtle"}`}
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-fg">{pr.title}</h4>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
          {pr.number > 0 && <span className="font-mono">#{pr.number}</span>}
          {repoName && <span>{repoName}</span>}
          <span className="font-mono text-electric-bright/80">{pr.branchName}</span>
          <span>· {timeAgo(pr.createdAt)}</span>
        </div>
      </div>
      <div className="hidden items-center gap-2 font-mono text-xs sm:flex">
        <span className="text-signal">+{pr.additions}</span>
        <span className="text-danger">−{pr.deletions}</span>
      </div>
      <PrStatusBadge status={pr.status} />
    </Link>
  );
}
