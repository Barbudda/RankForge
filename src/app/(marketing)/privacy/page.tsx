import type { Metadata } from "next";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What RankForge stores, why, and how to get it deleted. Written in plain language.",
  alternates: { canonical: "/privacy" },
};

const CONTACT = "hugopoene74@gmail.com";

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ])}
      />
      <ProsePage
        title="Privacy policy"
        intro="RankForge is an early-stage product run by a solo founder. This page says exactly what is stored and why, in plain language. Last updated: July 2026."
      >
        <ProseBlock heading="What we store">
          <p>
            When you create an account: your email address and a password hash,
            both handled by Supabase Auth (we never see your plain password).
            When you connect a repository: its name, the production URL you
            provide, and the audits, issues and pull-request metadata RankForge
            generates for it.
          </p>
        </ProseBlock>
        <ProseBlock heading="What we don't do">
          <p>
            No advertising trackers, no analytics resale, no selling or sharing
            of your data with third parties. RankForge reads your site&apos;s
            rendered HTML and your repository structure; it never reads your
            environment secrets.
          </p>
        </ProseBlock>
        <ProseBlock heading="Where it lives">
          <p>
            Data is stored in a Supabase (PostgreSQL) project with row-level
            security, so each account can only ever read its own rows. Audit
            runs may call the Anthropic API to analyze crawled pages; only the
            crawled page content and detected issues are sent, never your
            credentials.
          </p>
        </ProseBlock>
        <ProseBlock heading="Deletion & contact">
          <p>
            Email <a className="text-electric-bright hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>{" "}
            from your account address and your account and all associated data
            will be deleted. GDPR requests (access, rectification, erasure) go
            to the same address.
          </p>
        </ProseBlock>
      </ProsePage>
    </>
  );
}
