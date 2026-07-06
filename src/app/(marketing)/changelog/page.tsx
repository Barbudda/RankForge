import type { Metadata } from "next";
import { ProsePage } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { CHANGELOG } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What shipped in RankForge, release by release. Audits, fixes, agents and the site itself.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Changelog", path: "/changelog" },
        ])}
      />
      <ProsePage
        title="Changelog"
        intro="What shipped, newest first. RankForge is built in public by a solo founder."
      >
        <ol className="space-y-8">
          {CHANGELOG.map((entry) => (
            <li key={entry.date} className="relative border-l border-border pl-6">
              <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border border-electric bg-bg" />
              <time
                dateTime={entry.date}
                className="font-mono text-xs text-fg-subtle"
              >
                {entry.date}
              </time>
              <h2 className="mt-1 text-lg font-semibold text-fg">
                {entry.title}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-fg-muted">
                {entry.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </ProsePage>
    </>
  );
}
