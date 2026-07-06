"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * ChaosToClarityBackground — the hero backdrop.
 * Scattered "broken SEO" code fragments float behind the headline:
 * warnings in red/amber, valid signals in cyan/green. Deterministic
 * positions (no Math.random) to stay hydration-safe; gentle float only,
 * disabled under prefers-reduced-motion.
 */

type Fragment = {
  text: string;
  x: number; // % from left
  y: number; // % from top
  rot: number;
  tone: "bad" | "warn" | "good" | "muted";
  delay: number;
  dur: number;
};

const FRAGMENTS: Fragment[] = [
  { text: "<title> missing", x: 8, y: 14, rot: -7, tone: "bad", delay: 0, dur: 7 },
  { text: 'alt=""', x: 78, y: 10, rot: 6, tone: "bad", delay: 0.6, dur: 8 },
  { text: "og:image missing", x: 60, y: 22, rot: -3, tone: "warn", delay: 1.1, dur: 9 },
  { text: "/blog/[slug]", x: 18, y: 64, rot: 4, tone: "muted", delay: 0.3, dur: 8.5 },
  { text: "noindex?", x: 86, y: 58, rot: -9, tone: "bad", delay: 0.9, dur: 7.5 },
  { text: "canonical: ?", x: 40, y: 8, rot: 5, tone: "warn", delay: 1.4, dur: 8 },
  { text: "schema: missing", x: 70, y: 72, rot: -5, tone: "warn", delay: 0.2, dur: 9.5 },
  { text: "generateMetadata()", x: 6, y: 40, rot: 3, tone: "muted", delay: 0.7, dur: 8 },
  { text: "h1 × 3", x: 90, y: 34, rot: 8, tone: "bad", delay: 1.0, dur: 7 },
  { text: "sitemap: 12/142", x: 30, y: 80, rot: -4, tone: "warn", delay: 0.5, dur: 9 },
  { text: "canonical: valid", x: 52, y: 50, rot: -2, tone: "good", delay: 1.6, dur: 10 },
  { text: "alt: generated", x: 14, y: 86, rot: 3, tone: "good", delay: 1.2, dur: 9 },
  { text: "PR #42 ready", x: 80, y: 84, rot: -6, tone: "good", delay: 0.4, dur: 8 },
  { text: "robots.txt", x: 46, y: 30, rot: 7, tone: "muted", delay: 0.8, dur: 8.5 },
];

const TONE_CLASS: Record<Fragment["tone"], string> = {
  bad: "border-danger/30 text-danger/80 bg-danger/5",
  warn: "border-amber/30 text-amber/80 bg-amber/5",
  good: "border-signal/30 text-signal/80 bg-signal/5",
  muted: "border-border text-fg-subtle bg-surface/40",
};

export function ChaosToClarityBackground({
  showFragments = true,
}: {
  /** When the WebGL field is live on top, hide the 2D pills but keep the
   * grid / spotlight / graph base so the ambiance never disappears. */
  showFragments?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Technical grid + spotlight */}
      <div className="absolute inset-0 bg-grid opacity-[0.5] [mask-image:radial-gradient(70%_60%_at_50%_0%,#000_30%,transparent_75%)]" />
      <div className="absolute inset-x-0 top-0 h-[600px] spotlight" />

      {/* Connected-node lines (subtle SVG graph) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-electric)" />
            <stop offset="100%" stopColor="var(--color-cyan)" />
          </linearGradient>
        </defs>
        {[
          "M5,18 C25,30 35,12 52,30",
          "M52,30 C68,44 80,34 90,58",
          "M18,64 C32,52 40,70 52,50",
          "M60,72 C72,60 82,80 90,84",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="url(#line)"
            strokeWidth="0.25"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Floating fragments */}
      {showFragments &&
        FRAGMENTS.map((f, i) => (
        <motion.div
          key={i}
          className={`absolute hidden rounded-md border px-2.5 py-1 font-mono text-xs md:block ${TONE_CLASS[f.tone]}`}
          style={{ left: `${f.x}%`, top: `${f.y}%`, rotate: `${f.rot}deg` }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: reduce ? 0.4 : 1, delay: reduce ? 0 : f.delay }}
        >
          {/* Perpetual float runs as pure CSS on the compositor — zero JS per
              frame — and pauses under prefers-reduced-motion. */}
          <span
            className="block motion-reduce:animate-none"
            style={{
              animation: `frag-float ${f.dur}s ease-in-out ${f.delay}s infinite`,
            }}
          >
            {f.text}
          </span>
        </motion.div>
      ))}

      {/* Bottom fade into page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
