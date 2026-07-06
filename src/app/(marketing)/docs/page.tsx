import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { DOC_RULES, ruleSlug } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Docs — what RankForge detects and fixes",
  description:
    "Every technical SEO issue RankForge detects, what it means, and the pull request it opens to fix it.",
  alternates: { canonical: "/docs" },
};

const CATEGORY_LABELS: Record<string, string> = {
  metadata: "Metadata",
  indexing: "Indexing",
  structure: "Page structure",
  images: "Images",
  schema: "Structured data",
  "internal-linking": "Internal linking",
  performance: "Performance",
  framework: "Framework",
};

export default function DocsPage() {
  const byCategory = new Map<string, typeof DOC_RULES>();
  for (const rule of DOC_RULES) {
    const list = byCategory.get(rule.category) ?? [];
    byCategory.set(rule.category, [...list, rule]);
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
        ])}
      />
      <ProsePage
        title="What RankForge detects and fixes"
        intro="RankForge crawls your rendered site, checks it against this rule catalog, and opens a small, reviewable pull request for each fix. These pages double as plain-language guides to each issue."
      >
        <ProseBlock heading="Getting started">
          <p>
            Connect a GitHub repository, add the production URL, and run an
            audit. Issues are scored by impact, effort and risk; each one links
            to the files that cause it and the patch that fixes it. Nothing is
            ever committed to your main branch. You can also{" "}
            <Link href="/docs/agent" className="text-electric-bright hover:underline">
              use the RankForge agent directly in your editor
            </Link>{" "}
            via MCP.
          </p>
        </ProseBlock>
        {[...byCategory.entries()].map(([category, rules]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-fg">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <ul className="mt-3 space-y-2">
              {rules.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/docs/issues/${ruleSlug(r.id)}`}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface/50 px-4 py-3 transition-colors hover:border-electric/40"
                  >
                    <span>
                      <span className="text-sm font-medium text-fg">
                        {r.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-fg-muted">
                        {r.description}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-fg-subtle transition-colors group-hover:text-electric-bright" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </ProsePage>
    </>
  );
}
