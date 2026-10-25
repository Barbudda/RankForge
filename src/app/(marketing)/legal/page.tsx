import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProsePage, ProseBlock } from "@/components/marketing/prose-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { HOST, LEGAL, legalNoticeReady } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal notice",
  description: "Who publishes RankForge, how to reach them, and who hosts the site.",
  alternates: { canonical: "/legal" },
};

export default function LegalNoticePage() {
  // Published only once the publisher's details are set (see src/lib/legal.ts).
  if (!legalNoticeReady) notFound();

  const link = "text-molten-bright underline decoration-molten-bright/40 underline-offset-2 hover:decoration-molten-bright";
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal notice", path: "/legal" },
        ])}
      />
      <ProsePage title="Legal notice" intro="Mentions légales: who publishes this site and who hosts it.">
        <ProseBlock heading="Publisher">
          <p>
            {LEGAL.name}
            {LEGAL.status ? `, ${LEGAL.status}` : ""}
            <br />
            {LEGAL.address}
            <br />
            SIRET {LEGAL.siret}
            {LEGAL.vat && (
              <>
                <br />
                {LEGAL.vat}
              </>
            )}
          </p>
          <p>
            Contact:{" "}
            <a className={link} href={`mailto:${LEGAL.email}`}>
              {LEGAL.email}
            </a>
            {LEGAL.phone ? ` · ${LEGAL.phone}` : ""}
          </p>
          <p>Publication director: {LEGAL.director || LEGAL.name}</p>
        </ProseBlock>
        <ProseBlock heading="Host">
          <p>
            {HOST.name}, {HOST.address}.{" "}
            <a className={link} href={HOST.url}>
              vercel.com
            </a>
          </p>
        </ProseBlock>
      </ProsePage>
    </>
  );
}
