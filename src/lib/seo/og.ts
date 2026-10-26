/**
 * The site-wide social card rendered by src/app/opengraph-image.tsx (keep the
 * alt text in step with it). A page that sets its own `openGraph` replaces the
 * inherited one, image included, so it has to pass this back explicitly.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Septune: technical SEO that survives your deploys",
};
