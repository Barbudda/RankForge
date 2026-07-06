"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import {
  Check,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { CrawlerSwarm } from "./dots/crawler-swarm";

/**
 * Section 3 — "From scattered findings to a clean pull request."
 *
 * An assembly board: scattered SEO findings are grouped into focused
 * buckets, validated, and packaged into one reviewable pull request.
 * Scroll progress drives a five-step assembly; hovering a bucket
 * highlights the findings it contains and the files it touches.
 *
 * Hydration-safe: `step` starts at 0 on both server and first client render;
 * reduced-motion users jump to the fully-assembled state in a post-mount
 * effect and the scroll listener is disabled, so the board reads as complete
 * (not half-built) without motion. `initial` props never branch on reduce.
 */

const STEPS = [
  "Collect findings",
  "Group related issues",
  "Validate changes",
  "Assemble PR",
  "Ready for review",
];

type Bucket = {
  title: string;
  chips: string[];
  files: string[];
  check: string;
};

const BUCKETS: Bucket[] = [
  {
    title: "Category metadata",
    chips: ["duplicate meta ×128", "missing description", "title not unique"],
    files: ["CategoryTemplate.tsx", "seo/meta.ts"],
    check: "Titles unique per page",
  },
  {
    title: "Canonical rules",
    chips: ["canonical drift", "redirect chain", "trailing slash"],
    files: ["seo/meta.ts"],
    check: "Canonical rules preserved",
  },
  {
    title: "Structured data",
    chips: ["schema missing", "ItemList invalid"],
    files: ["schema/product-list.ts"],
    check: "Schema validated",
  },
];

const PR = {
  branch: "seo/fix-category-metadata",
  files: ["CategoryTemplate.tsx", "seo/meta.ts", "schema/product-list.ts"],
  affected: "128 category URLs",
  checks: [
    "Canonical rules preserved",
    "Titles unique per page",
    "Noindex pages excluded",
    "Schema validated",
  ],
  note: "Adds metadata fallbacks for category pages with missing descriptions and normalizes canonical generation.",
};

const CAPTIONS = [
  {
    icon: Layers,
    title: "Group related fixes",
    body: "Combine repeated issues by template, page type, or source instead of creating one task per URL.",
  },
  {
    icon: ShieldCheck,
    title: "Validate before review",
    body: "Check indexation rules, canonical behavior, title uniqueness, structured data, and affected URL scope.",
  },
  {
    icon: GitPullRequest,
    title: "Open a focused PR",
    body: "Produce a small, reviewable pull request with context, changed files, and SEO impact.",
  },
];

