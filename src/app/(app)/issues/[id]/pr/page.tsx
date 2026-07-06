import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { PrPreview } from "@/components/app/pr-preview";
import { getIssue, getPullRequestForIssue, getRepository } from "@/lib/data";
import { buildPrFromIssue } from "@/lib/data/pr-builder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id);
  return { title: issue ? `PR preview · ${issue.title}` : "PR preview" };
}

/**
 * Builds a "would-be" pull request from an issue's suggested fix and renders
 * it in the standard preview. Requires a generated fix; once the PR exists
 * for real, this page forwards to it.
 */
export default async function IssuePrPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) notFound();

  // No generated fix yet → nothing to preview; back to the issue.
  if (!issue.suggestedFix.diff.trim()) {
    redirect(`/issues/${issue.id}?notice=generate-fix-first`);
  }

  // Already created → show the real PR instead of a stale preview.
  const existing = await getPullRequestForIssue(issue.id);
  if (existing) redirect(`/pull-requests/${existing.id}`);

  const repo = await getRepository(issue.repoId);
  const pr = buildPrFromIssue(issue, repo, `preview_${issue.id}`);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Repositories", href: "/repositories" },
          repo
            ? { label: repo.name, href: `/repositories/${repo.id}` }
            : { label: "Repository" },
          { label: "Issue", href: `/issues/${issue.id}` },
          { label: "PR preview" },
        ]}
        title={pr.title}
        description="Simulated pull request — review the diff, then create it for real."
      />
      <PrPreview pr={pr} repo={repo} issueId={issue.id} />
    </>
  );
}
