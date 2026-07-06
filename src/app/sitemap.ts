import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import {
  CHANGELOG,
  DOC_RULES,
  FRAMEWORK_PAGES,
  ruleSlug,
} from "@/lib/seo/content";

/**
 * /sitemap.xml — every public, indexable marketing route. Docs and framework
 * entries derive from the same content lib as the pages themselves, so a new
 * rule or framework can never be missing here. The (app) routes are
 * authenticated and noindexed, so they are intentionally excluded.
 * lastModified uses the latest changelog date — a real content-change signal,
 * not a request-time timestamp.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.appUrl;
  const lastShipped = new Date(CHANGELOG[0]?.date ?? "2026-07-04");

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: lastShipped,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1, "weekly"),
    entry("/pricing", 0.8, "monthly"),
    entry("/docs", 0.7, "weekly"),
    entry("/docs/agent", 0.7, "monthly"),
    ...DOC_RULES.map((r) => entry(`/docs/issues/${ruleSlug(r.id)}`, 0.6, "monthly")),
    ...FRAMEWORK_PAGES.map((f) => entry(`/frameworks/${f.slug}`, 0.7, "monthly")),
    entry("/changelog", 0.5, "weekly"),
    entry("/privacy", 0.3, "yearly"),
    entry("/terms", 0.3, "yearly"),
  ];
}
