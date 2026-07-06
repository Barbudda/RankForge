"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Shared canvas engine for the three SEO dot-visualisation fields.
 *
 * Handles the boilerplate every field needs so the field components only
 * describe their dot model and how to draw a frame:
 *  - DPR-aware sizing + ResizeObserver (rebuilds the model on resize)
 *  - a single requestAnimationFrame loop, paused via IntersectionObserver
 *    whenever the section is off-screen (no work while scrolled away)
 *  - prefers-reduced-motion: draws ONE static, settled frame (no loop, no
 *    pointer tracking) so the metaphor still reads with zero movement
 *  - window-level pointer tracking (the canvas is pointer-events-none, so the
 *    listener lives on window and is mapped into canvas space)
 *  - self-computed scroll progress (0 entering → 1 leaving the viewport)
 *
 * Canvas content is drawn entirely on the client after mount, so Math.random
 * positions and time are hydration-safe (the <canvas> is empty in SSR HTML).
 */

export type FieldEnv = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** elapsed seconds since the loop started */
  t: number;
  /** delta seconds since the previous frame (clamped) */
  dt: number;
  /** pointer in canvas space; inside=false when off the field or on touch idle */
  mouse: { x: number; y: number; inside: boolean };
  /** scroll progress of the host through the viewport, 0..1 */
  progress: number;
  /** true when prefers-reduced-motion: draw a static settled composition */
  reduced: boolean;
};

export function useParticleField(
  ref: React.RefObject<HTMLCanvasElement | null>,
  opts: {
    /** (re)build the dot model whenever the canvas is sized */
    setup?: (w: number, h: number, reduced: boolean) => void;
    /** draw a single frame */
    frame: (env: FieldEnv) => void;
    /** cap device-pixel-ratio (default 2) to bound fill cost on retina */
    maxDpr?: number;
  },
) {
  const reduce = !!useReducedMotion();

  // Keep the latest callbacks in refs so the RAF effect runs once per
  // reduce-change (synced post-render, never mutated during render).
  const setupRef = useRef(opts.setup);
  const frameRef = useRef(opts.frame);
  const maxDpr = opts.maxDpr ?? 2;

  useEffect(() => {
    setupRef.current = opts.setup;
    frameRef.current = opts.frame;
  });

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let start = 0;
    let inView = true;
    let prevW = -1;
    let prevH = -1;
    let prevDpr = -1;
    let roRaf = 0;
    const mouse = { x: -9999, y: -9999, inside: false };

    // Re-size the canvas and rebuild the field model ONLY when the integer size
    // (or DPR) actually changes — so the spec-mandated duplicate ResizeObserver
    // fire and sub-pixel jitter don't re-run the heavy setup()/headless-settle.
    // Bursts (window drag, mobile URL-bar) are coalesced to one rebuild per
    // frame by the observer below.
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      if (nw === prevW && nh === prevH && dpr === prevDpr) return;
      prevW = nw;
      prevH = nh;
      prevDpr = dpr;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rectCache = null;
      setupRef.current?.(w, h, reduce);
      if (reduce) drawOnce(performance.now());
    };

    const computeProgress = () => {
      const rect = parent.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = (vh - rect.top) / (rect.height + vh);
      return Math.min(1, Math.max(0, p));
    };

    const drawOnce = (time: number) => {
      if (!start) start = time;
      ctx.clearRect(0, 0, w, h);
      frameRef.current({
        ctx,
        w,
        h,
        t: (time - start) / 1000,
        dt: Math.min(0.05, last ? (time - last) / 1000 : 0),
        mouse,
        progress: computeProgress(),
        reduced: reduce,
      });
      last = time;
    };

    const loop = (time: number) => {
      drawOnce(time);
      raf = requestAnimationFrame(loop);
    };

    const clearMouse = () => {
      mouse.inside = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    // Canvas rect cached per frame (invalidated by scroll/resize/draw) so a
    // pointermove never forces a synchronous layout read.
    let rectCache: DOMRect | null = null;
    const onPointer = (e: PointerEvent) => {
      // Touch/pen have no true hover — leave the field to its autonomous
      // motion + scroll progress so nothing sticks after a finger lifts.
      if (e.pointerType !== "mouse") {
        mouse.inside = false;
        return;
      }
      rectCache ??= canvas.getBoundingClientRect();
      mouse.x = e.clientX - rectCache.left;
      mouse.y = e.clientY - rectCache.top;
      mouse.inside =
        mouse.x >= 0 && mouse.x <= w && mouse.y >= 0 && mouse.y <= h;
    };
    // relatedTarget null → the pointer left the document/window entirely.
    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) clearMouse();
    };
    // Only the near-viewport fields track the pointer at all.
    let pointerBound = false;
    const bindPointer = () => {
      if (pointerBound) return;
      pointerBound = true;
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerout", onPointerOut, { passive: true });
      window.addEventListener("blur", clearMouse);
    };
    const unbindPointer = () => {
      if (!pointerBound) return;
      pointerBound = false;
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", clearMouse);
      clearMouse();
    };

    const ro = new ResizeObserver(() => {
      // Coalesce a burst of fires into one rebuild on the next frame.
      if (roRaf) return;
      roRaf = requestAnimationFrame(() => {
        roRaf = 0;
        resize();
      });
    });
    ro.observe(parent);
    resize(); // synchronous first paint

    if (reduce) {
      // Static: a single settled frame, redrawn only on real size changes.
      return () => {
        if (roRaf) cancelAnimationFrame(roRaf);
        ro.disconnect();
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = !!entry?.isIntersecting;
        rectCache = null;
        if (inView && !raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
          bindPointer();
        } else if (!inView && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          unbindPointer();
        }
      },
      { rootMargin: "140px" },
    );
    io.observe(parent);

    // Scrolling moves the canvas under a stationary cursor — refresh the rect.
    const onScroll = () => {
      rectCache = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (roRaf) cancelAnimationFrame(roRaf);
      ro.disconnect();
      io.disconnect();
      unbindPointer();
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduce, maxDpr, ref]);
}

/** SEO-themed palette as "r,g,b" strings for use in `rgba(var, a)`. */
export const DOT = {
  base: "120,140,176", // muted slate-blue — neutral crawl signals
  cyan: "34,211,238",
  electric: "79,123,255",
  amber: "255,180,84", // issue (warning)
  danger: "255,107,129", // issue (critical)
  signal: "52,224,161", // resolved / validated
} as const;

/** Draw a soft glowing dot without per-frame gradients or shadowBlur. */
export function glowDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  alpha: number,
  glow = 1,
) {
  if (glow > 0) {
    ctx.fillStyle = `rgba(${rgb},${alpha * 0.12 * glow})`;
    ctx.beginPath();
    ctx.arc(x, y, r * (2.8 + glow), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(${rgb},${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
