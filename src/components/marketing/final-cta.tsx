import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { Reveal } from "@/components/animations/reveal";
import { CrawlerSwarm } from "./dots/crawler-swarm";

/**
 * Slim mid-page conversion row — catches readers right after the PR-assembly
 * payoff, and gives mobile (where the nav CTA is hidden) a reachable CTA
 * before the pricing section.
 */
export function MidCta() {
  return (
    <section className="relative py-4">
      <div className="container-rf flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-6 font-medium text-fg transition-all hover:border-electric/50 hover:bg-surface/60"
        >
          <GithubIcon className="size-5" />
          Connect GitHub
          <ArrowRight className="size-4" />
        </Link>
        <p className="text-sm text-fg-subtle">
          Free first audit. No credit card.
        </p>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <CrawlerSwarm
        variant="finalcta"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
      />
      <div className="container-rf relative z-10">
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft p-10 text-center md:p-16">
          <div className="absolute inset-x-0 top-0 h-64 spotlight" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              From broken tags to{" "}
              <span className="text-signal">reviewable diffs</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-fg-muted">
              Connect your GitHub repo and let RankForge open the first pull
              request. Each one is small enough to read in a minute. Merge it
              when you&apos;re ready.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-electric px-6 font-medium text-white shadow-[0_10px_40px_-10px_var(--color-electric)] transition-all hover:bg-electric-bright"
              >
                <GithubIcon className="size-5" />
                Connect GitHub
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 font-medium text-fg transition-colors hover:border-electric/50 hover:bg-surface/60"
              >
                See pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
