import { Brain } from "lucide-react";
import { brainStats } from "@/lib/brain";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const KIND_LABEL: Record<string, string> = {
  fact: "Facts",
  audit: "Audits",
  issue: "Issues",
  fix: "Fixes",
  note: "Notes",
  learning: "Learnings",
};

/**
 * Shows RankForge's brain at a glance — how many memories it holds and their
 * breakdown. The memory grows as audits run and fixes are generated, and is
 * recalled to ground every audit, fix, and chatbot answer.
 */
export async function BrainCard() {
  const { total, byKind } = await brainStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-4 text-electric-bright" />
          Brain
        </CardTitle>
        <CardDescription>
          Semantic memory RankForge learns from — recalled to ground every
          audit, fix and chat. Works offline, no API key needed.
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums text-fg">
            {total}
          </span>
          <span className="text-sm text-fg-subtle">memories</span>
        </div>
        {total > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(byKind)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-fg-muted"
                >
                  {KIND_LABEL[k] ?? k}
                  <span className="font-mono text-fg">{n}</span>
                </span>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">
            Empty for now — run an audit and the brain starts remembering what it
            finds and fixes, then recalls it next time.
          </p>
        )}
      </div>
    </Card>
  );
}
