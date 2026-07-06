"use client";

import { Eye, FileCode2, GitPullRequestDraft, Zap, Rocket, Check, Lock } from "lucide-react";
import type { AgentMode } from "@/types";
import { AUTONOMY_LEVELS, RISK_ACCENT } from "@/lib/agent";
import { cn } from "@/lib/utils";

const ICONS: Record<AgentMode, typeof Eye> = {
  advisor: Eye,
  suggest: FileCode2,
  draft_pr: GitPullRequestDraft,
  auto_low_risk: Zap,
  autopilot: Rocket,
};

/**
 * The modification-autonomy ladder. A user picks how far RankForge may go on
 * a site — from plain advice (step 1) to full root autonomy (step 5). Steps up
 * to and including the selection are lit, conveying "how far up the spectrum".
 */
export function AutonomyLevelPicker({
  value,
  onChange,
  className,
}: {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
  className?: string;
}) {
  const selectedStep = AUTONOMY_LEVELS.find((l) => l.id === value)?.step ?? 1;

  return (
    <div className={cn("relative", className)}>
      {/* Connecting rail */}
      <div className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-border" />

      <div className="space-y-2">
        {AUTONOMY_LEVELS.map((level) => {
          const Icon = ICONS[level.id];
          const active = level.id === value;
          const lit = level.step <= selectedStep;
          const accent = RISK_ACCENT[level.risk];

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              aria-pressed={active}
              className={cn(
                "group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                active
                  ? "border-electric/50 bg-electric/[0.06]"
                  : "border-transparent hover:bg-surface/50",
              )}
            >
              {/* Step node */}
              <span
                className="relative z-10 mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: lit ? accent : "var(--color-border)",
                  backgroundColor: lit
                    ? `color-mix(in oklab, ${accent} 16%, transparent)`
                    : "var(--color-bg)",
                  color: lit ? accent : "var(--color-fg-subtle)",
                }}
              >
                <Icon className="size-4.5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-fg-subtle">
                    L{level.step}
                  </span>
                  <span className="text-sm font-semibold text-fg">
                    {level.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      color: level.writes ? accent : "var(--color-fg-subtle)",
                      borderColor: `color-mix(in oklab, ${level.writes ? accent : "var(--color-border)"} 45%, transparent)`,
                    }}
                  >
                    {level.writes ? "Writes to GitHub" : (
                      <>
                        <Lock className="size-2.5" /> Read-only
                      </>
                    )}
                  </span>
                  {active && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-electric-bright">
                      <Check className="size-3.5" />
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-fg-muted">{level.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spectrum legend */}
      <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-fg-subtle">
        <span>Just advice</span>
        <span className="h-px flex-1 mx-3 bg-gradient-to-r from-signal via-amber to-danger opacity-40" />
        <span>Root modification</span>
      </div>
    </div>
  );
}
