"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ChaosField3D } from "./chaos-field-3d";

/**
 * Full-page fixed backdrop for the marketing surface. Sits behind all content
 * (`-z-10`), spans the viewport, and hosts the whole-page-scroll-driven WebGL
 * "chaos → clarity" scene (with its 2D fallback). A static CSS scrim keeps copy
 * AA-legible over the field. App routes never mount this, so the dashboard
 * stays sober.
 *
 * The WebGL "code chaos → clarity" field is the signature scene and stays
 * present the whole way down — strongest in the hero, then easing to a calmer
 * ambient floor so it COEXISTS with the per-section dot systems (swarm / flow /
 * web) layered on top, instead of either one burying the other.
 */
export function SceneBackdrop() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 1100, 2000], [1, 0.82, 0.58]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ opacity }}>
        <ChaosField3D />
      </motion.div>
      {/* Readability scrim: gentle darken at top/bottom edges + behind dense copy. */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_8%,transparent_45%,rgba(5,6,11,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
