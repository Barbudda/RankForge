import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SceneBackdrop } from "@/components/marketing/scene-backdrop";
import { JsonLd } from "@/components/seo/json-ld";
import { siteGraph } from "@/lib/seo/schema";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Site-wide entity graph (Organization + WebSite + SoftwareApplication) */}
      <JsonLd data={siteGraph} />
      <SceneBackdrop />
      <SiteNav />
      <main className="relative">{children}</main>
      <SiteFooter />
    </>
  );
}
