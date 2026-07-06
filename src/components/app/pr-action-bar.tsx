"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, GitMerge } from "lucide-react";
import type { PullRequestStatus } from "@/types";
import { GithubIcon } from "@/components/brand/github-icon";
import { createPullRequest } from "@/lib/data/actions";

/**
 * "Create / open on GitHub" flow. When `issueId` is provided (PR preview of
 * an issue's fix), the button persists a real pull_requests row via the
 * createPullRequest server action; on an existing PR it links out to GitHub.
 */
export function PrActionBar({
  status,
  url,
  issueId,
}: {
  status: PullRequestStatus;
  url: string | null;
  issueId?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "creating" | "created">(
    issueId ? "idle" : "created",
  );
  const [error, setError] = useState<string | null>(null);

  if (status === "merged") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-violet/30 bg-violet/10 px-4 py-3 text-sm text-violet">
        <GitMerge className="size-4" />
        Merged into the default branch.
      </div>
    );
  }

  const create = async () => {
    if (!issueId) return;
    setState("creating");
    setError(null);
    const res = await createPullRequest(issueId);
    if (res.ok) {
      setState("created");
      router.refresh();
    } else {
      setState("idle");
      setError(res.error ?? "Could not create the pull request.");
    }
  };

  return (
    <div className="space-y-3">
      <button
        disabled={state === "creating"}
        onClick={() => {
          if (state === "idle") void create();
          else if (state === "created" && url) window.open(url, "_blank");
        }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-70"
      >
        {state === "creating" && <Loader2 className="size-4 animate-spin" />}
        {state === "created" && <Check className="size-4" />}
        {state === "idle" && <GithubIcon className="size-4" />}
        {state === "idle" && "Create pull request"}
        {state === "creating" && "Creating branch & PR…"}
        {state === "created" && (url ? "View on GitHub" : "PR created (simulated)")}
      </button>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {state === "created" && (
        <p className="flex items-center gap-1.5 text-xs text-signal">
          <Check className="size-3.5" />
          {url
            ? "Pull request is open and ready for review."
            : "Branch and PR prepared. Connect GitHub to push for real."}
        </p>
      )}
      {state === "idle" && (
        <p className="text-xs text-fg-subtle">
          Opens a branch-scoped PR. Nothing is committed to your default branch.
        </p>
      )}
    </div>
  );
}
