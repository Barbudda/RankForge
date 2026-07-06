"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Terminal, X, Copy, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Use RankForge in your editor" — the discoverable entry point to the MCP
 * server. A developer working in the app naturally sees they can connect their
 * AI coding assistant (Claude Code, Cursor, VS Code, Windsurf) and have it run
 * RankForge's audit + fix their repo in place. Copy-paste setup per client.
 */

type ClientId = "claude" | "cursor" | "vscode" | "windsurf";

const CLIENTS: { id: ClientId; label: string }[] = [
  { id: "claude", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "windsurf", label: "Windsurf" },
];

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the code is still visible to select */
    }
  };
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-code p-3.5 pr-11 font-mono text-xs leading-relaxed text-fg-muted">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy"
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-md border border-border bg-surface text-fg-subtle transition-colors hover:text-fg"
      >
        {copied ? <Check className="size-3.5 text-signal" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

function snippetFor(client: ClientId, mcpUrl: string): { intro: string; code: string; lang?: string } {
  switch (client) {
    case "claude":
      return {
        intro: "Run this once, then ask Claude Code to audit your dev server:",
        code: `claude mcp add --transport http rankforge ${mcpUrl}`,
      };
    case "cursor":
      return {
        intro: "Add to .cursor/mcp.json (project) or ~/.cursor/mcp.json (global):",
        code: `{
  "mcpServers": {
    "rankforge": { "url": "${mcpUrl}" }
  }
}`,
      };
    case "vscode":
      return {
        intro: "Add to .vscode/mcp.json in your workspace:",
        code: `{
  "servers": {
    "rankforge": { "type": "http", "url": "${mcpUrl}" }
  }
}`,
      };
    case "windsurf":
      return {
        intro: "Add to ~/.codeium/windsurf/mcp_config.json:",
        code: `{
  "mcpServers": {
    "rankforge": { "serverUrl": "${mcpUrl}" }
  }
}`,
      };
  }
}

export function UseInEditorButton({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "ghost" | "inline";
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState<ClientId>("claude");
  const [mcpUrl, setMcpUrl] = useState("http://localhost:3000/api/mcp");
  const [isLocal, setIsLocal] = useState(true);

  // Compute the endpoint from the live origin when the dialog opens, so it's
  // correct on localhost and on a deployed URL alike (no SSR/hydration branch).
  const openDialog = () => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setMcpUrl(`${origin}/api/mcp`);
      setIsLocal(/localhost|127\.0\.0\.1/.test(origin));
    }
    setOpen(true);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const snippet = snippetFor(client, mcpUrl);

  const triggerClass =
    variant === "solid"
      ? "inline-flex h-9 items-center gap-2 rounded-lg bg-electric px-3.5 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
      : variant === "ghost"
        ? "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface/60 px-3.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
        : "inline-flex items-center gap-1.5 text-sm font-medium text-electric-bright hover:underline";

  return (
    <>
      <button type="button" onClick={openDialog} className={cn(triggerClass, className)}>
        <Terminal className="size-4" />
        Use in your editor
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="use-in-editor-title"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="z-[120] m-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-elevated p-0 text-fg shadow-2xl shadow-black/50 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div>
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-electric/30 bg-electric/[0.08]">
                <Terminal className="size-4 text-electric-bright" />
              </span>
              <div className="flex-1">
                <h2 id="use-in-editor-title" className="text-sm font-semibold text-fg">
                  Use RankForge in your editor
                </h2>
                <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">
                  Connect your AI coding assistant over MCP. It runs RankForge&apos;s
                  audit against your dev server and fixes the issues right in your
                  repo.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Endpoint */}
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">
                Your RankForge MCP endpoint
              </label>
              <CopyBlock code={mcpUrl} />

              {/* Client tabs */}
              <div className="mt-5 flex gap-1 rounded-lg border border-border bg-surface/50 p-1">
                {CLIENTS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClient(c.id)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                      client === c.id
                        ? "bg-electric/15 text-electric-bright"
                        : "text-fg-subtle hover:text-fg",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-fg-muted">{snippet.intro}</p>
              <div className="mt-2">
                <CopyBlock code={snippet.code} />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface/40 p-3 text-xs text-fg-subtle">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-signal" />
                {isLocal ? (
                  <span>
                    Then prompt it:{" "}
                    <span className="text-fg-muted">
                      &ldquo;Use rankforge to audit http://localhost:3000 and fix
                      what you find.&rdquo;
                    </span>{" "}
                    The audit only reads your rendered pages; nothing reaches your
                    repo without you merging a pull request.
                  </span>
                ) : (
                  <span>
                    This hosted instance audits <span className="text-fg-muted">public
                    URLs</span> (it can&apos;t reach your localhost). Prompt it:{" "}
                    <span className="text-fg-muted">
                      &ldquo;Use rankforge to audit https://your-site.com and fix
                      what you find.&rdquo;</span>{" "}
                    To audit a local dev server, run RankForge on your machine.
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Link
                  href="/docs/agent"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-electric-bright hover:underline"
                >
                  Full guide
                  <ArrowRight className="size-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
