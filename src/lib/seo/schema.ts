/**
 * JSON-LD structured data for the RankForge marketing site.
 *
 * RankForge is a technical-SEO product, so its own site ships best-in-class
 * structured data: a single @graph (Organization + WebSite + SoftwareApplication
 * with machine-readable pricing) rendered once on every public page, plus
 * per-page helpers for FAQ and breadcrumbs.
 *
 * All absolute URLs come from the single hardened `config.appUrl` so they are
 * correct in production (never localhost). Currency mirrors the prices the UI
 * actually renders (EUR) — see src/components/marketing/pricing.tsx.
 */
import { config } from "@/lib/config";
import { BILLING_OPEN, PRICING_TIERS } from "@/lib/pricing";

const APP_URL = config.appUrl;
const PRICE_CURRENCY = "EUR";

const DESCRIPTION =
  "Automated technical SEO for developers. RankForge fails the pull request that would drop pages from Google and watches production after the merge.";

const organization = {
  "@type": "Organization",
  "@id": `${APP_URL}/#organization`,
  name: "RankForge",
  url: APP_URL,
  logo: `${APP_URL}/icon.svg`,
  description: DESCRIPTION,
};

const website = {
  "@type": "WebSite",
  "@id": `${APP_URL}/#website`,
  url: APP_URL,
  name: "RankForge",
  description: DESCRIPTION,
  publisher: { "@id": `${APP_URL}/#organization` },
};

const pricedTiers = PRICING_TIERS.filter(
  (t): t is typeof t & { priceMonthly: number } => t.priceMonthly !== null,
);
const prices = pricedTiers.map((t) => t.priceMonthly);

const softwareApplication = {
  "@type": "SoftwareApplication",
  "@id": `${APP_URL}/#software`,
  name: "RankForge",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: APP_URL,
  description: DESCRIPTION,
  publisher: { "@id": `${APP_URL}/#organization` },
  featureList: [
    "Deterministic technical-SEO audit: 54 checks with evidence, no AI guessing",
    "Production monitoring with email, Slack, Discord and webhook alerts",
    "Regression gate for pull requests: preview against production",
    "AI-search readiness (GEO): AI crawler access, llms.txt, citability",
    "Core Web Vitals of real users (Chrome UX Report)",
    "Ready patches for mechanical fixes: robots.txt, sitemap, canonical, viewport, lang, JSON-LD, OpenGraph",
    "MCP server and Claude Code plugin for AI coding assistants",
    "White-label HTML reports",
  ],
  // Until billing opens, the free plan is the only offer anyone can take: the
  // paid prices are announced on /pricing, not sold, so they stay out of the
  // markup (structured data must describe what exists).
  offers: BILLING_OPEN
    ? {
        "@type": "AggregateOffer",
        priceCurrency: PRICE_CURRENCY,
        lowPrice: String(Math.min(...prices)),
        highPrice: String(Math.max(...prices)),
        offerCount: pricedTiers.length,
        offers: pricedTiers.map((t) => ({
          "@type": "Offer",
          name: t.name,
          price: String(t.priceMonthly),
          priceCurrency: PRICE_CURRENCY,
          url: `${APP_URL}/pricing`,
          category: "subscription",
        })),
      }
    : { "@type": "Offer", name: "Free", price: "0", priceCurrency: PRICE_CURRENCY, url: `${APP_URL}/pricing` },
};

/** Site-wide entity graph — render once per public page (marketing layout). */
export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [organization, website, softwareApplication],
};

/** FAQPage schema built from the on-page FAQ so markup and data never drift. */
export function faqPageSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** BreadcrumbList for a second-level page (e.g. Home › Pricing). */
export function breadcrumbSchema(
  items: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${APP_URL}${it.path}`,
    })),
  };
}
