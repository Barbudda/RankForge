import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/**
 * /robots.txt — allow the public marketing pages, disallow the authenticated
 * product surface and the API, and point crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const base = config.appUrl;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/repositories",
          "/audits",
          "/issues",
          "/pull-requests",
          "/settings",
          "/billing",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
