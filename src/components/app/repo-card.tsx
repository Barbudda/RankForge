import Link from "next/link";
import { GitPullRequest, AlertCircle, FileText, ArrowUpRight } from "lucide-react";
import type { Repository } from "@/types";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { FrameworkBadge } from "@/components/ui/misc";
import { GithubIcon } from "@/components/brand/github-icon";
import { timeAgo } from "@/lib/utils";

export function RepoCard({ repo }: { repo: Repository }) {
  return (
    <Link href={`/repositories/${repo.id}`} className="group block">
      <Card className="h-full p-5 transition-colors group-hover:border-electric/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-fg-subtle">
              <GithubIcon className="size-4" />
              <span className="truncate text-xs">{repo.owner}/</span>
            </div>
            <h3 className="mt-0.5 flex items-center gap-1.5 truncate text-base font-semibold text-fg">
              {repo.name}
              <ArrowUpRight className="size-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <FrameworkBadge framework={repo.framework} />
              <span className="text-xs text-fg-subtle">
                {repo.lastAuditAt
                  ? `Audited ${timeAgo(repo.lastAuditAt)}`
                  : "Never audited"}
              </span>
            </div>
          </div>
          <ScoreRing score={repo.score} size={64} stroke={6} showGrade={false} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-sm">
          <Stat icon={<FileText className="size-3.5" />} value={repo.pages} label="pages" />
          <Stat
            icon={<AlertCircle className="size-3.5" />}
            value={repo.openIssues}
            label="issues"
          />
          <Stat
            icon={<GitPullRequest className="size-3.5" />}
            value={repo.openPullRequests}
            label="PRs"
          />
        </div>
      </Card>
    </Link>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex items-center gap-1 text-fg-subtle">{icon}</span>
      <span className="font-semibold tabular-nums text-fg">{value}</span>
      <span className="text-[11px] text-fg-subtle">{label}</span>
    </div>
  );
}
