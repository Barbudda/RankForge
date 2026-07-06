import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Wand2,
  FileCode2,
  ListChecks,
  Undo2,
  ExternalLink,
  ArrowRight,
  GitPullRequest,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DiffView } from "@/components/ui/diff-view";
import {
  SeverityBadge,
  EffortBadge,
  RiskBadge,
  Badge,
} from "@/components/ui/badge";
import { CategoryBadge, MetaItem, Progress } from "@/components/ui/misc";
import { IssueStatusBadge } from "@/components/app/issue-status-badge";
import { GenerateFixButton } from "@/components/app/generate-fix-button";
import {
  getIssue,
  getRepository,
  getPullRequestForIssue,
} from "@/lib/data";
import { priorityScore } from "@/lib/scoring";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  return { title: issue ? issue.title : "Issue" };
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) notFound();
  const [repo, existingPr] = await Promise.all([
    getRepository(issue.repoId),
    getPullRequestForIssue(issue.id),
  ]);
  const fix = issue.suggestedFix;

  const prHref = existingPr
    ? `/pull-requests/${existingPr.id}`
    : `/issues/${issue.id}/pr`;
  const hasFix = Boolean(issue.suggestedFix.diff.trim());

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Repositories", href: "/repositories" },
          repo
            ? { label: repo.name, href: `/repositories/${repo.id}` }
            : { label: "Repository" },
          { label: "Issue" },
        ]}
        title={issue.title}
        actions={
          existingPr || hasFix ? (
            <Link
              href={prHref}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
            >
              <GitPullRequest className="size-4" />
              {existingPr ? "View pull request" : "Create PR"}
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span
              title="Generate a fix below first"
              className="inline-flex h-10 cursor-default items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-fg-subtle"
            >
              <GitPullRequest className="size-4" />
              Create PR
            </span>
          )
        }
      />

      {/* Badge strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SeverityBadge impact={issue.impact} />
        <EffortBadge effort={issue.effort} />
        <RiskBadge risk={issue.risk} />
        <CategoryBadge category={issue.category} />
        <IssueStatusBadge status={issue.status} />
        {issue.canAutoFix && (
          <Badge tone="cyan">
            <Wand2 className="size-3" />
            Auto-fixable
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="space-y-6">
          <Section title="Problem">
            <p className="text-sm leading-relaxed text-fg-muted">
              {issue.description}
            </p>
          </Section>

          <Section title="Evidence">
            <div className="rounded-lg border border-border bg-code p-4 font-mono text-xs leading-relaxed text-fg-muted">
              {issue.evidence}
            </div>
          </Section>

          <Section title={`Affected URLs (${issue.affectedUrls.length})`}>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {issue.affectedUrls.map((u) => (
                <li
                  key={u.url}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <ExternalLink className="size-3.5 shrink-0 text-fg-subtle" />
                  <a
                    href={u.url}
                    className="truncate font-mono text-xs text-electric-bright hover:underline"
                  >
                    {u.url}
                  </a>
                  {u.note && (
                    <span className="ml-auto shrink-0 text-xs text-amber">
                      {u.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          {/* Suggested fix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="size-4 text-cyan" />
                Suggested fix
              </CardTitle>
            </CardHeader>
            <div className="space-y-5 px-5 pb-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-relaxed text-fg-muted">
                  {fix.summary || "No fix generated yet."}
                </p>
                <GenerateFixButton
                  issueId={issue.id}
                  hasFix={Boolean(fix.diff)}
                />
              </div>

              {fix.diff && <DiffView diff={fix.diff} />}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg">
                    <ListChecks className="size-4 text-signal" />
                    Validation steps
                  </h4>
                  <ol className="list-inside list-decimal space-y-1.5 text-sm text-fg-muted">
                    {fix.validationSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg">
                    <Undo2 className="size-4 text-amber" />
                    Rollback
                  </h4>
                  <p className="text-sm text-fg-muted">{fix.rollbackNotes}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Scoring</CardTitle>
            </CardHeader>
            <div className="space-y-4 px-5 pb-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Priority</span>
                  <span className="font-mono font-semibold text-fg">
                    {priorityScore(issue)}/100
                  </span>
                </div>
                <Progress value={priorityScore(issue)} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Confidence</span>
                  <span className="font-mono font-semibold text-fg">
                    {issue.confidence}%
                  </span>
                </div>
                <Progress value={issue.confidence} color="var(--color-cyan)" />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                <MetaItem label="Impact">
                  <span className="capitalize">{issue.impact}</span>
                </MetaItem>
                <MetaItem label="Effort">
                  <span className="capitalize">{issue.effort}</span>
                </MetaItem>
                <MetaItem label="Risk">
                  <span className="capitalize">{issue.risk}</span>
                </MetaItem>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode2 className="size-4 text-fg-subtle" />
                Files likely affected
              </CardTitle>
            </CardHeader>
            <div className="space-y-3 px-5 pb-5">
              {issue.files.map((f) => (
                <div key={f.path}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-fg">
                      {f.path}
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {f.confidence}%
                    </span>
                  </div>
                  <Progress value={f.confidence} color="var(--color-violet)" />
                  <p className="mt-1 text-xs text-fg-subtle">{f.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          <Link
            href={prHref}
            className="flex items-center justify-between rounded-xl border border-electric/40 bg-electric/[0.07] p-4 transition-colors hover:bg-electric/10"
          >
            <div>
              <div className="text-sm font-medium text-fg">
                {existingPr ? "View pull request" : "Generate pull request"}
              </div>
              <div className="text-xs text-fg-subtle">
                {existingPr
                  ? `#${existingPr.number || "draft"} · ${existingPr.status}`
                  : "Preview the diff & checklist"}
              </div>
            </div>
            <ArrowRight className="size-4 text-electric-bright" />
          </Link>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}
