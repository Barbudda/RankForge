import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-fg-muted">{label}</span>
        {icon && <span className="text-fg-subtle">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-fg">
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium",
              positive ? "text-signal" : "text-danger",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(delta)}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </Card>
  );
}
