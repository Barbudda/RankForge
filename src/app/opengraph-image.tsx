import { ImageResponse } from "next/og";

// Branded 1200×630 social share card, generated at the edge. Next auto-emits
// og:image (+ width/height/alt/type) and, because twitter.card is
// summary_large_image, twitter:image too. Covers / and /pricing.
// NOTE: satori requires every element with >1 child to set display:flex, and
// only renders glyphs present in its bundled font (latin) — keep text ASCII.
export const alt = "RankForge: technical SEO that survives your deploys";
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
            "radial-gradient(900px 520px at 88% 18%, #3a1606 0%, #0a0908 60%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#f3efe9",
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
              background: "#ff7a2f",
              color: "#170b04",
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
            <div style={{ display: "flex" }}>Ship fast.</div>
            <div style={{ display: "flex", color: "#34e0a1" }}>
              Stay indexed.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 29,
              color: "#b4aca2",
              maxWidth: 920,
            }}
          >
            Fails the pull request that would drop pages from Google, watches
            production, and hands each fix to your AI editor.
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
                color: "#8f877e",
                border: "1px solid #2a2521",
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
