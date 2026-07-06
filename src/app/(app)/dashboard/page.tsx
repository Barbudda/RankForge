import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, AlertCircle, GitPullRequest, TrendingUp, Play, ArrowRight, Plus, Terminal } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { ScoreChart } from "@/components/app/score-chart";
import { RepoCard } from "@/components/app/repo-card";
import { IssueRow } from "@/components/app/issue-row";
import { BrainCard } from "@/components/app/brain-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { GithubIcon } from "@/components/brand/github-icon";
import { UseInEditorButton } from "@/components/app/use-in-editor";
import {
  getDashboardStats,
  getTopOpportunities,
  getScoreTrend,
  getRepositories,
} from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, opportunities, trend, repositories] = await Promise.all([
    getDashboardStats(),
    getTopOpportunities(5),
    getScoreTrend(),
    getRepositories(),
  ]);
  const repoName = Object.fromEntries(repositories.map((r) => [r.id, r.name]));
  const empty = repositories.length === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your workspace at a glance — scores, issues and the pull requests RankForge has opened."
        actions={
          !empty && (
            <Button href="/repositories" size="md">
              <Play className="size-4" />
              Run new audit
            </Button>
          )
        }
      />

      {/* Discoverable: the RankForge agent in your editor (no repo needed). */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-electric/25 bg-electric/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-electric/30 bg-electric/[0.08]">
            <Terminal className="size-4 text-electric-bright" />
          </span>
          <div>
            <p className="text-sm font-medium text-fg">
              Prefer to work in your editor?
            </p>
            <p className="text-[13px] text-fg-muted">
              Connect the RankForge agent to Claude Code, Cursor or VS Code — it
              audits your dev server and fixes issues in your repo. No setup, no
              GitHub App needed.
            </p>
          </div>
        </div>
        <UseInEditorButton className="shrink-0" />
      </div>

      {empty ? (
        <Card className="overflow-hidden">
          <div className="relative p-8 md:p-12">
            <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
            <div className="relative max-w-xl">
              <span className="grid size-12 place-items-center rounded-xl border border-border bg-surface">
                <GithubIcon className="size-6 text-fg" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-fg">
                Connect your first repository
              </h2>
              <p className="mt-2 text-fg-muted">
                Add a repository name and its production URL, then run your first
                audit. You&apos;ll see scores, prioritized issues and the fixes
                RankForge prepares — right here.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/repositories" size="md">
                  <Plus className="size-4" />
                  Connect a repository
                </Button>
                <Button href="/#how-it-works" variant="secondary" size="md">
                  How it works
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Global SEO score"
              value={stats.globalScore}
              delta={stats.scoreDelta}
              hint="Page-weighted across repos"
              icon={<Gauge className="size-4" />}
            />
            <StatCard
              label="Open issues"
              value={stats.openIssues}
              hint={`Across ${stats.repositories} repositories`}
              icon={<AlertCircle className="size-4" />}
            />
            <StatCard
              label="Pull requests"
              value={stats.prsCreated}
              hint="Created by RankForge"
              icon={<GitPullRequest className="size-4" />}
            />
            <StatCard
              label="Impact fixed"
              value={stats.impactFixed}
              hint="Impact points from merged PRs"
              icon={<TrendingUp className="size-4" />}
            />
          </div>

          {/* Trend + opportunities */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Score trend</CardTitle>
                <CardDescription>
                  Page-weighted SEO score over the last two months.
                </CardDescription>
              </CardHeader>
              <div className="px-5 pb-5">
                {trend.length > 0 ? (
                  <ScoreChart data={trend} />
                ) : (
                  <p className="py-8 text-center text-sm text-fg-subtle">
                    Not enough audits yet to chart a trend.
                  </p>
                )}
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Top opportunities</CardTitle>
                <CardDescription>Highest-confidence fixes ready to ship.</CardDescription>
              </CardHeader>
              <div className="flex-1 divide-y divide-border border-t border-border">
                {opportunities.length > 0 ? (
                  opportunities.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      showRepo
                      repoName={repoName[issue.repoId]}
                    />
                  ))
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-fg-subtle">
                    No open opportunities — nice and clean.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Repositories */}
          <div className="mt-10">
            <SectionHeading
              title="Repositories"
              description="Connected repos and their latest scores."
              action={
                <Link
                  href="/repositories"
                  className="flex items-center gap-1 text-sm text-electric-bright hover:underline"
                >
                  View all
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {repositories.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Brain — RankForge's semantic memory */}
      <div className="mt-6">
        <BrainCard />
      </div>
    </>
  );
}
