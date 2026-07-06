import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RepoCard } from "@/components/app/repo-card";
import { Card } from "@/components/ui/card";
import { GithubIcon } from "@/components/brand/github-icon";
import { ConnectRepoButton } from "@/components/app/connect-repo-dialog";
import { getRepositories } from "@/lib/data";

export const metadata: Metadata = { title: "Repositories" };

export default async function RepositoriesPage() {
  const repositories = await getRepositories();

  return (
    <>
      <PageHeader
        title="Repositories"
        description="Connect a GitHub repository and a production URL to start auditing."
        actions={
          <ConnectRepoButton className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright">
            <Plus className="size-4" />
            Connect repo
          </ConnectRepoButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}

        {/* Connect new repo card */}
        <Card
          id="connect"
          className="flex flex-col items-center justify-center border-dashed p-8 text-center"
        >
          <span className="grid size-12 place-items-center rounded-xl border border-border bg-surface">
            <GithubIcon className="size-6 text-fg-muted" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-fg">
            Connect a repository
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-fg-muted">
            Add a repository and its production URL to start auditing. Read-only
            by default.
          </p>
          <ConnectRepoButton className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-fg transition-colors hover:border-electric/50 hover:bg-surface">
            <Plus className="size-4" />
            Add repository
          </ConnectRepoButton>
          <p className="mt-3 text-[11px] text-fg-subtle">
            Minimal permissions · disable anytime.
          </p>
        </Card>
      </div>

      {/* Table view */}
      {repositories.length > 0 && (
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">All repositories</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/70 text-left text-xs uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="p-4 font-medium">Repository</th>
                <th className="p-4 font-medium">Framework</th>
                <th className="hidden p-4 font-medium md:table-cell">Pages</th>
                <th className="p-4 font-medium">Score</th>
                <th className="hidden p-4 font-medium sm:table-cell">Issues</th>
                <th className="hidden p-4 font-medium sm:table-cell">PRs</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => (
                <tr
                  key={repo.id}
                  className="border-t border-border transition-colors hover:bg-surface/50"
                >
                  <td className="p-4">
                    <Link
                      href={`/repositories/${repo.id}`}
                      className="font-medium text-fg hover:text-electric-bright"
                    >
                      {repo.fullName}
                    </Link>
                  </td>
                  <td className="p-4 capitalize text-fg-muted">
                    {repo.framework.replace("-", " ")}
                  </td>
                  <td className="hidden p-4 tabular-nums text-fg-muted md:table-cell">
                    {repo.pages}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold tabular-nums text-fg">
                      {repo.score}
                    </span>
                    <span className="ml-1 text-xs text-signal">
                      +{repo.scoreDelta}
                    </span>
                  </td>
                  <td className="hidden p-4 tabular-nums text-fg-muted sm:table-cell">
                    {repo.openIssues}
                  </td>
                  <td className="hidden p-4 tabular-nums text-fg-muted sm:table-cell">
                    {repo.openPullRequests}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </>
  );
}
