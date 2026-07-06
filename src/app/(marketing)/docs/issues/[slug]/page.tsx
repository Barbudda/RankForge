import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { DOC_RULES, getRuleBySlug, ruleSlug } from "@/lib/seo/content";

export function generateStaticParams() {
  return DOC_RULES.map((r) => ({ slug: ruleSlug(r.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rule = getRuleBySlug(slug);
  if (!rule) return {};
  return {
    title: `${rule.title} — how to fix it`,
    description: `${rule.description} What it means for technical SEO and the pull request RankForge opens to fix it.`,
    alternates: { canonical: `/docs/issues/${slug}` },
  };
}

const IMPACT_LABEL: Record<string, string> = {
  critical: "Critical impact",
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

export default async function IssueDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rule = getRuleBySlug(slug);
  if (!rule) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
          { name: rule.title, path: `/docs/issues/${slug}` },
        ])}
      />
      <ProsePage
        title={rule.title}
        intro={rule.description}
      >
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-fg-muted">
            {IMPACT_LABEL[rule.defaultImpact] ?? rule.defaultImpact}
          </span>
          <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-fg-muted">
            Effort: {rule.defaultEffort}
          </span>
          <span className="rounded-full border border-border bg-surface/60 px-3 py-1 text-fg-muted">
            Risk: {rule.defaultRisk}
          </span>
          {rule.canAutoFix && (
            <span className="rounded-full border border-signal/30 bg-signal/[0.06] px-3 py-1 text-signal">
              Auto-fixable
            </span>
          )}
        </div>

        <ProseBlock heading="Why it matters">
          <p>
            Search engines can only rank what they can crawl, render and
            understand. {rule.description} Left unfixed, this class of issue
            quietly limits how well your pages are indexed — it is exactly the
            kind of mechanical work that sits in a backlog because finding the
            responsible file takes longer than the fix itself.
          </p>
        </ProseBlock>

        <ProseBlock heading="How RankForge fixes it">
          <p>
            An audit detects this issue on your rendered pages, traces it to
            the template or source file that produces it
            {rule.frameworks?.length
              ? ` (with tailored fixes for ${rule.frameworks.join(", ")})`
              : ""}
            , and{" "}
            {rule.canAutoFix
              ? "opens a small, reviewable pull request with the patch, its expected impact and a validation checklist. You review and merge — nothing is committed to your main branch."
              : "reports it with the affected pages and concrete guidance, since this class of issue needs a human decision rather than an automatic patch."}
          </p>
        </ProseBlock>

        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-electric-bright hover:underline"
        >
          <ArrowLeft className="size-4" />
          All detected issues
        </Link>
      </ProsePage>
    </>
  );
}
