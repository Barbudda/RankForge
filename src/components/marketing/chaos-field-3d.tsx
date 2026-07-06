"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion, useScroll, useSpring } from "motion/react";
import { ChaosToClarityBackground } from "./chaos-background";
import { useCanLaunchWebgl } from "@/hooks/use-can-launch-webgl";

// three.js is code-split into its own chunk, never SSR'd (it touches window).
const GlyphFieldCanvas = dynamic(() => import("./glyph-field-canvas"), {
  ssr: false,
  loading: () => null,
});

/** Catches any WebGL/runtime error and silently reverts to the 2D field. */
class GlErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Phase = "fallback" | "mounting" | "live";

/**
 * Full-page WebGL backdrop orchestrator. Always renders the 2D field as the
 * SSR-safe floor; lazily mounts the WebGL scene on top once the device passes
 * the capability gate and the browser is idle. Progress is driven by
 * WHOLE-PAGE scroll. Any failure (reduced-motion, no-WebGL, low-GPU, runtime
 * error, perf dip) leaves the 2D field showing — never a blank screen.
 */
export function ChaosField3D() {
  const reduce = useReducedMotion();
  const { ready, tier } = useCanLaunchWebgl();
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("fallback");
  const [inView, setInView] = useState(false);
  const [idle, setIdle] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inRange, setInRange] = useState(true);
  const [failed, setFailed] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  // Timestamp (performance.now) of the last user scroll — written by the field,
  // read in useFrame for the idle-dim timing.
  const scrollClockRef = useRef(0);

  // Whole-page scroll progress (no target → window/document 0→1).
  const { scrollYProgress } = useScroll();
  // Same spring constants as chaos-to-clarity.tsx → one authored feel.
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  // Defer mount until the browser is idle (keeps three.js off the LCP path).
  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => setIdle(true));
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setIdle(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Mount/run only while the backdrop is near the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause the persistent canvas when the tab is backgrounded.
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Pause the loop once the user has scrolled past the choreography. The
  // backdrop is position:fixed so an IntersectionObserver always reports
  // "intersecting" — derive real range from the page scroll progress instead.
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => setInRange(v < 0.985));
    return () => unsub();
  }, [scrollYProgress]);

  const canRun = ready && tier !== null && !reduce && !failed;

  useEffect(() => {
    if (phase !== "fallback" || !(canRun && idle && inView)) return;
    const id = requestAnimationFrame(() => setPhase("mounting"));
    return () => cancelAnimationFrame(id);
  }, [phase, canRun, idle, inView]);

  const revert = () => {
    setFailed(true);
    setPhase("fallback");
  };

  const live = phase === "live";
  // In viewport range & tab visible. The field renders on-demand within this
  // window (frameloop="demand"), pausing the GPU when fully idle.
  const active = inRange && visible;

  return (
    <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0">
      {/* SSR-safe base: grid + spotlight + graph always; 2D fragments only when WebGL isn't live. */}
      <ChaosToClarityBackground showFragments={!live} />

      {phase !== "fallback" && tier && (
        <GlErrorBoundary onError={revert}>
          <div
            className="absolute inset-0"
            style={{
              opacity: live ? 1 : 0,
              // Idle state keeps a faint residual + a slight blur ("léger flou").
              filter: dimmed ? "blur(2.5px)" : "blur(0px)",
              transition: "opacity 700ms ease, filter 1600ms ease",
            }}
          >
            <GlyphFieldCanvas
              progress={progress}
              tier={tier}
              active={active}
              onReady={() => setPhase("live")}
              onDegrade={revert}
              scrollClockRef={scrollClockRef}
              onIdleChange={setDimmed}
            />
          </div>
        </GlErrorBoundary>
      )}
    </div>
  );
}
