import { ImageResponse } from "next/og";

// Branded 1200×630 social share card, generated at the edge. Next auto-emits
// og:image (+ width/height/alt/type) and, because twitter.card is
// summary_large_image, twitter:image too. Covers / and /pricing.
// NOTE: satori requires every element with >1 child to set display:flex, and
// only renders glyphs present in its bundled font (latin) — keep text ASCII.
export const alt = "RankForge — Technical SEO PRs for modern repos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FRAMEWORKS = ["Next.js", "Nuxt", "Astro", "SvelteKit", "Remix", "MDX"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(1200px 600px at 15% -10%, #10204a 0%, #05060b 55%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#f5f7ff",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #4f7bff 0%, #22d3ee 100%)",
              color: "#05060b",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 38, fontWeight: 700 }}>RankForge</div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.08,
              maxWidth: 960,
            }}
          >
            <div style={{ display: "flex" }}>Technical SEO problems become</div>
            <div style={{ display: "flex", color: "#34e0a1" }}>
              pull requests that fix them.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 29,
              color: "#a7aec4",
              maxWidth: 920,
            }}
          >
            Audits your rendered site, maps each issue to a file, and opens
            small, reviewable PRs. Built for Next.js, Nuxt, Astro and more.
          </div>
        </div>

        {/* Framework chips */}
        <div style={{ display: "flex", gap: 14 }}>
          {FRAMEWORKS.map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                fontSize: 24,
                color: "#6b7390",
                border: "1px solid #1d2334",
                borderRadius: 999,
                padding: "8px 18px",
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
