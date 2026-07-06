import type { MetadataRoute } from "next";

/**
 * /manifest.webmanifest — completes the file-based metadata set and gives the
 * site an installable identity (name, theme, icon) for mobile/PWA surfaces.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RankForge — Automated technical SEO fixes, shipped as pull requests",
    short_name: "RankForge",
    description:
      "A technical-SEO agent for GitHub repos that audits your rendered site and opens small, reviewable pull requests that fix it.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060b",
    theme_color: "#05060b",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
    ],
  };
}
