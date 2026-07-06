import { cn } from "@/lib/utils";
import type { Effort, Risk, Severity } from "@/types";
import { EFFORT_LABEL, RISK_LABEL, SEVERITY_META } from "@/lib/seo/constants";

export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "electric" | "cyan" | "signal" | "violet" | "amber" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "border-border bg-surface text-fg-muted",
    electric: "border-electric/30 bg-electric/10 text-electric-bright",
    cyan: "border-cyan/30 bg-cyan/10 text-cyan",
    signal: "border-signal/30 bg-signal/10 text-signal",
    violet: "border-violet/30 bg-violet/10 text-violet",
    amber: "border-amber/30 bg-amber/10 text-amber",
    danger: "border-danger/30 bg-danger/10 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Colored dot + label for an issue impact/severity. */
export function SeverityBadge({ impact }: { impact: Severity }) {
  const meta = SEVERITY_META[impact];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function EffortBadge({ effort }: { effort: Effort }) {
  return (
    <Badge tone="neutral" className="font-normal">
      {EFFORT_LABEL[effort]}
    </Badge>
  );
}

export function RiskBadge({ risk }: { risk: Risk }) {
  const tone = risk === "high" ? "danger" : risk === "medium" ? "amber" : "signal";
  return (
    <Badge tone={tone} className="font-normal">
      {RISK_LABEL[risk]}
    </Badge>
  );
}
