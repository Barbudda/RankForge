import Link from "next/link";
import { BILLING_NOTE, PRICING_TIERS, ROADMAP } from "@/lib/pricing";
import { Reveal, RevealGroup, RevealItem } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";
import { FlowField } from "./dots/flow-field-layer";

export function PricingSection({ standalone = false }: { standalone?: boolean }) {
  // On /pricing the page's h1 stands in for the section h2, so plan names
  // move up a level and the outline doesn't skip one.
  const PlanHeading = standalone ? "h2" : "h3";
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
              Free on your machine. Paid when Septune keeps watch.
            </h2>
            <p className="mt-4 text-fg-muted">
              Audits, the editor agent and the CI gate cost nothing. You pay for
              Septune checking your production sites every day and telling you
              when a deploy breaks something.
            </p>
          </Reveal>
        )}

        <RevealGroup className={cn("grid gap-5 lg:grid-cols-3", standalone ? "mt-4" : "mt-14")}>
          {PRICING_TIERS.map((tier) => {
            const external = /^https?:\/\//.test(tier.ctaHref);
            const ctaClass = cn(
              "mt-5 inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
              tier.highlight ? "lg lg-molten" : "lg lg-thin text-fg",
            );
            return (
              <RevealItem
                key={tier.id}
                className={cn("lg flex flex-col rounded-2xl border p-6", tier.highlight ? "border-molten/50" : "border-transparent")}
              >
                <PlanHeading className="text-base font-semibold text-fg">{tier.name}</PlanHeading>
                <p className="mt-1 text-sm text-fg-muted">{tier.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-fg">€{tier.priceMonthly}</span>
                  <span className="text-sm text-fg-subtle">/mo</span>
                </div>

                {external ? (
                  <a href={tier.ctaHref} className={ctaClass}>
                    {tier.cta}
                  </a>
                ) : (
                  <Link href={tier.ctaHref} className={ctaClass}>
                    {tier.cta}
                  </Link>
                )}

                <ul className="mt-6 space-y-2 border-t border-border pt-5 text-sm text-fg-muted">
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-fg-subtle">{BILLING_NOTE}</p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-fg-subtle">
          Not available yet, and not included in any plan until it ships: {ROADMAP.join(", ")}.
        </p>
      </div>
    </section>
  );
}
