import type { Metadata } from "next";
import { PricingSection } from "@/components/marketing/pricing";
import { ComparisonSection } from "@/components/marketing/sections";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { PRICING_FAQS } from "@/lib/seo/content";

const TITLE = "Pricing";
const DESCRIPTION =
  "Simple, scalable pricing for RankForge — from solo devs to agencies managing many sites.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing · RankForge",
    description: DESCRIPTION,
    url: "/pricing",
    siteName: "RankForge",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing · RankForge",
    description: DESCRIPTION,
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqPageSchema(PRICING_FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <section className="relative overflow-hidden pt-36 pb-4">
        <div className="absolute inset-x-0 top-0 h-96 spotlight" />
        <div className="container-rf relative text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Pricing that scales from solo to agency
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
            Start free. Pay only when RankForge is opening more pull requests than
            you can merge.
          </p>
        </div>
      </section>
      <PricingSection standalone />
      <ComparisonSection />
      <FaqSection items={PRICING_FAQS} title="Pricing questions" />
      <FinalCta />
    </>
  );
}
