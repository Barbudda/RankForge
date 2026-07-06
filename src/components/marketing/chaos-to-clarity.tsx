"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

const BEFORE = [
  "<title> missing",
  'alt="" on 37 images',
  "canonical absent",
  "sitemap: 12 / 142 urls",
  "h1 × 3 on homepage",
  "schema.org: none",
];

const AFTER = [
  "<title> unique per page",
  "alt text generated",
  "canonical valid",
  "sitemap: 142 / 142 urls",
  "single h1 enforced",
  "schema.org: valid",
];

export function ChaosToClaritySection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // The reduced-motion static view is applied only AFTER mount, so the first
  // client render matches the server (which renders the scroll-linked version).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const still = mounted && !!reduce;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });

  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  // Hold the "before" card fully readable through the first ~half of the
  // scroll, then crossfade it with the "after" card in the back half — so the
  // red chaos doesn't vanish before the viewer has read it.
  const chaosOpacity = useTransform(p, [0.45, 0.9], [1, 0.18]);
  const chaosRotate = useTransform(p, [0, 1], [-2.5, 0]);
  const chaosX = useTransform(p, [0, 1], [0, -18]);
  const clarityOpacity = useTransform(p, [0.45, 0.95], [0.18, 1]);
  const clarityY = useTransform(p, [0.45, 1], [28, 0]);

  // Drive the score off a MotionValue so the whole section doesn't re-render
  // every scroll frame — only the text node updates.
  const score = useTransform(p, (v) => Math.round(54 + v * 38));

  return (
    <section ref={ref} className="relative py-24 md:py-32">
      <div className="container-rf">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            From <span className="text-danger">code chaos</span> to{" "}
            <span className="text-gradient-signal">SEO clarity</span>
          </h2>
          <p className="mt-4 text-fg-muted">
            Scroll, and watch a messy repo resolve into clean, indexable
            structure — every warning turned into a check, every fix backed by a
            diff.
          </p>
        </div>

        <div className="relative mt-16 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Before */}
          <motion.div
            style={
              still
                ? undefined
                : { opacity: chaosOpacity, rotate: chaosRotate, x: chaosX }
            }
            className="rounded-xl border border-danger/25 bg-danger/[0.04] p-5"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-danger/80">
              Before — raw repo
            </p>
            <ul className="space-y-2">
              {BEFORE.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2.5 rounded-md border border-danger/15 bg-danger/[0.05] px-3 py-2 font-mono text-xs text-danger/90"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Center score */}
          <div className="flex flex-col items-center gap-2 px-2">
            <div className="font-mono text-5xl font-semibold tabular-nums text-gradient-signal">
              {still ? 92 : <motion.span>{score}</motion.span>}
            </div>
            <div className="text-xs uppercase tracking-wider text-fg-subtle">
              SEO score
            </div>
            <div className="mt-2 hidden h-px w-16 bg-gradient-to-r from-danger via-amber to-signal md:block" />
          </div>

          {/* After */}
          <motion.div
            style={still ? undefined : { opacity: clarityOpacity, y: clarityY }}
            className="glow-signal rounded-xl border border-signal/30 bg-signal/[0.04] p-5"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-signal/90">
              After — RankForge PRs merged
            </p>
            <ul className="space-y-2">
              {AFTER.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2.5 rounded-md border border-signal/20 bg-signal/[0.06] px-3 py-2 font-mono text-xs text-signal"
                >
                  <Check className="size-3.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
