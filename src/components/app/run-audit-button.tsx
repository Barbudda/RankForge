"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { runAudit } from "@/lib/agents/actions";

/**
 * Runs the deterministic audit on a repository (crawl + rule engine, plus an
 * optional LLM enrichment agent when configured) and refreshes with the
 * persisted results. try/catch/finally so a transport-level failure (timeout,
 * 500) surfaces an error instead of wedging the spinner forever.
 */
export function RunAuditButton({ repoId }: { repoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await runAudit(repoId);
      if (res.ok) {
        const work = res.agents ? `${res.agents} agents` : "deterministic";
        setMsg(`Score ${res.score} · ${res.issues} issues · ${work}`);
        router.refresh();
      } else {
        setMsg(res.error ?? "Audit failed.");
      }
    } catch {
      setMsg("Audit failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {loading ? "Running swarm…" : "Run audit"}
      </button>
      {msg && (
        <span className="max-w-[16rem] text-right text-[11px] text-fg-subtle">
          {msg}
        </span>
      )}
    </div>
  );
}
