"use client";

import { Canvas } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { GlyphField } from "./glyph-field";
import type { GpuTier } from "@/hooks/use-can-launch-webgl";

/**
 * R3F scene root. Default export so next/dynamic can code-split three.js into
 * its own chunk (never in the SSR/initial bundle → LCP unaffected).
 * Transparent canvas: the page background (#05060b) shows through.
 */
export default function GlyphFieldCanvas({
  progress,
  tier,
  active,
  onReady,
  onDegrade,
  scrollClockRef,
  onIdleChange,
}: {
  progress: MotionValue<number>;
  tier: GpuTier;
  active: boolean;
  onReady: () => void;
  onDegrade: () => void;
  scrollClockRef: React.RefObject<number>;
  onIdleChange: (dimmed: boolean) => void;
}) {
  return (
    <Canvas
      aria-hidden
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      dpr={[1, 1.5]}
      camera={{ fov: 35, position: [0, 0, 6.2] }}
      frameloop="demand"
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
        onReady();
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <GlyphField
        progress={progress}
        tier={tier}
        active={active}
        onDegrade={onDegrade}
        scrollClockRef={scrollClockRef}
        onIdleChange={onIdleChange}
      />
    </Canvas>
  );
}