export function PrAssemblySection() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.55"],
  });

  // `step` is 0 on the server AND the first client render (no hydration drift).
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return; // motion-off users don't scroll-drive the assembly
    setStep(Math.min(4, Math.floor(v * 5)));
  });

  // Reduced-motion users see the fully-assembled board, but only AFTER mount,
  // so the first client render still matches the server (step 0). setState is
  // deferred into rAF to keep first render identical and avoid effect cascades.
  const [assembled, setAssembled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAssembled(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const effStep = reduce && assembled ? 4 : step;

  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const activeFiles = activeBucket !== null ? BUCKETS[activeBucket]!.files : [];

  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-28">
      <CrawlerSwarm
        variant="pr"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_92%,transparent)]"
      />
      <div className="container-rf relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            From scattered findings to a clean pull request.
          </h2>
          <p className="mt-4 text-fg-muted">
            Related SEO issues are grouped into focused changes, validated
            against risk, and packaged for review instead of dumped into a
            ticket backlog.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          {STEPS.map((s, i) => {
            const done = effStep > i;
            const current = effStep === i;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`grid size-5 place-items-center rounded-full border text-[10px] font-medium transition-colors duration-300 ${
                      done
                        ? "border-signal/50 bg-signal/15 text-signal"
                        : current
                          ? "border-cyan/50 bg-cyan/15 text-cyan"
                          : "border-border bg-surface text-fg-subtle"
                    }`}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span
                    className={`text-xs transition-colors duration-300 ${
                      current ? "text-fg" : "text-fg-subtle"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden h-px w-6 bg-border sm:block" />
                )}
              </div>
            );
          })}
        </div>

        {/* Board: grouping buckets + PR summary */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          {/* Buckets */}
          <div className="grid gap-3 sm:grid-cols-3">
            {BUCKETS.map((b, bi) => {
              const grouped = effStep >= 1;
              const validated = effStep >= 2;
              const isActive = activeBucket === bi;
              return (
                <div
                  key={b.title}
                  onMouseEnter={() => setActiveBucket(bi)}
                  onMouseLeave={() => setActiveBucket(null)}
                  className={`rounded-xl border bg-surface/60 p-4 backdrop-blur-sm transition-colors duration-300 ${
                    isActive
                      ? "border-cyan/45"
                      : grouped
                        ? "border-border"
                        : "border-dashed border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold text-fg">{b.title}</h3>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{
                        opacity: validated ? 1 : 0,
                        scale: validated ? 1 : 0.6,
                      }}
                      transition={{ duration: reduce ? 0 : 0.3 }}
                      className="grid size-4 place-items-center rounded-full bg-signal/15"
                    >
                      <Check className="size-2.5 text-signal" />
                    </motion.span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {b.chips.map((c, ci) => (
                      <motion.div
                        key={c}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.05 * ci + 0.1 * bi }}
                        className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors duration-300 ${
                          isActive
                            ? "border-cyan/30 bg-cyan/[0.06] text-cyan/90"
                            : "border-border bg-surface/50 text-fg-muted"
                        }`}
                      >
                        {c}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PR summary panel */}
          <div
            className={`rounded-xl border bg-surface/85 backdrop-blur-md transition-colors duration-300 ${
              effStep >= 4 ? "border-signal/40" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <GitPullRequest className="size-4 text-signal" />
              <span className="text-sm font-medium text-fg">Pull request</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: effStep >= 4 ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
                className="ml-auto rounded-full bg-signal/15 px-2 py-0.5 text-[11px] font-medium text-signal"
              >
                Ready for review
              </motion.span>
            </div>

            <motion.div
              className="space-y-3 p-4 text-xs"
              initial="hidden"
              animate={effStep >= 3 ? "show" : "hidden"}
              variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
            >
              {/* Branch */}
              <PrRow icon={<GitBranch className="size-3.5 text-electric-bright" />} label="Branch">
                <span className="font-mono text-electric-bright">{PR.branch}</span>
              </PrRow>

              {/* Files */}
              <PrRow icon={<FileCode2 className="size-3.5 text-cyan" />} label="Files changed">
                <div className="flex flex-wrap gap-1.5">
                  {PR.files.map((f) => (
                    <span
                      key={f}
                      className={`rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors duration-300 ${
                        activeFiles.includes(f)
                          ? "border-cyan/45 bg-cyan/[0.08] text-cyan"
                          : "border-border text-fg-muted"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </PrRow>

              {/* Affected */}
              <PrRow icon={<Layers className="size-3.5 text-fg-subtle" />} label="Affected pages">
                <span className="font-mono text-fg-muted">{PR.affected}</span>
              </PrRow>

              {/* Checks */}
              <PrRow icon={<ShieldCheck className="size-3.5 text-signal" />} label="Checks">
                <div className="space-y-1">
                  {PR.checks.map((c) => (
                    <div key={c} className="flex items-center gap-1.5 text-fg-muted">
                      <span className="grid size-3.5 place-items-center rounded-full bg-signal/15">
                        <Check className="size-2 text-signal" />
                      </span>
                      {c}
                    </div>
                  ))}
                </div>
              </PrRow>

              {/* Note */}
              <motion.p
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                className="border-t border-border pt-3 text-fg-subtle"
              >
                {PR.note}
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Meaning captions */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {CAPTIONS.map((c) => (
            <div key={c.title} className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-fg-muted">
                <c.icon className="size-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-fg">{c.title}</h4>
                <p className="mt-1 text-sm text-fg-muted">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      className="grid grid-cols-[7rem_1fr] items-start gap-2"
    >
      <span className="flex items-center gap-1.5 text-fg-subtle">
        {icon}
        {label}
      </span>
      <div>{children}</div>
    </motion.div>
  );
}
