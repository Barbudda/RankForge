"use client";

import { useEffect, type RefObject } from "react";

/**
 * Real edge refraction for `.lg` liquid-glass surfaces (docs/DESIGN.md).
 *
 * Technique from kube.io's "Liquid Glass in the browser": for the element's
 * exact size and corner radius, build a displacement map where the rim (the
 * "bezel") is a convex squircle of glass. Snell's law gives how far a ray is
 * bent at each distance from the edge; that offset is encoded in the R/G
 * channels (128 = no shift) and fed to an SVG feDisplacementMap used as the
 * element's backdrop-filter. The centre stays clear, the rim bends what is
 * behind it.
 *
 * Only Chromium accepts an SVG filter inside backdrop-filter. Elsewhere this
 * hook does nothing and the CSS material (blur + saturate) stands alone.
 */

export interface RefractionOptions {
  /** Width of the curved rim, px. */
  bezel?: number;
  /** Glass thickness, px: scales how far the rim bends the backdrop. */
  thickness?: number;
  /** Backdrop blur applied after refraction, px. */
  blur?: number;
  /** Refractive index (glass ≈ 1.5). */
  ior?: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
let host: SVGSVGElement | null = null;
let seq = 0;

function supportsSvgBackdrop(): boolean {
  if (typeof navigator === "undefined") return false;
  const uad = (navigator as Navigator & {
    userAgentData?: { brands?: { brand: string }[] };
  }).userAgentData;
  return Boolean(uad?.brands?.some((b) => /Chromium/i.test(b.brand)));
}

function filterHost(): SVGSVGElement {
  if (host && host.isConnected) return host;
  host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("width", "0");
  host.setAttribute("height", "0");
  host.style.position = "absolute";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);
  return host;
}

/** Convex squircle: flat top that rolls smoothly over the edge. */
const squircle = (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);

/** Lateral shift (px) of a vertical ray at each normalised rim position. */
function shiftTable(bezel: number, thickness: number, ior: number, n = 128) {
  const out = new Float32Array(n);
  const d = 1e-3;
  for (let i = 0; i < n; i++) {
    const t = Math.min(1 - d, Math.max(d, i / (n - 1)));
    const slope = ((squircle(t + d) - squircle(t - d)) / (2 * d)) * (thickness / bezel);
    const theta1 = Math.atan(slope);
    const theta2 = Math.asin(Math.sin(theta1) / ior);
    out[i] = thickness * squircle(t) * Math.tan(theta1 - theta2);
  }
  return out;
}

function buildMap(w: number, h: number, radius: number, opts: Required<RefractionOptions>) {
  const table = shiftTable(opts.bezel, opts.thickness, opts.ior);
  let max = 0;
  for (const v of table) max = Math.max(max, Math.abs(v));
  max = Math.max(max, 1e-3);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const px = img.data;
  const hx = w / 2;
  const hy = h / 2;
  const r = Math.min(radius, hx, hy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Signed distance to the rounded rect (negative inside).
      const qx = Math.abs(x + 0.5 - hx) - (hx - r);
      const qy = Math.abs(y + 0.5 - hy) - (hy - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
      const inward = -sd;

      let dx = 0;
      let dy = 0;
      if (inward >= 0 && inward < opts.bezel) {
        // Outward normal of the nearest edge.
        let nx: number;
        let ny: number;
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy) || 1;
          nx = qx / l;
          ny = qy / l;
        } else if (qx > qy) {
          nx = 1;
          ny = 0;
        } else {
          nx = 0;
          ny = 1;
        }
        nx *= Math.sign(x + 0.5 - hx) || 1;
        ny *= Math.sign(y + 0.5 - hy) || 1;
        const k = table[Math.min(127, Math.floor((inward / opts.bezel) * 127))]!;
        // Sample from further out: the rim pulls the surroundings in.
        dx = nx * k;
        dy = ny * k;
      }
      px[i] = 128 + (dx / max) * 127;
      px[i + 1] = 128 + (dy / max) * 127;
      px[i + 2] = 128;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL(), scale: max * 2 };
}

export function useLiquidRefraction(
  ref: RefObject<HTMLElement | null>,
  options: RefractionOptions = {},
) {
  const { bezel = 18, thickness = 22, blur = 12, ior = 1.5 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsSvgBackdrop()) return;
    if (window.matchMedia("(prefers-reduced-transparency: reduce)").matches) return;

    const id = `lg-refract-${++seq}`;
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("color-interpolation-filters", "sRGB");
    const image = document.createElementNS(SVG_NS, "feImage");
    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("result", "map");
    image.setAttribute("preserveAspectRatio", "none");
    const disp = document.createElementNS(SVG_NS, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "map");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");
    filter.append(image, disp);
    filterHost().appendChild(filter);

    const opts = { bezel, thickness, blur, ior };
    let last = "";
    let raf = 0;
    const update = () => {
      raf = 0;
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (w < 8 || h < 8) return;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const key = `${w}x${h}r${radius}`;
      if (key === last) return;
      last = key;
      const map = buildMap(w, h, radius, opts);
      image.setAttribute("href", map.url);
      image.setAttribute("width", String(w));
      image.setAttribute("height", String(h));
      disp.setAttribute("scale", map.scale.toFixed(2));
      el.style.backdropFilter = `url(#${id}) blur(${blur}px) saturate(165%)`;
    };
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(el);
    update();

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      filter.remove();
      el.style.backdropFilter = "";
    };
  }, [ref, bezel, thickness, blur, ior]);
}
