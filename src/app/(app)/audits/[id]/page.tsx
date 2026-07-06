import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FileSearch,
  AlertTriangle,
  Timer,
  Link2Off,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { RunAuditButton } from "@/components/app/run-audit-button";
import { CategoryScores } from "@/components/app/category-scores";
import { IssuesTable } from "@/components/app/issues-table";
import { FixApplyPanel } from "@/components/app/fix-apply-panel";
import { Badge } from "@/components/ui/badge";
import {
  getAudit,
  getRepository,
  getIssuesForAudit,
} from "@/lib/data";
import { hasDeterministicFix } from "@/lib/audit/deterministic-fix";
import { formatDate } from "@/lib/utils";

// The "Run audit" server action fires from this page; give it headroom for a
// real multi-page crawl on serverless (the crawl budget stays under this).
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  const repo = audit ? await getRepository(audit.repoId) : null;
  return { title: repo ? `Audit · ${repo.name}` : "Audit" };
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();
  const [repo, issues] = await Promise.all([
    getRepository(audit.repoId),
    getIssuesForAudit(audit.id),
  ]);

  const delta =
    audit.previousScore !== null ? audit.score - audit.previousScore : 0;

  // Issues with a fix available — either an instant deterministic patch, or
  // one already generated (prior run / sample data). These power the one-click
  // "prepare & review" panel. Only open issues (not ones already in a PR).
  const fixable = issues.filter(
    (i) =>
      (i.status === "open" || i.status === "ignored") &&
      (hasDeterministicFix(i) || i.suggestedFix.diff.trim().length > 0),
  );

  const crawlStats = [
    { label: "Pages scanned", value: audit.crawl.pagesScanned, icon: <FileSearch className="size-4" /> },
    { label: "Pages with issues", value: audit.crawl.pagesWithIssues, icon: <AlertTriangle className="size-4" /> },
    { label: "Avg render", value: `${audit.crawl.avgRenderMs}ms`, icon: <Timer className="size-4" /> },
    { label: "Broken links", value: audit.crawl.brokenLinks, icon: <Link2Off className="size-4" /> },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Repositories", href: "/repositories" },
          repo
            ? { label: repo.name, href: `/repositories/${repo.id}` }
            : { label: "Repository" },
          { label: "Audit" },
        ]}
        title={`Audit · ${formatDate(audit.createdAt)}`}
        description={
          repo
            ? `${repo.fullName} → ${repo.productionUrl.replace("https://", "")}`
            : undefined
        }
        actions={<RunAuditButton repoId={audit.repoId} />}
      />

      {/* Score + crawl */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="flex flex-col items-center justify-center gap-3 p-6">
          <ScoreRing score={audit.score} size={128} />
          <div className="flex items-center gap-2 text-sm">
            {delta !== 0 && (
              <span className={delta > 0 ? "text-signal" : "text-danger"}>
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts
              </span>
            )}
            <span className="text-fg-subtle">
              vs previous {audit.previousScore ?? "—"}
            </span>
          </div>
          <Badge tone={audit.crawl.renderMode === "rendered" ? "signal" : "neutral"}>
            <Globe className="size-3" />
            {audit.crawl.renderMode === "rendered" ? "Real render" : "Static crawl"}
          </Badge>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {crawlStats.map((s) => (
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
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>
              Weighted contribution to the {audit.score} overall score.
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <CategoryScores categories={audit.categories} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crawl summary</CardTitle>
            <CardDescription>How RankForge gathered this audit.</CardDescription>
          </CardHeader>
          <dl className="space-y-3 px-5 pb-5 text-sm">
            <Row label="Duration">{(audit.durationMs / 1000).toFixed(1)}s</Row>
            <Row label="Render mode">
              {audit.crawl.renderMode === "rendered"
                ? "Headless browser (Playwright)"
                : "Static HTML fetch"}
            </Row>
            <Row label="Total issues">{audit.totalIssues}</Row>
            <Row label="Status">
              <span
                className={`capitalize ${
                  {
                    completed: "text-signal",
                    running: "text-electric-bright",
                    queued: "text-fg-muted",
                    failed: "text-danger",
                  }[audit.status] ?? "text-fg-muted"
                }`}
              >
                {audit.status}
              </span>
            </Row>
          </dl>
        </Card>
      </div>

      {/* Apply fixes — instinctive, with a change report */}
      {fixable.length > 0 && (
        <div className="mt-6">
          <FixApplyPanel fixable={fixable} />
        </div>
      )}

      {/* Prioritized issues */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-fg">Prioritized issues</h2>
        <IssuesTable issues={issues} />
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </div>
  );
}
