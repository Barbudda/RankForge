import type { Metadata } from "next";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The short, honest terms for using RankForge while it is an MVP.",
  alternates: { canonical: "/terms" },
};

const CONTACT = "hugopoene74@gmail.com";

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ])}
      />
      <ProsePage
        title="Terms of service"
        intro="Short version: use RankForge honestly, review every change before you merge it, and understand it is an early-stage product. Last updated: October 2026."
      >
        <ProseBlock heading="The service">
          <p>
            RankForge audits websites you control: from your machine and your
            CI through the open-source CLI, and on a schedule through hosted
            monitoring. It reads public pages and never writes to your
            repositories; any change to your code is yours to make and merge.
            Only audit URLs you are authorized to audit.
          </p>
        </ProseBlock>
        <ProseBlock heading="No guarantees on outcomes">
          <p>
            RankForge fixes technical SEO issues. It does not and cannot
            promise search-ranking improvements, and nothing on this site
            should be read as such a promise.
          </p>
        </ProseBlock>
        <ProseBlock heading="MVP status">
          <p>
            The product is under active development. Billing isn&apos;t open
            yet: the prices shown are what plans will cost when it opens, and
            you&apos;ll be told before anything changes. Features may change
            and the service may be interrupted. Monitoring runs on a schedule
            and alerts are sent on a best-effort basis. Review every change
            before merging; you remain responsible for your codebase.
          </p>
        </ProseBlock>
        <ProseBlock heading="Liability & contact">
          <p>
            The service is provided &quot;as is&quot; without warranty of any
            kind, to the maximum extent permitted by law. Questions:{" "}
            <a className="text-molten-bright underline decoration-molten-bright/40 underline-offset-2 hover:decoration-molten-bright" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </ProseBlock>
      </ProsePage>
    </>
  );
}
