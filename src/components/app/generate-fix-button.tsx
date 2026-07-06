"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Loader2 } from "lucide-react";
import { generateFix } from "@/lib/agents/actions";

/**
 * Generates a fix for one issue and refreshes to show the diff. Mechanical
 * issues get a deterministic patch (no key); judgment-heavy issues use the
 * LLM fix pipeline (API key / local model / CLI) and hint when none is set.
 */
export function GenerateFixButton({
  issueId,
  hasFix,
}: {
  issueId: string;
  hasFix: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await generateFix(issueId);
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Fix generation failed.");
    } catch {
      setErr("Fix generation failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-xs text-danger">{err}</span>}
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-fg transition-colors hover:border-electric/50 hover:bg-surface disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Wand2 className="size-4" />
        )}
        {loading ? "Generating…" : hasFix ? "Regenerate fix" : "Generate fix"}
      </button>
    </div>
  );
}
