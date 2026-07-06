import type { SeoIssue } from "@/types";

/**
 * 20 realistic technical-SEO issues across the three demo repos.
 * Each carries a concrete fix suggestion with a unified diff, the
 * likely files to touch, and impact/effort/risk scoring — exactly
 * the payload a real FixGenerator would emit.
 */
export const mockIssues: SeoIssue[] = [
  // ───────────────────────── acme/acme-saas-web (Next.js) ──────────
  {
    id: "iss_acme_canonical_features",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Missing canonical on /features pages",
    description:
      "The /features hub and its 6 sub-pages render without a canonical link. Google is indexing both the trailing-slash and query-string variants, splitting authority across duplicates.",
    category: "indexing",
    impact: "high",
    effort: "low",
    risk: "low",
    confidence: 96,
    status: "pr_open",
    affectedUrls: [
      { url: "https://acme.com/features" },
      { url: "https://acme.com/features/analytics" },
      { url: "https://acme.com/features/automation" },
      { url: "https://acme.com/features/?ref=nav", note: "Indexed duplicate" },
    ],
    evidence:
      'Rendered <head> contains no <link rel="canonical">. Search Console reports 6 "Duplicate, Google chose different canonical" pages under /features.',
    canAutoFix: true,
    createdAt: "2026-06-23T08:43:00.000Z",
    files: [
      {
        path: "app/features/layout.tsx",
        reason: "Shared layout for the /features segment — ideal canonical anchor.",
        confidence: 92,
      },
      {
        path: "app/features/[slug]/page.tsx",
        reason: "Dynamic feature pages need per-slug canonical via generateMetadata.",
        confidence: 78,
      },
    ],
    suggestedFix: {
      summary:
        "Add a canonical URL to the /features layout and generate per-slug canonicals for dynamic feature pages.",
      filesChanged: ["app/features/layout.tsx", "app/features/[slug]/page.tsx"],
      branchName: "rankforge/seo-canonical-features",
      prTitle: "fix(seo): add canonical URLs to features pages",
      prDescription:
        "Adds canonical metadata to the /features segment so Google consolidates indexing signals on the clean URL instead of trailing-slash and query-string duplicates.",
      confidence: 94,
      validationSteps: [
        "Run `next build` and open /features — confirm a single <link rel=\"canonical\"> in <head>.",
        "Check /features/?ref=nav resolves to the same canonical.",
        "Re-submit /features in Search Console URL inspection.",
      ],
      rollbackNotes:
        "Revert the two files. No data or routing changes — purely additive metadata.",
      diff: `--- a/app/features/layout.tsx
+++ b/app/features/layout.tsx
@@ -1,7 +1,14 @@
 import type { Metadata } from "next";
+
+export const metadata: Metadata = {
+  alternates: {
+    canonical: "https://acme.com/features",
+  },
+};

 export default function FeaturesLayout({
   children,
 }: {
   children: React.ReactNode;
 }) {
   return <section className="features">{children}</section>;
 }
--- a/app/features/[slug]/page.tsx
+++ b/app/features/[slug]/page.tsx
@@ -1,5 +1,15 @@
 import type { Metadata } from "next";
 import { getFeature } from "@/lib/features";
+
+export async function generateMetadata(
+  { params }: { params: Promise<{ slug: string }> },
+): Promise<Metadata> {
+  const { slug } = await params;
+  return {
+    alternates: { canonical: \`https://acme.com/features/\${slug}\` },
+  };
+}

 export default async function FeaturePage(
   { params }: { params: Promise<{ slug: string }> },
 ) {`,
    },
  },
  {
    id: "iss_acme_dup_titles",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Duplicate title tags across blog posts",
    description:
      "31 blog posts share the generic title \"Acme Blog\". Titles are the single strongest on-page ranking signal and should be unique per post.",
    category: "metadata",
    impact: "high",
    effort: "medium",
    risk: "low",
    confidence: 91,
    status: "open",
    affectedUrls: [
      { url: "https://acme.com/blog/scaling-postgres" },
      { url: "https://acme.com/blog/edge-functions-101" },
      { url: "https://acme.com/blog/observability-guide" },
    ],
    evidence:
      "31/44 blog routes render <title>Acme Blog</title>. generateMetadata is not implemented on app/blog/[slug]/page.tsx.",
    canAutoFix: true,
    createdAt: "2026-06-23T08:43:10.000Z",
    files: [
      {
        path: "app/blog/[slug]/page.tsx",
        reason: "Dynamic blog route lacks generateMetadata returning the post title.",
        confidence: 95,
      },
    ],
    suggestedFix: {
      summary:
        "Implement generateMetadata on the blog route to derive a unique title and description from each post's frontmatter.",
      filesChanged: ["app/blog/[slug]/page.tsx"],
      branchName: "rankforge/seo-unique-blog-titles",
      prTitle: "fix(seo): generate unique titles for blog posts",
      prDescription:
        "Replaces the static \"Acme Blog\" title with per-post titles and descriptions sourced from frontmatter, eliminating 31 duplicate-title pages.",
      confidence: 90,
      validationSteps: [
        "Open three blog posts and confirm each renders a distinct <title>.",
        "Verify descriptions are truncated to ~155 characters.",
      ],
      rollbackNotes: "Revert app/blog/[slug]/page.tsx. Additive metadata only.",
      diff: `--- a/app/blog/[slug]/page.tsx
+++ b/app/blog/[slug]/page.tsx
@@ -1,6 +1,18 @@
 import type { Metadata } from "next";
 import { getPost } from "@/lib/posts";
+
+export async function generateMetadata(
+  { params }: { params: Promise<{ slug: string }> },
+): Promise<Metadata> {
+  const { slug } = await params;
+  const post = await getPost(slug);
+  return {
+    title: \`\${post.title} · Acme Blog\`,
+    description: post.excerpt.slice(0, 155),
+    alternates: { canonical: \`https://acme.com/blog/\${slug}\` },
+  };
+}

 export default async function BlogPost(
   { params }: { params: Promise<{ slug: string }> },
 ) {`,
    },
  },
  {
    id: "iss_acme_sitemap_dynamic",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Sitemap missing dynamic routes",
    description:
      "The sitemap only lists 12 static marketing pages. 88 dynamic /blog and /features routes are absent, so new content is discovered slowly or not at all.",
    category: "indexing",
    impact: "critical",
    effort: "medium",
    risk: "medium",
    confidence: 89,
    status: "pr_open",
    affectedUrls: [{ url: "https://acme.com/sitemap.xml", note: "Only 12 URLs listed" }],
    evidence:
      "/sitemap.xml contains 12 <url> entries. Crawl discovered 142 indexable pages — a 130-page gap.",
    canAutoFix: true,
    createdAt: "2026-06-23T08:43:20.000Z",
    files: [
      {
        path: "app/sitemap.ts",
        reason: "No dynamic sitemap route exists; create one using the Next.js Metadata Routes API.",
        confidence: 88,
      },
    ],
    suggestedFix: {
      summary:
        "Add an app/sitemap.ts route that enumerates static pages plus all blog and feature slugs at build/request time.",
      filesChanged: ["app/sitemap.ts"],
      branchName: "rankforge/seo-dynamic-sitemap",
      prTitle: "fix(seo): generate sitemap for dynamic routes",
      prDescription:
        "Adds a dynamic sitemap covering blog posts and feature pages so Google can discover all 142 indexable URLs, not just 12 static ones.",
      confidence: 86,
      validationSteps: [
        "Run `next build` and request /sitemap.xml — confirm 140+ <url> entries.",
        "Validate the XML with Search Console's sitemap tester.",
      ],
      rollbackNotes:
        "Delete app/sitemap.ts to restore the previous static sitemap. No other files touched.",
      diff: `--- /dev/null
+++ b/app/sitemap.ts
@@ -0,0 +1,27 @@
+import type { MetadataRoute } from "next";
+import { getAllPosts } from "@/lib/posts";
+import { getAllFeatures } from "@/lib/features";
+
+const BASE = "https://acme.com";
+
+export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
+  const [posts, features] = await Promise.all([
+    getAllPosts(),
+    getAllFeatures(),
+  ]);
+
+  const dynamic = [
+    ...posts.map((p) => ({
+      url: \`\${BASE}/blog/\${p.slug}\`,
+      lastModified: p.updatedAt,
+      changeFrequency: "weekly" as const,
+      priority: 0.7,
+    })),
+    ...features.map((f) => ({
+      url: \`\${BASE}/features/\${f.slug}\`,
+      priority: 0.8,
+    })),
+  ];
+
+  return [{ url: BASE, priority: 1 }, ...dynamic];
+}`,
    },
  },
  {
    id: "iss_acme_og_pricing",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "No OpenGraph image for pricing page",
    description:
      "The /pricing page has no og:image. Links shared on X, LinkedIn and Slack render as a bare grey card, hurting click-through from social.",
    category: "metadata",
    impact: "medium",
    effort: "low",
    risk: "low",
    confidence: 93,
    status: "open",
    affectedUrls: [{ url: "https://acme.com/pricing" }],
    evidence:
      "Rendered <head> has og:title and og:description but no og:image. Social scrapers fall back to no preview image.",
    canAutoFix: true,
    createdAt: "2026-06-23T08:43:30.000Z",
    files: [
      {
        path: "app/pricing/opengraph-image.tsx",
        reason: "Next.js generates an og:image automatically from this file convention.",
        confidence: 90,
      },
    ],
    suggestedFix: {
      summary:
        "Add a dynamic opengraph-image route for /pricing using the built-in ImageResponse API.",
      filesChanged: ["app/pricing/opengraph-image.tsx"],
      branchName: "rankforge/seo-pricing-og-image",
      prTitle: "fix(seo): add OpenGraph image for pricing page",
      prDescription:
        "Generates a branded 1200×630 OpenGraph image for /pricing so shared links render a rich preview card.",
      confidence: 92,
      validationSteps: [
        "Open /pricing/opengraph-image and confirm a 1200×630 PNG renders.",
        "Paste the pricing URL into a social preview debugger.",
      ],
      rollbackNotes: "Delete the new file. No impact on page content.",
      diff: `--- /dev/null
+++ b/app/pricing/opengraph-image.tsx
@@ -0,0 +1,21 @@
+import { ImageResponse } from "next/og";
+
+export const size = { width: 1200, height: 630 };
+export const contentType = "image/png";
+export const alt = "Acme pricing — plans for every team";
+
+export default function Image() {
+  return new ImageResponse(
+    (
+      <div style={{
+        height: "100%", width: "100%", display: "flex",
+        flexDirection: "column", justifyContent: "center",
+        padding: 80, background: "#05060b", color: "#fff",
+        fontSize: 64, fontWeight: 700,
+      }}>
+        Simple pricing for every team
+      </div>
+    ),
+    { ...size },
+  );
+}`,
    },
  },
  {
    id: "iss_acme_product_schema",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Product schema missing on /pricing",
    description:
      "The pricing page lists three paid plans but exposes no Product/Offer structured data, so Google can't show price-rich results.",
    category: "schema",
    impact: "high",
    effort: "medium",
    risk: "low",
    confidence: 84,
    status: "open",
    affectedUrls: [{ url: "https://acme.com/pricing" }],
    evidence:
      "No application/ld+json blocks found on /pricing. Rich Results Test reports 0 detected items.",
    canAutoFix: true,
    createdAt: "2026-06-23T08:43:40.000Z",
    files: [
      {
        path: "app/pricing/page.tsx",
        reason: "Inject a JSON-LD <script> with Product + Offer data for each plan.",
        confidence: 87,
      },
    ],
    suggestedFix: {
      summary:
        "Embed Product/Offer JSON-LD for each pricing plan via a typed structured-data helper.",
      filesChanged: ["app/pricing/page.tsx", "lib/schema.ts"],
      branchName: "rankforge/seo-pricing-product-schema",
      prTitle: "fix(seo): add Product schema to pricing page",
      prDescription:
        "Adds Product and Offer structured data for the three plans so eligible price-rich results can appear in search.",
      confidence: 83,
      validationSteps: [
        "Run the Rich Results Test against /pricing — confirm 3 Product items, 0 errors.",
        "Validate prices and currency match the displayed plans.",
      ],
      rollbackNotes: "Revert both files. JSON-LD is invisible to users; safe to remove.",
      diff: `--- a/app/pricing/page.tsx
+++ b/app/pricing/page.tsx
@@ -1,5 +1,16 @@
 import { plans } from "@/lib/plans";
+import { productJsonLd } from "@/lib/schema";

 export default function PricingPage() {
+  const jsonLd = plans.map(productJsonLd);
   return (
     <main>
+      <script
+        type="application/ld+json"
+        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
+      />
       {/* …pricing grid… */}
     </main>
   );
 }`,
    },
  },
  {
    id: "iss_acme_software_schema",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "SoftwareApplication schema missing sitewide",
    description:
      "As a SaaS product, Acme should expose SoftwareApplication structured data on the homepage to qualify for app-style rich results.",
    category: "schema",
    impact: "medium",
    effort: "low",
    risk: "low",
    confidence: 80,
    status: "pr_merged",
    affectedUrls: [{ url: "https://acme.com/" }],
    evidence: "Homepage exposes Organization schema but no SoftwareApplication entity.",
    canAutoFix: true,
    createdAt: "2026-06-09T08:31:00.000Z",
    files: [
      {
        path: "app/layout.tsx",
        reason: "Root layout is the right place for sitewide SoftwareApplication JSON-LD.",
        confidence: 85,
      },
    ],
    suggestedFix: {
      summary: "Add SoftwareApplication JSON-LD to the root layout.",
      filesChanged: ["app/layout.tsx", "lib/schema.ts"],
      branchName: "rankforge/seo-software-application-schema",
      prTitle: "fix(seo): add SoftwareApplication schema",
      prDescription:
        "Adds sitewide SoftwareApplication structured data describing the product, category and pricing band.",
      confidence: 81,
      validationSteps: ["Validate the homepage in the Rich Results Test."],
      rollbackNotes: "Revert both files.",
      diff: `--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -1,4 +1,12 @@
 import { softwareApplicationJsonLd } from "@/lib/schema";
+
+const appSchema = softwareApplicationJsonLd({
+  name: "Acme",
+  category: "BusinessApplication",
+  offersFrom: 29,
+  currency: "EUR",
+});

 export default function RootLayout({ children }) {`,
    },
  },
  {
    id: "iss_acme_orphan_pages",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Orphaned landing pages with no internal links",
    description:
      "Three campaign landing pages are reachable only via paid ads — nothing in the site links to them, so they accrue no internal authority and may be dropped from the index.",
    category: "internal-linking",
    impact: "medium",
    effort: "medium",
    risk: "low",
    confidence: 76,
    status: "open",
    affectedUrls: [
      { url: "https://acme.com/lp/devtools-2026" },
      { url: "https://acme.com/lp/migrate-from-legacy" },
      { url: "https://acme.com/lp/startup-program" },
    ],
    evidence:
      "Link-graph analysis: 3 pages have inbound internal link count = 0 (orphans). Click depth from homepage = ∞.",
    canAutoFix: false,
    createdAt: "2026-06-23T08:43:50.000Z",
    files: [
      {
        path: "components/footer.tsx",
        reason: "Add a 'Solutions' column linking the campaign pages for crawlability.",
        confidence: 64,
      },
    ],
    suggestedFix: {
      summary:
        "Surface the three orphan pages from the footer (or a /solutions hub) so they receive internal links.",
      filesChanged: ["components/footer.tsx"],
      branchName: "rankforge/seo-link-orphan-pages",
      prTitle: "fix(seo): link orphaned campaign landing pages",
      prDescription:
        "Adds footer links to three orphaned campaign pages so they gain internal authority and stay indexable. Human review recommended for anchor wording.",
      confidence: 70,
      validationSteps: [
        "Confirm the three pages now have ≥1 inbound internal link in the next crawl.",
      ],
      rollbackNotes: "Revert components/footer.tsx.",
      diff: `--- a/components/footer.tsx
+++ b/components/footer.tsx
@@ -22,6 +22,13 @@
       </nav>
+      <nav aria-label="Solutions">
+        <h3>Solutions</h3>
+        <a href="/lp/devtools-2026">For developer tools</a>
+        <a href="/lp/migrate-from-legacy">Migrate from legacy</a>
+        <a href="/lp/startup-program">Startup program</a>
+      </nav>`,
    },
  },
  {
    id: "iss_acme_hero_alt",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Hero image missing alt text",
    description:
      "The homepage hero uses next/image with an empty alt attribute. Decorative or not, the dashboard screenshot conveys meaning and should be described.",
    category: "images",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: 97,
    status: "open",
    affectedUrls: [{ url: "https://acme.com/" }],
    evidence: '<img> for the hero renders alt="". Accessibility + image SEO signal lost.',
    canAutoFix: true,
    createdAt: "2026-06-23T08:44:00.000Z",
    files: [
      {
        path: "components/hero.tsx",
        reason: "next/image alt prop is empty.",
        confidence: 96,
      },
    ],
    suggestedFix: {
      summary: "Provide a descriptive alt for the hero product screenshot.",
      filesChanged: ["components/hero.tsx"],
      branchName: "rankforge/seo-hero-alt-text",
      prTitle: "fix(seo): add alt text to hero image",
      prDescription:
        "Adds a descriptive alt attribute to the homepage hero screenshot for accessibility and image search.",
      confidence: 95,
      validationSteps: ["Inspect the hero <img> and confirm a meaningful alt."],
      rollbackNotes: "Revert components/hero.tsx.",
      diff: `--- a/components/hero.tsx
+++ b/components/hero.tsx
@@ -14,7 +14,7 @@
       <Image
         src="/hero-dashboard.png"
-        alt=""
+        alt="Acme analytics dashboard showing real-time revenue charts"
         width={1200}
         height={720}
         priority
       />`,
    },
  },
  {
    id: "iss_acme_heading_hierarchy",
    repoId: "repo_acme",
    auditId: "audit_acme_2",
    title: "Skipped heading levels on /blog index",
    description:
      "The blog index jumps from <h1> straight to <h4> for post cards, breaking the document outline crawlers use to understand structure.",
    category: "structure",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: 88,
    status: "open",
    affectedUrls: [{ url: "https://acme.com/blog" }],
    evidence: "Outline: h1 → h4 (h2 and h3 skipped) across 44 post cards.",
    canAutoFix: true,
    createdAt: "2026-06-23T08:44:10.000Z",
    files: [
      {
        path: "components/post-card.tsx",
        reason: "Card title uses <h4>; should be <h2> within the index.",
        confidence: 82,
      },
    ],
    suggestedFix: {
      summary: "Promote post-card titles from h4 to h2 to restore the outline.",
      filesChanged: ["components/post-card.tsx"],
      branchName: "rankforge/seo-blog-heading-levels",
      prTitle: "fix(seo): correct heading hierarchy on blog index",
      prDescription:
        "Fixes a skipped-heading-level issue so the blog index has a valid h1 → h2 outline.",
      confidence: 84,
      validationSteps: ["Run an accessibility outline check on /blog."],
      rollbackNotes: "Revert components/post-card.tsx.",
      diff: `--- a/components/post-card.tsx
+++ b/components/post-card.tsx
@@ -8,7 +8,7 @@
     <article className="post-card">
-      <h4>{post.title}</h4>
+      <h2 className="text-lg font-semibold">{post.title}</h2>
       <p>{post.excerpt}</p>
     </article>`,
    },
  },

  // ───────────────────────── northstar/northstar-docs (Astro/MDX) ──
  {
    id: "iss_ns_article_schema",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "Missing Article schema in MDX blog",
    description:
      "None of the 64 MDX articles expose Article/TechArticle structured data, so they miss rich-result eligibility and author/date signals.",
    category: "schema",
    impact: "high",
    effort: "medium",
    risk: "low",
    confidence: 82,
    status: "open",
    affectedUrls: [
      { url: "https://docs.northstar.dev/blog/release-2-0" },
      { url: "https://docs.northstar.dev/blog/migration-guide" },
    ],
    evidence: "0 application/ld+json blocks across the /blog MDX collection.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:00.000Z",
    files: [
      {
        path: "src/layouts/BlogPost.astro",
        reason: "Shared MDX layout — emit Article JSON-LD from frontmatter here.",
        confidence: 90,
      },
    ],
    suggestedFix: {
      summary:
        "Emit Article JSON-LD from the BlogPost layout using each post's frontmatter (title, author, dates).",
      filesChanged: ["src/layouts/BlogPost.astro"],
      branchName: "rankforge/seo-article-schema",
      prTitle: "fix(seo): add Article schema to MDX blog",
      prDescription:
        "Adds TechArticle structured data sourced from frontmatter to all 64 MDX posts, unlocking rich-result eligibility.",
      confidence: 81,
      validationSteps: [
        "Run the Rich Results Test on two posts — confirm an Article item with author and dates.",
      ],
      rollbackNotes: "Revert src/layouts/BlogPost.astro.",
      diff: `--- a/src/layouts/BlogPost.astro
+++ b/src/layouts/BlogPost.astro
@@ -1,8 +1,24 @@
 ---
 const { title, author, pubDate, updatedDate } = Astro.props.frontmatter;
+const jsonLd = {
+  "@context": "https://schema.org",
+  "@type": "TechArticle",
+  headline: title,
+  author: { "@type": "Person", name: author },
+  datePublished: pubDate,
+  dateModified: updatedDate ?? pubDate,
+};
 ---
 <html>
   <head>
+    <script
+      type="application/ld+json"
+      set:html={JSON.stringify(jsonLd)}
+    />
   </head>`,
    },
  },
  {
    id: "iss_ns_alt_text_bulk",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "37 images without alt text",
    description:
      "37 inline documentation screenshots across the guides are missing alt text. This hurts accessibility and image search, and is a common automated-audit failure.",
    category: "images",
    impact: "medium",
    effort: "high",
    risk: "low",
    confidence: 99,
    status: "open",
    affectedUrls: [
      { url: "https://docs.northstar.dev/guides/setup", note: "9 images" },
      { url: "https://docs.northstar.dev/guides/deploy", note: "12 images" },
    ],
    evidence: "37 <img> / Astro <Image> nodes render with empty or absent alt attributes.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:10.000Z",
    files: [
      {
        path: "src/content/guides/*.mdx",
        reason: "Markdown image syntax with empty alt across 14 guide files.",
        confidence: 86,
      },
    ],
    suggestedFix: {
      summary:
        "Generate descriptive alt text for each screenshot from its surrounding heading and caption, applied across the guide MDX files.",
      filesChanged: ["src/content/guides/setup.mdx", "src/content/guides/deploy.mdx"],
      branchName: "rankforge/seo-image-alt-text",
      prTitle: "fix(seo): add alt text to documentation images",
      prDescription:
        "Adds descriptive alt text to 37 documentation screenshots. Alt copy is derived from nearby headings — please skim for accuracy before merge.",
      confidence: 78,
      validationSteps: [
        "Run an accessibility scan — confirm 0 images-without-alt violations.",
        "Skim a sample of generated alt text for accuracy.",
      ],
      rollbackNotes: "Revert the touched MDX files. Content text is unchanged.",
      diff: `--- a/src/content/guides/setup.mdx
+++ b/src/content/guides/setup.mdx
@@ -18,7 +18,7 @@
 Open the dashboard and create your first project.

-![](./img/create-project.png)
+![Create project dialog with name and region fields](./img/create-project.png)

 Once created, copy the API key shown in the header.

-![](./img/api-key.png)
+![Project header highlighting the copyable API key](./img/api-key.png)`,
    },
  },
  {
    id: "iss_ns_robots_old_sitemap",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "Robots.txt references old sitemap URL",
    description:
      "robots.txt points Sitemap: at /sitemap-legacy.xml, which 404s. The current sitemap at /sitemap-index.xml is never advertised to crawlers.",
    category: "indexing",
    impact: "high",
    effort: "low",
    risk: "low",
    confidence: 94,
    status: "open",
    affectedUrls: [{ url: "https://docs.northstar.dev/robots.txt" }],
    evidence:
      "robots.txt line 5: `Sitemap: https://docs.northstar.dev/sitemap-legacy.xml` → 404. Actual sitemap: /sitemap-index.xml.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:20.000Z",
    files: [
      {
        path: "public/robots.txt",
        reason: "Hard-coded sitemap URL is stale.",
        confidence: 97,
      },
    ],
    suggestedFix: {
      summary: "Point robots.txt at the current sitemap index URL.",
      filesChanged: ["public/robots.txt"],
      branchName: "rankforge/seo-fix-robots-sitemap",
      prTitle: "fix(seo): correct sitemap URL in robots.txt",
      prDescription:
        "Updates the Sitemap directive to the live /sitemap-index.xml so crawlers stop hitting a 404.",
      confidence: 95,
      validationSteps: [
        "Fetch /robots.txt and confirm the Sitemap line resolves with 200.",
      ],
      rollbackNotes: "Revert public/robots.txt.",
      diff: `--- a/public/robots.txt
+++ b/public/robots.txt
@@ -2,5 +2,5 @@
 User-agent: *
 Allow: /

-Sitemap: https://docs.northstar.dev/sitemap-legacy.xml
+Sitemap: https://docs.northstar.dev/sitemap-index.xml`,
    },
  },
  {
    id: "iss_ns_canonical_versioned",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "Canonical missing on versioned docs",
    description:
      "Versioned docs (/v1, /v2, /latest) serve near-identical content without canonicals, diluting authority between versions.",
    category: "indexing",
    impact: "medium",
    effort: "medium",
    risk: "medium",
    confidence: 79,
    status: "open",
    affectedUrls: [
      { url: "https://docs.northstar.dev/v1/api" },
      { url: "https://docs.northstar.dev/v2/api" },
      { url: "https://docs.northstar.dev/latest/api" },
    ],
    evidence:
      "3 version paths render the same API reference. None declare a canonical pointing at /latest.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:30.000Z",
    files: [
      {
        path: "src/layouts/Docs.astro",
        reason: "Compute canonical to the /latest equivalent for archived versions.",
        confidence: 74,
      },
    ],
    suggestedFix: {
      summary:
        "Set the canonical of archived doc versions to their /latest equivalent.",
      filesChanged: ["src/layouts/Docs.astro"],
      branchName: "rankforge/seo-versioned-canonical",
      prTitle: "fix(seo): canonicalize versioned docs to /latest",
      prDescription:
        "Adds canonical links from /v1 and /v2 doc pages to the /latest version. Review the version-mapping logic before merge — medium risk.",
      confidence: 72,
      validationSteps: [
        "Confirm /v1/api canonical points to /latest/api.",
        "Ensure /latest pages remain self-canonical.",
      ],
      rollbackNotes: "Revert src/layouts/Docs.astro.",
      diff: `--- a/src/layouts/Docs.astro
+++ b/src/layouts/Docs.astro
@@ -2,6 +2,11 @@
 const { version, slug } = Astro.props;
+const canonical =
+  version === "latest"
+    ? \`https://docs.northstar.dev/latest/\${slug}\`
+    : \`https://docs.northstar.dev/latest/\${slug}\`;
 ---
+<link rel="canonical" href={canonical} />`,
    },
  },
  {
    id: "iss_ns_meta_desc_missing",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "Meta descriptions missing on 23 doc pages",
    description:
      "23 guide pages have no meta description, so Google synthesizes snippets from arbitrary body text, lowering SERP click-through.",
    category: "metadata",
    impact: "medium",
    effort: "medium",
    risk: "low",
    confidence: 87,
    status: "open",
    affectedUrls: [
      { url: "https://docs.northstar.dev/guides/auth" },
      { url: "https://docs.northstar.dev/guides/webhooks" },
    ],
    evidence: "23 pages render no <meta name=\"description\">; frontmatter lacks a description field.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:40.000Z",
    files: [
      {
        path: "src/content/guides/*.mdx",
        reason: "Add a description to frontmatter; layout already reads it when present.",
        confidence: 80,
      },
    ],
    suggestedFix: {
      summary:
        "Generate a ~150-char description from each guide's intro paragraph and add it to frontmatter.",
      filesChanged: ["src/content/guides/auth.mdx", "src/content/guides/webhooks.mdx"],
      branchName: "rankforge/seo-meta-descriptions",
      prTitle: "fix(seo): add meta descriptions to docs",
      prDescription:
        "Adds descriptions to frontmatter for 23 guides. Generated from each intro — please skim for tone before merge.",
      confidence: 76,
      validationSteps: ["Confirm each page renders a unique <meta name=\"description\">."],
      rollbackNotes: "Revert the touched MDX frontmatter.",
      diff: `--- a/src/content/guides/auth.mdx
+++ b/src/content/guides/auth.mdx
@@ -1,5 +1,6 @@
 ---
 title: Authentication
+description: Set up authentication with API keys, OAuth and session tokens in Northstar — with copy-paste examples for every framework.
 ---`,
    },
  },
  {
    id: "iss_ns_orphan_changelog",
    repoId: "repo_northstar",
    auditId: "audit_northstar_1",
    title: "Orphan changelog entries",
    description:
      "Individual changelog entry pages are generated but only the index links the latest 5. Older entries become orphans over time.",
    category: "internal-linking",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: 71,
    status: "open",
    affectedUrls: [{ url: "https://docs.northstar.dev/changelog/2025-11" }],
    evidence: "Link graph: 18 changelog entries have inbound internal links = 0.",
    canAutoFix: true,
    createdAt: "2026-06-22T17:11:50.000Z",
    files: [
      {
        path: "src/pages/changelog/index.astro",
        reason: "Render an archive list linking every entry, not just the latest 5.",
        confidence: 78,
      },
    ],
    suggestedFix: {
      summary: "Add a full changelog archive list so every entry is internally linked.",
      filesChanged: ["src/pages/changelog/index.astro"],
      branchName: "rankforge/seo-changelog-archive",
      prTitle: "fix(seo): link all changelog entries from the index",
      prDescription:
        "Adds an archive section listing every changelog entry so older posts are no longer orphaned.",
      confidence: 75,
      validationSteps: ["Confirm all changelog entries have ≥1 inbound link next crawl."],
      rollbackNotes: "Revert src/pages/changelog/index.astro.",
      diff: `--- a/src/pages/changelog/index.astro
+++ b/src/pages/changelog/index.astro
@@ -20,6 +20,12 @@
   {recent.map((e) => <ChangelogCard entry={e} />)}
+
+  <section aria-label="Archive">
+    <h2>Archive</h2>
+    <ul>
+      {all.map((e) => <li><a href={e.url}>{e.title}</a></li>)}
+    </ul>
+  </section>`,
    },
  },

  // ───────────────────────── northstar/studio-landing (Nuxt) ───────
  {
    id: "iss_studio_multiple_h1",
    repoId: "repo_studio",
    auditId: "audit_studio_1",
    title: "Multiple H1 on homepage",
    description:
      "The homepage renders three <h1> elements (hero, a feature block, and the footer logo wrapper). Search engines expect one primary heading per page.",
    category: "structure",
    impact: "medium",
    effort: "low",
    risk: "low",
    confidence: 90,
    status: "open",
    affectedUrls: [{ url: "https://studio.northstar.dev/" }],
    evidence: "Outline scan: 3 <h1> nodes on /. Hero, FeatureGrid and SiteFooter each emit one.",
    canAutoFix: true,
    createdAt: "2026-06-21T12:06:00.000Z",
    files: [
      {
        path: "components/FeatureGrid.vue",
        reason: "Section title should be h2, not h1.",
        confidence: 88,
      },
      {
        path: "components/SiteFooter.vue",
        reason: "Logo wrapper should not be an h1.",
        confidence: 84,
      },
    ],
    suggestedFix: {
      summary:
        "Keep the hero <h1> and demote the feature-grid and footer headings to h2 / non-heading.",
      filesChanged: ["components/FeatureGrid.vue", "components/SiteFooter.vue"],
      branchName: "rankforge/seo-single-h1",
      prTitle: "fix(seo): enforce a single H1 on the homepage",
      prDescription:
        "Demotes two extra <h1> elements so the homepage has exactly one primary heading.",
      confidence: 87,
      validationSteps: ["Run an outline check on / — confirm exactly one h1."],
      rollbackNotes: "Revert both components.",
      diff: `--- a/components/FeatureGrid.vue
+++ b/components/FeatureGrid.vue
@@ -2,7 +2,7 @@
 <template>
   <section class="features">
-    <h1 class="section-title">Everything you ship, in one studio</h1>
+    <h2 class="section-title">Everything you ship, in one studio</h2>
--- a/components/SiteFooter.vue
+++ b/components/SiteFooter.vue
@@ -3,7 +3,7 @@
   <footer>
-    <h1 class="logo">Studio</h1>
+    <span class="logo" aria-label="Studio">Studio</span>`,
    },
  },
  {
    id: "iss_studio_skipped_heading",
    repoId: "repo_studio",
    auditId: "audit_studio_1",
    title: "Skipped heading level on /work",
    description:
      "The case-study page goes from <h2> to <h5>, skipping two levels and confusing the outline crawlers build for featured snippets.",
    category: "structure",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: 83,
    status: "open",
    affectedUrls: [{ url: "https://studio.northstar.dev/work" }],
    evidence: "Outline: h1 → h2 → h5 (h3, h4 skipped).",
    canAutoFix: true,
    createdAt: "2026-06-21T12:06:10.000Z",
    files: [
      {
        path: "pages/work.vue",
        reason: "Case-study subtitles use h5; should be h3.",
        confidence: 80,
      },
    ],
    suggestedFix: {
      summary: "Promote case-study subtitles from h5 to h3.",
      filesChanged: ["pages/work.vue"],
      branchName: "rankforge/seo-work-heading-levels",
      prTitle: "fix(seo): fix heading hierarchy on /work",
      prDescription: "Restores a valid heading outline on the case-study page.",
      confidence: 81,
      validationSteps: ["Run an outline check on /work."],
      rollbackNotes: "Revert pages/work.vue.",
      diff: `--- a/pages/work.vue
+++ b/pages/work.vue
@@ -30,7 +30,7 @@
   <article v-for="c in cases" :key="c.id">
-    <h5>{{ c.subtitle }}</h5>
+    <h3>{{ c.subtitle }}</h3>`,
    },
  },
  {
    id: "iss_studio_org_schema",
    repoId: "repo_studio",
    auditId: "audit_studio_1",
    title: "Organization schema missing",
    description:
      "No Organization structured data is present, so Google has no machine-readable name, logo or social profiles for the studio's knowledge panel.",
    category: "schema",
    impact: "medium",
    effort: "low",
    risk: "low",
    confidence: 85,
    status: "pr_open",
    affectedUrls: [{ url: "https://studio.northstar.dev/" }],
    evidence: "0 Organization JSON-LD entities sitewide.",
    canAutoFix: true,
    createdAt: "2026-06-21T12:06:20.000Z",
    files: [
      {
        path: "app.vue",
        reason: "Inject sitewide Organization JSON-LD via useHead.",
        confidence: 88,
      },
    ],
    suggestedFix: {
      summary: "Add Organization JSON-LD sitewide through Nuxt's useHead.",
      filesChanged: ["app.vue"],
      branchName: "rankforge/seo-organization-schema",
      prTitle: "fix(seo): add Organization schema",
      prDescription:
        "Adds sitewide Organization structured data (name, logo, sameAs) to strengthen brand entity signals.",
      confidence: 86,
      validationSteps: ["Validate the homepage in the Rich Results Test."],
      rollbackNotes: "Revert app.vue.",
      diff: `--- a/app.vue
+++ b/app.vue
@@ -1,4 +1,18 @@
 <script setup lang="ts">
+useHead({
+  script: [
+    {
+      type: "application/ld+json",
+      innerHTML: JSON.stringify({
+        "@context": "https://schema.org",
+        "@type": "Organization",
+        name: "Northstar Studio",
+        url: "https://studio.northstar.dev",
+        logo: "https://studio.northstar.dev/logo.png",
+        sameAs: ["https://x.com/northstar", "https://github.com/northstar"],
+      }),
+    },
+  ],
+});
 </script>`,
    },
  },
  {
    id: "iss_studio_weak_anchors",
    repoId: "repo_studio",
    auditId: "audit_studio_1",
    title: "Weak anchor text on footer links",
    description:
      "Footer links use generic anchors like \"here\" and \"link\", which pass little topical signal and hurt accessibility.",
    category: "internal-linking",
    impact: "low",
    effort: "low",
    risk: "low",
    confidence: 77,
    status: "open",
    affectedUrls: [{ url: "https://studio.northstar.dev/" }],
    evidence: "4 footer links use anchor text \"here\" / \"link\" / \"read\".",
    canAutoFix: true,
    createdAt: "2026-06-21T12:06:30.000Z",
    files: [
      {
        path: "components/SiteFooter.vue",
        reason: "Replace generic anchors with descriptive text.",
        confidence: 79,
      },
    ],
    suggestedFix: {
      summary: "Rewrite generic footer anchors to descriptive, keyword-aligned text.",
      filesChanged: ["components/SiteFooter.vue"],
      branchName: "rankforge/seo-descriptive-anchors",
      prTitle: "fix(seo): improve footer anchor text",
      prDescription:
        "Replaces vague \"here\"/\"link\" anchors with descriptive text to strengthen internal-link signals and accessibility.",
      confidence: 78,
      validationSteps: ["Confirm footer anchors describe their destination."],
      rollbackNotes: "Revert components/SiteFooter.vue.",
      diff: `--- a/components/SiteFooter.vue
+++ b/components/SiteFooter.vue
@@ -12,8 +12,8 @@
-    <a href="/process">here</a>
-    <a href="/pricing">link</a>
+    <a href="/process">How we work</a>
+    <a href="/pricing">Studio pricing</a>`,
    },
  },
];

export function getIssue(id: string): SeoIssue | undefined {
  return mockIssues.find((i) => i.id === id);
}

export function getIssuesForRepo(repoId: string): SeoIssue[] {
  return mockIssues.filter((i) => i.repoId === repoId);
}

export function getIssuesForAudit(auditId: string): SeoIssue[] {
  return mockIssues.filter((i) => i.auditId === auditId);
}
