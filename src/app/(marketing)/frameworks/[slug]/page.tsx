import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo/schema";
import {
  FRAMEWORK_PAGES,
  getFramework,
  rulesForFramework,
  ruleSlug,
} from "@/lib/seo/content";

export function generateStaticParams() {
  return FRAMEWORK_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fw = getFramework(slug);
  if (!fw) return {};
  return {
    title: `Technical SEO for ${fw.name}, checked on every deploy`,
    description: `Septune audits ${fw.name} sites the way Googlebot reads them, fails the pull request that would drop pages from Google, and gives ready ${fw.name} patches for mechanical fixes.`,
    alternates: { canonical: `/frameworks/${slug}` },
  };
}

export default async function FrameworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fw = getFramework(slug);
  if (!fw) notFound();

  const rules = rulesForFramework(slug);
  const faqs = [
    {
      q: `How does Septune audit a ${fw.name} site?`,
      a: `It crawls your rendered pages the way Googlebot reads them, checks them against its 54 rules, and uses ${fw.name} conventions (${fw.metaApi}) to point each issue at the files most likely behind it.`,
    },
    {
      q: `Does Septune commit to my ${fw.name} repository?`,
      a: "Never. Septune never writes to your repository. Fixes reach your code through your own pull requests, written by you or your AI editor, and the pull-request check verifies them.",
    },
    {
      q: `Will fixing these issues improve my rankings?`,
      a: "No tool can honestly promise rankings. Septune fixes the technical layer so your pages can be crawled, rendered and indexed correctly. That is the part of SEO your repository controls.",
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Frameworks", path: "/#frameworks" },
          { name: fw.name, path: `/frameworks/${slug}` },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <ProsePage
        title={`Technical SEO for ${fw.name}, checked on every deploy`}
        intro={fw.blurb}
      >
        <ProseBlock heading={`What Septune checks on ${fw.name} sites`}>
          <ul className="space-y-2">
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
        </ProseBlock>

        <ProseBlock heading="Frequently asked">
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-semibold text-fg">{f.q}</h3>
                <p className="mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </ProseBlock>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="lg lg-molten inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-medium rounded-full transition-[filter] hover:brightness-110"
          >
            Run a free audit
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-sm text-fg-subtle">
            First audit free. No credit card.
          </p>
        </div>
      </ProsePage>
    </>
  );
}
