"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Radar, Network, ListChecks } from "lucide-react";
import { CrawlerSwarm } from "./dots/crawler-swarm";

/**
 * Section 1 — "Finding problems was never the hard part."
 *
 * A dark SEO crawl field: a living crawler [CrawlerSwarm] roams and converges
 * on the canvas behind the copy; three findings are surfaced from the noise on
 * the right. Hovering a finding lights its own accent; the swarm reacts to the
 * pointer on its own (banks away as a cohort).
 */

const FINDINGS = [
  {
    icon: Radar,
    title: "Surface real SEO issues",
    body: "Detect missing metadata, indexation problems, broken internal links, schema gaps, and performance regressions without drowning in raw crawl noise.",
    tags: ["<title>", "canonical", "LCP", "schema"],
    group: 0,
    offset: "lg:mr-12",
  },
  {
    icon: Network,
    title: "Connect cause and context",
    body: "Group related findings by template, page type, crawl path, and technical pattern instead of treating every URL as an isolated problem.",
    tags: ["by template", "by page type", "crawl path"],
    group: 1,
    offset: "lg:ml-16",
  },
  {
    icon: ListChecks,
    title: "Prioritize by impact",
    body: "Rank fixes by search impact, implementation effort, affected URLs, and risk, so the next action is obvious.",
    tags: ["impact", "effort", "URLs", "risk"],
    group: 2,
    offset: "lg:mr-4",
  },
];

export function ProblemSection() {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-24 md:py-28 lg:py-32">
      {/* Decorative crawl field */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid opacity-[0.4] [mask-image:radial-gradient(80%_60%_at_30%_30%,#000_20%,transparent_75%)]"
      />
      <CrawlerSwarm
        variant="problem"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bg"
      />

      <div className="container-rf relative z-10">
        <div className="grid items-start gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          {/* Heading — left, sticky on desktop */}
          <div className="lg:sticky lg:top-28">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Finding problems was never the hard part.
            </h2>
            <p className="mt-4 max-w-md text-fg-muted">
              Crawlers surface hundreds of warnings. RankForge&apos;s technical
              SEO agent connects symptoms, causes, and impact so your team
              knows what to fix first.
            </p>
          </div>

          {/* Findings — staggered, surfaced from the field */}
          <div className="flex flex-col gap-5">
            {FINDINGS.map((f, i) => {
              const isActive = active === f.group;
              return (
                <motion.div
                  key={f.title}
                  onMouseEnter={() => setActive(f.group)}
                  onMouseLeave={() => setActive(null)}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }
                  }
                  className={`group relative w-full overflow-hidden rounded-xl border bg-surface/70 p-6 backdrop-blur-md transition-colors duration-300 lg:max-w-xl ${f.offset} ${
                    isActive ? "border-cyan/45" : "border-border"
                  }`}
                >
                  {/* Left accent bar — lights when this finding is active */}
                  <span
                    className={`absolute inset-y-0 left-0 w-0.5 transition-colors duration-300 ${
                      isActive ? "bg-cyan" : "bg-transparent"
                    }`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-9 place-items-center rounded-lg border transition-colors duration-300 ${
                          isActive
                            ? "border-cyan/40 bg-cyan/10 text-cyan"
                            : "border-border bg-surface text-electric-bright"
                        }`}
                      >
                        <f.icon className="size-5" />
                      </span>
                      <h3 className="text-base font-semibold text-fg">{f.title}</h3>
                    </div>
                    <span className="font-mono text-[11px] text-fg-subtle">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-fg-muted">{f.body}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors duration-300 ${
                          isActive
                            ? "border-cyan/30 text-cyan/90"
                            : "border-border text-fg-subtle"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
