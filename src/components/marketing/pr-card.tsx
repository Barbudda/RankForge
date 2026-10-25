"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLiquidRefraction } from "@/components/ui/liquid-refraction";
import { Check, ChevronRight, GitPullRequest, X } from "lucide-react";

/**
 * The comment Septune's GitHub Action posts on a pull request: the
 * preview compared with production, page by page. Every line below is what
 * `septune diff --markdown` really prints for this change, so the hero
 * shows the product, not a mock-up of a promise.
 */
const CHANGES = [
  { level: "critical", text: "/pricing became noindex (robots meta tag)" },
  { level: "warning", text: "/docs canonical changed to /docs/v2" },
] as const;

export function PrCheckCard({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const glass = useRef<HTMLDivElement>(null);
  useLiquidRefraction(glass, { bezel: 22, thickness: 26, blur: 14 });

  return (
    <motion.div
      className={className}
      // Transform-only entrance: the card is visible in server HTML (opacity
      // stays 1), so the hero's likely LCP element paints before hydration
      // and merely settles into place once JS arrives.
      initial={{ y: 30, rotateX: 8 }}
      animate={{ y: 0, rotateX: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <div ref={glass} className="lg rounded-2xl">
        {/* The pull request */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <GitPullRequest className="size-4 shrink-0 text-signal" />
          <span className="truncate text-sm font-medium text-fg">refactor: move pricing into the new layout</span>
          <span className="ml-auto shrink-0 font-mono text-xs text-fg-subtle">#412</span>
        </div>

        {/* The check */}
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs">
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-danger/15">
            <X className="size-2.5 text-danger" />
          </span>
          <span className="whitespace-nowrap font-medium text-fg">Septune SEO check</span>
          <span className="hidden whitespace-nowrap text-fg-subtle sm:inline">preview vs production</span>
          <span className="ml-auto shrink-0 rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger">
            Failing
          </span>
        </div>

        {/* The comment */}
        <div className="mx-4 mb-3 overflow-hidden rounded-md border border-border bg-code text-[12px] leading-relaxed">
          <div className="border-b border-border px-3 py-2">
            <p className="font-semibold text-fg">
              Septune · Critical: 1 critical change: /pricing became noindex (robots meta tag)
            </p>
            <p className="mt-1 text-fg-muted">
              Compared <span className="font-mono text-fg">preview-412.acme.dev</span> with{" "}
              <span className="font-mono text-fg">acme.com</span>. Score 91 → 84.
            </p>
          </div>
          <ul className="divide-y divide-border font-mono text-[11.5px]">
            {CHANGES.map((c) => (
              <li key={c.text} className="flex gap-3 px-3 py-1.5">
                <span className={c.level === "critical" ? "w-14 shrink-0 font-semibold text-danger" : "w-14 shrink-0 text-amber"}>
                  {c.level}
                </span>
                <span className="text-fg-muted">{c.text}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border px-3 py-2 text-fg-muted">
            <p className="flex items-center gap-1.5">
              <Check className="size-3 text-signal" />
              Fixed: Pages missing a meta description
            </p>
            <p className="flex items-center gap-1.5 text-fg-subtle">
              <ChevronRight className="size-3" />
              3 differences that come from the environment, not the code
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-3 text-xs">
          <span className="text-fg-muted">Fix it before merging</span>
          <span className="lg-chip rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-molten-bright">
            /septune:check
          </span>
          <span className="ml-auto text-fg-subtle">Updates on every push</span>
        </div>
      </div>
    </motion.div>
  );
}
