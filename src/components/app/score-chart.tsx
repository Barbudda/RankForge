import type { ScoreTrendPoint } from "@/types";

/**
 * Minimal dependency-free SVG area chart for the score trend.
 * Server-rendered; scales to its container width via viewBox.
 */
export function ScoreChart({
  data,
  height = 140,
}: {
  data: ScoreTrendPoint[];
  height?: number;
}) {
  const width = 600;
  const pad = 8;

  // Guard degenerate inputs: 0 points → nothing to draw; 1 point → no span,
  // so `i/(length-1)` would be 0/0 = NaN. Both would poison the SVG.
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-subtle">
        Not enough audits yet to chart a trend.
      </p>
    );
  }

  const min = Math.min(...data.map((d) => d.score)) - 6;
  const max = Math.max(...data.map((d) => d.score)) + 4;
  const range = Math.max(1, max - min);
  const span = Math.max(1, data.length - 1); // never divide by zero

  const points = data.map((d, i) => {
    const x =
      data.length === 1 ? width / 2 : pad + (i / span) * (width - pad * 2);
    const y = pad + (1 - (d.score - min) / range) * (height - pad * 2);
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="SEO score trend over time"
      >
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-electric)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-electric)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#scoreFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-electric)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--color-bg)"
            stroke="var(--color-electric-bright)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between px-1 text-xs text-fg-subtle">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
