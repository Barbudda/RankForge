/**
 * Shared field math for the SEO dot systems — all client-side (canvas), so
 * Math.random / seeded noise are hydration-safe.
 *
 * - mulberry32: tiny seeded PRNG (deterministic per-section seeds)
 * - value noise + a curl-noise FLOW FIELD baked to a per-cell cos/sin grid
 *   (no trig in the hot loop) → divergence-free swirling currents that the
 *   FlowField streamlines and the CrawlerSwarm flow-bias both consume.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function fade(t: number) {
  return t * t * (3 - 2 * t);
}

/** Hashed lattice value in [0,1). */
function hash2(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 362437);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 2-D value noise in [0,1). */
function vnoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const v00 = hash2(ix, iy, seed);
  const v10 = hash2(ix + 1, iy, seed);
  const v01 = hash2(ix, iy + 1, seed);
  const v11 = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
}

/** Scalar potential (2 octaves) whose curl gives the flow direction. */
function potential(x: number, y: number, seed: number) {
  const f = 1 / 230;
  return (
    vnoise(x * f, y * f, seed) +
    vnoise(x * f * 2.4, y * f * 2.4, seed + 911) * 0.5
  );
}

export type FlowField = {
  cols: number;
  rows: number;
  cell: number;
  cos: Float32Array;
  sin: Float32Array;
};

/**
 * Bake a divergence-free curl-noise field to a coarse cos/sin grid. Velocity =
 * (∂φ/∂y, -∂φ/∂x) via finite differences → swirling, braiding currents.
 */
export function buildFlow(w: number, h: number, cell: number, seed: number): FlowField {
  const cols = Math.max(2, Math.ceil(w / cell) + 1);
  const rows = Math.max(2, Math.ceil(h / cell) + 1);
  const cos = new Float32Array(cols * rows);
  const sin = new Float32Array(cols * rows);
  const e = 1.2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * cell;
      const y = j * cell;
      const dpdy = (potential(x, y + e, seed) - potential(x, y - e, seed)) / (2 * e);
      const dpdx = (potential(x + e, y, seed) - potential(x - e, y, seed)) / (2 * e);
      const a = Math.atan2(-dpdx, dpdy); // (vx, vy) = (dp/dy, -dp/dx)
      const idx = j * cols + i;
      cos[idx] = Math.cos(a);
      sin[idx] = Math.sin(a);
    }
  }
  return { cols, rows, cell, cos, sin };
}

/**
 * Bilinear-sample the baked field at (x,y), writing the unit direction into
 * `out` ([cos, sin]). Allocation-free.
 */
export function sampleFlow(f: FlowField, x: number, y: number, out: [number, number]) {
  const gx = clamp(x / f.cell, 0, f.cols - 1.001);
  const gy = clamp(y / f.cell, 0, f.rows - 1.001);
  const i = gx | 0;
  const j = gy | 0;
  const tx = gx - i;
  const ty = gy - j;
  const i00 = j * f.cols + i;
  const i10 = i00 + 1;
  const i01 = i00 + f.cols;
  const i11 = i01 + 1;
  let cx =
    lerp(lerp(f.cos[i00]!, f.cos[i10]!, tx), lerp(f.cos[i01]!, f.cos[i11]!, tx), ty);
  let cy =
    lerp(lerp(f.sin[i00]!, f.sin[i10]!, tx), lerp(f.sin[i01]!, f.sin[i11]!, tx), ty);
  const m = Math.hypot(cx, cy) || 1;
  cx /= m;
  cy /= m;
  out[0] = cx;
  out[1] = cy;
}
