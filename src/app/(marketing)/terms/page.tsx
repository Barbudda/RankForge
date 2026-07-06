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
        intro="Short version: use RankForge honestly, review what it opens, and understand it is an early-stage product. Last updated: July 2026."
      >
        <ProseBlock heading="The service">
          <p>
            RankForge audits websites you control and opens pull requests
            against repositories you connect. It only ever pushes to its own
            branches; merging is always your decision. Only connect
            repositories and URLs you are authorized to audit.
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
            The product is under active development. Pricing shown is a
            placeholder, features may change, and the service may be
            interrupted. Review every pull request before merging — you remain
            responsible for your codebase.
          </p>
        </ProseBlock>
        <ProseBlock heading="Liability & contact">
          <p>
            The service is provided &quot;as is&quot; without warranty of any
            kind, to the maximum extent permitted by law. Questions:{" "}
            <a className="text-electric-bright hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </ProseBlock>
      </ProsePage>
    </>
  );
}
