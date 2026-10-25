import Link from "next/link";
import { Terminal, ArrowRight, Wand2, Search, FileCode2 } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { FlowField } from "./dots/flow-field-layer";

/**
 * "In your editor" — showcases the MCP integration for prospects. A terminal
 * mock shows the one-line connect + a realistic agent exchange, so it's
 * immediately obvious Septune lives where developers already work.
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
            <span className="inline-flex items-center gap-2 lg lg-thin rounded-full px-3 py-1 text-xs font-medium text-fg-muted">
              <Terminal className="size-3.5 text-molten-bright" />
              Model Context Protocol
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Fix it before you push
            </h2>
            <p className="mt-4 text-fg-muted">
              Install the Claude Code plugin, or connect any MCP client. Your
              assistant audits your dev server, fixes the issues in the
              repository you already have open, then compares your version with
              production. Septune measures; your assistant writes the code.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Search className="mt-0.5 size-4 shrink-0 text-cyan" />
                <span className="text-fg-muted">
                  <span className="text-fg">Audits localhost.</span> No deploy, no
                  waiting. See issues as you build.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Wand2 className="mt-0.5 size-4 shrink-0 text-signal" />
                <span className="text-fg-muted">
                  <span className="text-fg">Fixes in place:</span> your assistant
                  edits the real files and you review the diff.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileCode2 className="mt-0.5 size-4 shrink-0 text-molten-bright" />
                <span className="text-fg-muted">
                  <span className="text-fg">Deterministic measurements.</span> Every
                  score comes from the crawl itself, with the URLs to prove it.
                </span>
              </li>
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/docs/agent"
                className="lg lg-molten inline-flex h-11 items-center gap-2 px-5 text-sm font-medium rounded-full transition-[filter] hover:brightness-110"
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
            <div className="lg overflow-hidden rounded-2xl">
              <div className="border-b border-white/10 px-4 py-2.5">
                <span className="font-mono text-[11px] text-fg-subtle">
                  ~/my-app · claude code
                </span>
              </div>
              <div className="space-y-3 p-5 font-mono text-[12.5px] leading-relaxed">
                <div className="text-fg-subtle">
                  <span className="text-signal">›</span> /plugin install
                  septune@septune
                </div>
                <div className="text-fg-muted">
                  <span className="text-signal">✓</span> Installed{" "}
                  <span className="text-fg">septune</span> (8 tools, 2 skills)
                </div>
                <div className="pt-1 text-molten-bright">› /septune:seo</div>
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
                  <div>
                    <span className="text-cyan">compare_sites</span> → no critical
                    change vs production
                  </div>
                </div>
                <div className="text-fg-muted">
                  Fixed 6 issues across 3 files. Ready to push.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
