import Link from "next/link";
import { Terminal, ArrowRight, Wand2, Search, FileCode2 } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { FlowField } from "./dots/flow-field-layer";

/**
 * "In your editor" — showcases the MCP integration for prospects. A terminal
 * mock shows the one-line connect + a realistic agent exchange, so it's
 * immediately obvious RankForge lives where developers already work.
 */

const CLIENTS = ["Claude Code", "Cursor", "VS Code", "Windsurf"];

export function EditorSection() {
  return (
    <section id="editor" className="relative overflow-hidden py-24 md:py-28">
      <FlowField
        variant="frameworks"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_90%,transparent)]"
      />
      <div className="container-rf relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Copy */}
          <Reveal className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-fg-muted">
              <Terminal className="size-3.5 text-electric-bright" />
              Model Context Protocol
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Or bring RankForge into your editor
            </h2>
            <p className="mt-4 text-fg-muted">
              Connect the RankForge agent to your AI coding assistant. It runs
              the full technical-SEO audit against your dev server, then fixes
              the issues in the repository you already have open — measured by
              RankForge, applied by your assistant.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Search className="mt-0.5 size-4 shrink-0 text-cyan" />
                <span className="text-fg-muted">
                  <span className="text-fg">Audits localhost</span> — no deploy, no
                  waiting. See issues as you build.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Wand2 className="mt-0.5 size-4 shrink-0 text-signal" />
                <span className="text-fg-muted">
                  <span className="text-fg">Fixes in place</span> — your assistant
                  edits the real files and you review the diff.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileCode2 className="mt-0.5 size-4 shrink-0 text-electric-bright" />
                <span className="text-fg-muted">
                  <span className="text-fg">Deterministic measurements</span> — the
                  audit is real, not the model guessing.
                </span>
              </li>
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/docs/agent"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
              >
                Set it up
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-xs text-fg-subtle">
                Works with {CLIENTS.join(" · ")}
              </span>
            </div>
          </Reveal>

          {/* Terminal mock */}
          <Reveal>
            <div className="overflow-hidden rounded-xl border border-border bg-code shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-border bg-surface/70 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-danger/60" />
                <span className="size-2.5 rounded-full bg-amber/60" />
                <span className="size-2.5 rounded-full bg-signal/60" />
                <span className="ml-2 font-mono text-[11px] text-fg-subtle">
                  ~/my-app — claude code
                </span>
              </div>
              <div className="space-y-3 p-5 font-mono text-[12.5px] leading-relaxed">
                <div className="text-fg-subtle">
                  <span className="text-signal">$</span> claude mcp add --transport
                  http rankforge http://localhost:3000/api/mcp
                </div>
                <div className="text-fg-muted">
                  <span className="text-signal">✓</span> Added MCP server{" "}
                  <span className="text-fg">rankforge</span> (5 tools)
                </div>
                <div className="pt-1 text-electric-bright">
                  › Use rankforge to audit http://localhost:3000 and fix what you
                  can.
                </div>
                <div className="space-y-1.5 border-l-2 border-border pl-3 text-fg-muted">
                  <div>
                    <span className="text-cyan">audit_site</span> → 12 issues ·
                    indexing 76 · perf 96
                  </div>
                  <div className="text-signal">
                    + app/robots.ts, + app/sitemap.ts
                  </div>
                  <div className="text-signal">
                    ~ app/layout.tsx (viewport, lang, canonical)
                  </div>
                  <div>
                    <span className="text-cyan">audit_site</span> → re-check:
                    indexing <span className="text-signal">94</span> ▲
                  </div>
                </div>
                <div className="text-fg-muted">
                  Fixed 6 issues across 3 files. Opening a pull request for review.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
