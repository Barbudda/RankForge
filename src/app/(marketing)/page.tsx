import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { ChaosToClaritySection } from "@/components/marketing/chaos-to-clarity";
import {
  HowItWorksSection,
  FeaturesSection,
  FrameworksSection,
  ComparisonSection,
} from "@/components/marketing/sections";
import { SecuritySection } from "@/components/marketing/security-traffic";
import { EditorSection } from "@/components/marketing/editor-section";
import { ProblemSection } from "@/components/marketing/problem-signal-field";
import { FindingToDiffSection } from "@/components/marketing/finding-to-diff";
import { PrAssemblySection } from "@/components/marketing/pr-assembly-board";
import { PricingSection } from "@/components/marketing/pricing";
import { FaqSection, FAQS } from "@/components/marketing/faq";
import { FinalCta, MidCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={faqPageSchema(FAQS)} />
      <Hero />
      <ChaosToClaritySection />
      <ProblemSection />
      <HowItWorksSection />
      <FindingToDiffSection />
      <PrAssemblySection />
      <MidCta />
      <FeaturesSection />
      <FrameworksSection />
      <EditorSection />
      <ComparisonSection />
      <SecuritySection />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
