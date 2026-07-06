"use client";

import { useState } from "react";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import type { AgentMode } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AutonomyLevelPicker } from "./autonomy-level-picker";
import { getAutonomyLevel } from "@/lib/agent";
import { setRepoAgentLevel } from "@/lib/data/actions";

/**
 * Per-repository modification level. Lets a user dial how far RankForge may go
 * on this specific site, overriding the workspace default. Persists via the
 * setRepoAgentLevel server action; only confirms "Updated" when it saved.
 */
export function RepoAutonomyControl({
  repoId,
  repoName,
  initial,
}: {
  repoId: string;
  repoName: string;
  initial: AgentMode;
}) {
  const [level, setLevel] = useState<AgentMode>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = getAutonomyLevel(level);

  const change = async (m: AgentMode) => {
    setLevel(m);
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await setRepoAgentLevel(repoId, m);
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Not saved — applies to this session only.");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Modification level for {repoName}</CardTitle>
            <CardDescription>
              How far RankForge may go on this site. Overrides the workspace
              default.
            </CardDescription>
          </div>
          <span
            role="status"
            aria-live="polite"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium"
          >
            {saving && (
              <span className="inline-flex items-center gap-1.5 text-fg-subtle">
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </span>
            )}
            {!saving && saved && !error && (
              <span className="inline-flex items-center gap-1.5 text-signal">
                <Check className="size-4" />
                Updated
              </span>
            )}
            {!saving && error && (
              <span className="text-fg-subtle">{error}</span>
            )}
          </span>
        </div>
      </CardHeader>

      <div className="px-5 pb-5">
        <AutonomyLevelPicker value={level} onChange={(m) => void change(m)} />

        {meta.id === "autopilot" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.06] p-4 text-xs text-fg-muted">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
            <span>
              Autopilot lets RankForge act across every category and path at the
              root. Even here, changes still arrive as pull requests you can
              review — RankForge never force-pushes to your default branch.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
