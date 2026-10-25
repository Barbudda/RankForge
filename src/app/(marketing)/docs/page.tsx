import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { DOC_RULES, ruleSlug } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Docs: what RankForge detects and fixes",
  description:
    "Every technical SEO issue RankForge detects, what it means, and how to fix it in your code.",
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
        intro="RankForge crawls your rendered site, checks it against this rule catalog, and gives each finding its evidence and, for mechanical issues, a ready patch. These pages double as plain-language guides to each issue."
      >
        <ProseBlock heading="Getting started">
          <p>
            Run <span className="font-mono text-xs">npx rankforge-cli audit &lt;url&gt;</span>{" "}
            or the free audit, then add the pull-request check and monitoring.
            Issues are scored by impact, effort and risk; each one lists the
            affected URLs and the files most likely behind it. RankForge never
            writes to your repository. You can also{" "}
            <Link href="/docs/agent" className="text-molten-bright underline decoration-molten-bright/40 underline-offset-2 hover:decoration-molten-bright">
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
                    className="group flex items-center justify-between gap-4 lg lg-thin rounded-xl px-4 py-3 transition-colors hover:border-molten/40"
                  >
                    <span>
                      <span className="text-sm font-medium text-fg">
                        {r.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-fg-muted">
                        {r.description}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-fg-subtle transition-colors group-hover:text-molten-bright" />
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
