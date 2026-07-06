"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowRight, FileCode2, Link2, ScanLine } from "lucide-react";
import { CauseWeb } from "./dots/cause-web";

/**
 * Section 2 — "From crawl finding to mergeable diff."
 *
 * A horizontal transformation lane: a raw crawl finding enters on the left,
 * gets mapped to the template/source in the middle, and becomes a small,
 * reviewable diff on the right. A token travels the lane on scroll and
 * activates each stage; hovering a panel activates it too. Scroll-linked
 * (not autonomous) so it stays calm under prefers-reduced-motion. `initial`
 * props never branch on reduce, so the SSR markup is hydration-stable.
 */

const FINDING_BADGES = [
  { text: "duplicate <meta description> ×128", tone: "text-danger border-danger/30 bg-danger/[0.06]" },
  { text: "<title> not unique", tone: "text-amber border-amber/30 bg-amber/[0.06]" },
  { text: "/category/* templates", tone: "text-fg-muted border-border bg-surface/50" },
];

const MAP_URLS = ["/category/shoes", "/category/bags", "+126 URLs"];
const MAP_FILES = ["CategoryTemplate.tsx", "seo/meta.ts"];

// Each del/add pair resolves a finding above: the <title> pair fixes
// "<title> not unique"; the description pair fixes the duplicate-meta finding.
const DIFF_LINES: { sign: "ctx" | "del" | "add"; text: string }[] = [
  { sign: "ctx", text: "// CategoryTemplate.tsx" },
  { sign: "del", text: "<title>{page.name}</title>" },
  { sign: "add", text: "<title>{page.name} | {category.name} | Brand</title>" },
  { sign: "ctx", text: "// seo/meta.ts" },
  { sign: "del", text: "description: page.name" },
  { sign: "add", text: "description: categoryDescription(category)" },
];

const DIFF_SIGN = {
  ctx: "text-fg-subtle",
  del: "bg-danger/10 text-danger/90",
  add: "bg-signal/10 text-signal",
};

function StageHead({
  n,
  label,
  desc,
  active,
}: {
  n: string;
  label: string;
  desc: string;
  active: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={`grid size-6 place-items-center rounded-md border font-mono text-[11px] transition-colors duration-300 ${
            active
              ? "border-cyan/40 bg-cyan/10 text-cyan"
              : "border-border bg-surface text-fg-subtle"
          }`}
        >
          {n}
        </span>
        <h3 className="text-sm font-semibold text-fg">{label}</h3>
      </div>
      <p className="mt-2 text-sm text-fg-muted">{desc}</p>
    </div>
  );
}

export function FindingToDiffSection() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const [scrollStage, setScrollStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setScrollStage(v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
  });
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? scrollStage;

  const panelClass = (i: number) =>
    `relative rounded-xl border bg-surface/60 p-5 backdrop-blur-sm transition-colors duration-300 ${
      active >= i ? "border-cyan/40" : "border-border"
    }`;

  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-28">
      <CauseWeb
        variant="diff"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_88%,transparent)]"
      />
      <div className="container-rf relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            From crawl finding to mergeable diff.
          </h2>
          <p className="mt-4 text-fg-muted">
            The agent does more than report an issue. It traces the cause,
            locates the right template or content source, and prepares a
            reviewable change.
          </p>
        </div>

        {/* Three transformation panels */}
        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-3">
          {/* 1 — Crawl finding */}
          <div
            className={panelClass(0)}
            onMouseEnter={() => setHover(0)}
            onMouseLeave={() => setHover(null)}
          >
            <StageHead
              n="01"
              label="Crawl finding"
              desc="Missing or duplicated metadata detected across product category pages."
              active={active >= 0}
            />
            <div className="mt-4 space-y-2">
              {FINDING_BADGES.map((b, i) => (
                <motion.div
                  key={b.text}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.1 + i * 0.1 }}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] ${b.tone}`}
                >
                  <ScanLine className="size-3 shrink-0 opacity-70" />
                  {b.text}
                </motion.div>
              ))}
            </div>
          </div>

          <LaneArrow active={active >= 1} />

          {/* 2 — Source mapping */}
          <div
            className={panelClass(1)}
            onMouseEnter={() => setHover(1)}
            onMouseLeave={() => setHover(null)}
          >
            <StageHead
              n="02"
              label="Source mapping"
              desc="Finds the template, CMS field, or component responsible for the repeated pattern."
              active={active >= 1}
            />
            <div className="relative mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="space-y-1.5">
                {MAP_URLS.map((u) => (
                  <div
                    key={u}
                    className="truncate rounded border border-border bg-surface/60 px-2 py-1 font-mono text-[11px] text-fg-muted"
                  >
                    {u}
                  </div>
                ))}
              </div>
              <svg className="h-16 w-8" viewBox="0 0 32 64" fill="none" aria-hidden>
                {["M0,12 C18,12 14,20 32,20", "M0,32 C18,32 14,20 32,20", "M0,52 C18,52 16,44 32,44"].map(
                  (d, i) => (
                    <motion.path
                      key={i}
                      d={d}
                      stroke="var(--color-cyan)"
                      strokeWidth="1"
                      strokeOpacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: reduce || active >= 1 ? 1 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08 }}
                    />
                  ),
                )}
              </svg>
              <div className="space-y-1.5">
                {MAP_FILES.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-1.5 rounded border border-electric/30 bg-electric/[0.06] px-2 py-1 font-mono text-[11px] text-electric-bright"
                  >
                    <FileCode2 className="size-3 shrink-0" />
                    <span className="truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <LaneArrow active={active >= 2} />

          {/* 3 — Safe diff */}
          <div
            className={panelClass(2)}
            onMouseEnter={() => setHover(2)}
            onMouseLeave={() => setHover(null)}
          >
            <StageHead
              n="03"
              label="Safe diff"
              desc="Generates a minimal change your team can inspect, edit, and merge."
              active={active >= 2}
            />
            <motion.div
              className="mt-4 overflow-hidden rounded-md border border-border bg-code font-mono text-[11px] leading-relaxed"
              initial="hidden"
              animate={reduce || active >= 2 ? "show" : "hidden"}
              variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
            >
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-[11px] text-fg-subtle">
                <Link2 className="size-3" />
                seo/fix-category-metadata
              </div>
              <div className="px-1 py-2">
                {DIFF_LINES.map((l, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, x: -6 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className={`flex gap-2 px-2 py-0.5 ${DIFF_SIGN[l.sign]}`}
                  >
                    <span className="select-none opacity-60">
                      {l.sign === "add" ? "+" : l.sign === "del" ? "-" : " "}
                    </span>
                    <span className="whitespace-pre-wrap break-all">{l.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LaneArrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center py-1 lg:py-0">
      <ArrowRight
        className={`size-5 rotate-90 transition-colors duration-300 lg:rotate-0 ${
          active ? "text-cyan" : "text-fg-subtle/50"
        }`}
      />
    </div>
  );
}
