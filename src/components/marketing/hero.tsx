"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import Link from "next/link";
import { GeneratedPrCard } from "./pr-card";
import { FlowField } from "./dots/flow-field-layer";

const FRAMEWORKS = ["Next.js", "Nuxt", "Astro", "SvelteKit", "Remix", "MDX"];

export function Hero() {
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <FlowField
        variant="hero"
        className="[mask-image:linear-gradient(to_bottom,transparent_15%,#000_60%)] lg:[mask-image:linear-gradient(to_right,transparent,#000_55%)]"
      />
      <div className="container-rf relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: copy */}
          <motion.div
            initial={false}
            animate="show"
            transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
          >
            <motion.h1
              variants={item}
              initial={false}
              transition={{ duration: 0.6 }}
              className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl"
            >
              Squeeze every bit of SEO out of your site.{" "}
              <span className="text-signal">Automatically.</span>
            </motion.h1>

            <motion.p
              variants={item}
              initial={false}
              transition={{ duration: 0.6 }}
              className="mt-6 max-w-xl text-lg text-fg-muted"
            >
              RankForge crawls your live site, finds every technical SEO and
              performance issue, and opens small, reviewable pull requests that
              fix them. Connect your repo and let it do the busywork.
            </motion.p>

            <motion.div
              variants={item}
              initial={false}
              transition={{ duration: 0.6 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-electric px-6 font-medium text-white shadow-[0_10px_40px_-10px_var(--color-electric)] transition-all hover:bg-electric-bright active:translate-y-px"
              >
                <GithubIcon className="size-5" />
                Connect GitHub
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-6 font-medium text-fg transition-all hover:border-electric/50 hover:bg-surface/60"
              >
                See how it works
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              initial={false}
              transition={{ duration: 0.6 }}
              className="mt-10"
            >
              <p className="text-sm text-fg-subtle">
                Works with the frameworks your team already ships
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FRAMEWORKS.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1 text-sm text-fg-muted"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: generated PR card */}
          <div className="relative min-w-0">
            <GeneratedPrCard />
          </div>
        </div>
      </div>
    </section>
  );
}
