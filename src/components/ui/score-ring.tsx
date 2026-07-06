import { scoreColor, scoreGrade } from "@/lib/scoring";
import { cn } from "@/lib/utils";

/** SVG circular score gauge (0–100). Server-rendered, accessible. */
export function ScoreRing({
  score,
  size = 96,
  stroke = 8,
  showGrade = true,
  className,
  label = "SEO score",
}: {
  score: number;
  size?: number;
  stroke?: number;
  showGrade?: boolean;
  className?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s var(--ease-out-expo)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-mono font-semibold tabular-nums leading-none"
            style={{ fontSize: size * 0.26, color }}
          >
            {score}
          </div>
          {showGrade && (
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
              Grade {scoreGrade(score)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
