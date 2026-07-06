import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, FileText, GitBranch, CheckCircle2, XCircle, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { Button } from "@/components/ui/button";
import { FrameworkBadge, MetaItem, SectionHeading, EmptyState } from "@/components/ui/misc";
import { CategoryScores } from "@/components/app/category-scores";
import { IssueRow } from "@/components/app/issue-row";
import { PrRow } from "@/components/app/pr-row";
import { RepoAutonomyControl } from "@/components/app/repo-autonomy-control";
import { RunAuditButton } from "@/components/app/run-audit-button";
import { GithubIcon } from "@/components/brand/github-icon";
import {
  getRepository,
  getLatestAudit,
  getAuditsForRepo,
  getIssuesForRepo,
  getPullRequestsForRepo,
} from "@/lib/data";
import { sortByPriority } from "@/lib/scoring";
import { formatDate, timeAgo } from "@/lib/utils";

// The "Run audit" server action fires from this page; give the crawl headroom
// on serverless (the crawl budget stays comfortably under this).
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const repo = await getRepository(id);
  return { title: repo ? repo.name : "Repository" };
}

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = await getRepository(id);
  if (!repo) notFound();

  const [latest, audits, allIssues, prs] = await Promise.all([
    getLatestAudit(repo.id),
    getAuditsForRepo(repo.id),
    getIssuesForRepo(repo.id),
    getPullRequestsForRepo(repo.id),
  ]);
  // Only actionable issues belong under "fixes to ship".
  const issues = sortByPriority(
    allIssues.filter((i) => i.status === "open" || i.status === "pr_open"),
  ).slice(0, 5);
  // Belt-and-braces: only ever link out to http(s) URLs (also validated at write time).
  const safeSiteUrl = /^https?:\/\//i.test(repo.productionUrl)
    ? repo.productionUrl
    : null;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Repositories", href: "/repositories" },
          { label: repo.name },
        ]}
        title={repo.fullName}
        description={`Connected ${timeAgo(repo.connectedAt)} · default branch ${repo.defaultBranch}`}
        actions={
          <>
            {safeSiteUrl && (
              <Button href={safeSiteUrl} variant="secondary" size="md">
                <ExternalLink className="size-4" />
                Visit site
              </Button>
            )}
            <RunAuditButton repoId={repo.id} />
          </>
        }
      />

      {/* Overview */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="flex items-center gap-5 p-6">
          <ScoreRing score={repo.score} size={104} />
          <div className="space-y-3">
            <MetaItem label="Framework">
              <FrameworkBadge framework={repo.framework} />
            </MetaItem>
            <MetaItem label="Production URL">
              {safeSiteUrl ? (
                <a
                  href={safeSiteUrl}
                  className="inline-flex items-center gap-1 text-electric-bright hover:underline"
                >
                  {safeSiteUrl.replace("https://", "")}
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="text-fg-muted">{repo.productionUrl}</span>
              )}
            </MetaItem>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Pages", value: repo.pages, icon: <FileText className="size-4" /> },
            { label: "Open issues", value: repo.openIssues, icon: <ScanSearch className="size-4" /> },
            { label: "Open PRs", value: repo.openPullRequests, icon: <GitBranch className="size-4" /> },
            { label: "Detection", value: `${repo.detectionConfidence}%`, icon: <CheckCircle2 className="size-4" /> },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <span className="text-fg-subtle">{s.icon}</span>
              <div className="mt-3 text-2xl font-semibold tabular-nums text-fg">
                {s.value}
              </div>
              <div className="text-xs text-fg-subtle">{s.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Category breakdown + framework signals */}
      {latest && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Category breakdown</CardTitle>
              <CardDescription>
                From the latest audit · {formatDate(latest.createdAt)}
              </CardDescription>
            </CardHeader>
            <div className="px-5 pb-5">
              <CategoryScores categories={latest.categories} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Framework signals</CardTitle>
              <CardDescription>
                What RankForge detected in your {repo.framework} setup.
              </CardDescription>
            </CardHeader>
            <div className="space-y-3 px-5 pb-5">
              {latest.frameworkSignals.map((sig) => (
                <div key={sig.label} className="flex items-start gap-3">
                  {sig.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-amber" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-fg">{sig.label}</div>
                    <div className="text-xs text-fg-subtle">{sig.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modification level (per-repo autonomy) */}
      <div className="mt-6">
        <RepoAutonomyControl
          repoId={repo.id}
          repoName={repo.name}
          initial={repo.agentLevel}
        />
      </div>

      {/* Top issues */}
      <div className="mt-10">
        <SectionHeading
          title="Top issues"
          description="Highest-priority fixes for this repository."
          action={
            latest && (
              <Link
                href={`/audits/${latest.id}`}
                className="text-sm text-electric-bright hover:underline"
              >
                View full audit
              </Link>
            )
          }
        />
        {issues.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
            <div className="divide-y divide-border">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<ScanSearch className="size-7" />}
            title="No open issues"
            description={
              latest
                ? "Everything detected has been handled. Re-run an audit to check again."
                : "Run the first audit to detect issues on this site."
            }
          />
        )}
      </div>

      {/* Audits + PRs */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading title="Audits" />
          <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
            <div className="divide-y divide-border">
              {audits.map((a) => (
                <Link
                  key={a.id}
                  href={`/audits/${a.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface/60"
                >
                  <div>
                    <div className="text-sm font-medium text-fg">
                      Audit · {formatDate(a.createdAt)}
                    </div>
                    <div className="text-xs text-fg-subtle">
                      {a.crawl.pagesScanned} pages · {a.totalIssues} issues ·{" "}
                      {a.crawl.renderMode}
                    </div>
                  </div>
                  <span className="font-mono text-lg font-semibold tabular-nums text-fg">
                    {a.score}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionHeading title="Pull requests" />
          {prs.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
              <div className="divide-y divide-border">
                {prs.map((pr) => (
                  <PrRow key={pr.id} pr={pr} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<GithubIcon className="size-7" />}
              title="No pull requests yet"
              description="Open an issue's fix to generate the first PR."
            />
          )}
        </div>
      </div>
    </>
  );
}
