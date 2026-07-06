import { Check } from "lucide-react";
import Link from "next/link";
import { PRICING_TIERS } from "@/lib/pricing";
import { Reveal, RevealGroup, RevealItem } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";
import { FlowField } from "./dots/flow-field-layer";

export function PricingSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <section id="pricing" className={cn("relative overflow-hidden", standalone ? "py-16" : "py-24 md:py-28")}>
      <FlowField
        variant="pricing"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_88%,transparent)]"
      />
      <div className="container-rf relative z-10">
        {!standalone && (
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Plans that scale from solo to agency
            </h2>
            <p className="mt-4 text-fg-muted">
              Start free. Upgrade when RankForge is opening more pull requests
              than you can merge.
            </p>
          </Reveal>
        )}

        <RevealGroup
          className={cn(
            "grid gap-5 lg:grid-cols-4",
            standalone ? "mt-4" : "mt-14",
          )}
        >
          {PRICING_TIERS.map((tier) => (
            <RevealItem
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                tier.highlight
                  ? "border-electric/50 bg-electric/[0.06] glow-electric"
                  : "border-border bg-surface/60",
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-electric px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-base font-semibold text-fg">{tier.name}</h3>
              <p className="mt-1 text-sm text-fg-muted">{tier.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                {tier.priceMonthly === null ? (
                  <span className="text-3xl font-semibold text-fg">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold text-fg">
                      €{tier.priceMonthly}
                    </span>
                    <span className="text-sm text-fg-subtle">/mo</span>
                  </>
                )}
              </div>

              {tier.ctaHref?.startsWith("mailto:") ? (
                <a
                  href={tier.ctaHref}
                  className={cn(
                    "mt-5 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
                    "border border-border text-fg hover:border-electric/50 hover:bg-surface",
                  )}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaHref ?? "/dashboard"}
                  className={cn(
                    "mt-5 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
                    tier.highlight
                      ? "bg-electric text-white hover:bg-electric-bright"
                      : "border border-border text-fg hover:border-electric/50 hover:bg-surface",
                  )}
                >
                  {tier.cta}
                </Link>
              )}

              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-fg-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    {f}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-8 text-center text-xs text-fg-subtle">
          Prices are placeholders for this MVP. No credit card required to run
          your first audit.
        </p>
      </div>
    </section>
  );
}
