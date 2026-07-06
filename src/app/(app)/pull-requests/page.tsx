import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PrRow } from "@/components/app/pr-row";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/ui/misc";
import { GitPullRequest, GitMerge, FileEdit } from "lucide-react";
import { getPullRequests, getRepositories } from "@/lib/data";

export const metadata: Metadata = { title: "Pull requests" };

export default async function PullRequestsPage() {
  const [allPrs, repositories] = await Promise.all([
    getPullRequests(),
    getRepositories(),
  ]);
  const repoName = Object.fromEntries(repositories.map((r) => [r.id, r.name]));
  const prs = [...allPrs].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const open = prs.filter((p) => p.status === "open" || p.status === "draft").length;
  const merged = prs.filter((p) => p.status === "merged").length;
  const simulated = prs.filter((p) => p.status === "simulated").length;

  return (
    <>
      <PageHeader
        title="Pull requests"
        description="Every fix RankForge has generated across your workspace."
      />

      {prs.length === 0 ? (
        <EmptyState
          icon={<GitPullRequest className="size-7" />}
          title="No pull requests yet"
          description="Run an audit and open a fix to generate your first pull request."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatCard label="Open" value={open} icon={<GitPullRequest className="size-4" />} />
            <StatCard label="Merged" value={merged} icon={<GitMerge className="size-4" />} />
            <StatCard label="Simulated" value={simulated} icon={<FileEdit className="size-4" />} />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
            <div className="divide-y divide-border">
              {prs.map((pr) => (
                <PrRow key={pr.id} pr={pr} repoName={repoName[pr.repoId]} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
