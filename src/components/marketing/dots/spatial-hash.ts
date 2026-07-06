/**
 * Uniform spatial-hash grid for O(n·k) neighbour queries (cell = neighbour
 * radius). Shared by CrawlerSwarm (boids) and CauseWeb (repulsion) so neither
 * needs an O(n²) all-pairs pass. Reuses its bins across frames (no per-frame
 * allocation beyond bin growth).
 */
export function createGrid() {
  let cols = 1;
  let cell = 1;
  const bins: number[][] = [];

  function rebuild(
    xs: Float32Array,
    ys: Float32Array,
    n: number,
    cellSize: number,
    w: number,
    h: number,
  ) {
    cell = Math.max(1, cellSize);
    cols = Math.max(1, Math.ceil(w / cell));
    const rows = Math.max(1, Math.ceil(h / cell));
    const need = cols * rows;
    for (let i = 0; i < need; i++) {
      if (bins[i]) bins[i]!.length = 0;
      else bins[i] = [];
    }
    bins.length = need;
    const maxCx = cols - 1;
    const maxCy = rows - 1;
    for (let i = 0; i < n; i++) {
      const cx = Math.min(maxCx, Math.max(0, (xs[i]! / cell) | 0));
      const cy = Math.min(maxCy, Math.max(0, (ys[i]! / cell) | 0));
      bins[cy * cols + cx]!.push(i);
    }
  }

  /** Call `cb(index)` for every point in the 3×3 cell block around (x,y). */
  function each(x: number, y: number, cb: (i: number) => void) {
    const rows = bins.length / cols;
    const cx = Math.min(cols - 1, Math.max(0, (x / cell) | 0));
    const cy = Math.min(rows - 1, Math.max(0, (y / cell) | 0));
    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= rows) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        if (nx < 0 || nx >= cols) continue;
        const bin = bins[ny * cols + nx]!;
        for (let k = 0; k < bin.length; k++) cb(bin[k]!);
      }
    }
  }

  /** Fill `out` with candidate indices from the 3×3 block; returns the count
   *  (capped at out.length). Closure-free — for hot per-agent loops. */
  function query(x: number, y: number, out: Int32Array): number {
    const rows = bins.length / cols;
    const cx = Math.min(cols - 1, Math.max(0, (x / cell) | 0));
    const cy = Math.min(rows - 1, Math.max(0, (y / cell) | 0));
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= rows) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        if (nx < 0 || nx >= cols) continue;
        const bin = bins[ny * cols + nx]!;
        for (let k = 0; k < bin.length; k++) {
          if (n >= out.length) return n;
          out[n++] = bin[k]!;
        }
      }
    }
    return n;
  }

  return { rebuild, each, query };
}
