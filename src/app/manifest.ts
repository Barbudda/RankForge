import type { MetadataRoute } from "next";

/**
 * /manifest.webmanifest — completes the file-based metadata set and gives the
 * site an installable identity (name, theme, icon) for mobile/PWA surfaces.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Septune: automated technical SEO checks",
    short_name: "Septune",
    description:
      "Automated technical SEO for developers. Septune fails the pull request that would drop pages from Google and watches production after the merge.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0908",
    theme_color: "#0a0908",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
    ],
  };
}
