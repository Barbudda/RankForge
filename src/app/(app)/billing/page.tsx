import type { Metadata } from "next";
import { CreditCard, Receipt } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { BILLING_NOTE, BILLING_OPEN, PLAN_LIMITS, PRICING_TIERS, effectivePlan } from "@/lib/pricing";
import { getCurrentWorkspace } from "@/lib/account";
import { getMonitoringOverview } from "@/lib/monitor/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const [workspace, monitoring] = await Promise.all([getCurrentWorkspace(), getMonitoringOverview()]);
  const stored = workspace.plan;
  const current = effectivePlan(stored);
  const tier = PRICING_TIERS.find((t) => t.id === current)!;
  const limits = PLAN_LIMITS[current];
  const beta = !BILLING_OPEN && stored === "free";

  const usage = [
    { label: "Sites monitored", used: monitoring.enabledCount, total: limits.sites },
    { label: "Check frequency", used: null, total: limits.frequency },
    { label: "Pages per check", used: null, total: limits.pages },
    { label: "Alert channels", used: null, total: limits.webhooks ? "email, Slack, Discord, webhook" : "email" },
  ];

  return (
    <>
      <PageHeader title="Billing" description="Your plan, what it includes, and how many sites it watches." />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{beta ? "Pro, free during the beta" : "Your subscription"}</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-fg">{tier.name}</span>
              <Badge tone="molten">{beta ? "Beta" : "Active"}</Badge>
            </div>
            <div className="mt-1 text-sm text-fg-subtle">
              {beta ? `€${tier.priceMonthly} / month once billing opens` : `€${tier.priceMonthly} / month`}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/40 p-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-fg-subtle" />
              <p className="text-sm text-fg-muted">{BILLING_NOTE}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What your plan includes</CardTitle>
          </CardHeader>
          <div className="space-y-4 px-5 pb-5">
            {usage.map((u) => (
              <div key={u.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-fg-muted">{u.label}</span>
                <span className="text-right font-mono text-fg">
                  {u.used !== null ? (
                    <>
                      {u.used} <span className="text-fg-subtle">/ {u.total}</span>
                    </>
                  ) : (
                    u.total
                  )}
                </span>
              </div>
            ))}
            <Button href="/monitoring" variant="secondary" size="sm">
              Manage monitoring
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-fg">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {PRICING_TIERS.map((t) => {
            const isCurrent = t.id === current;
            const canBuy = BILLING_OPEN && !isCurrent && t.ctaHref.startsWith("http");
            return (
              <Card key={t.id} className={cn("flex flex-col p-5", isCurrent && "border-molten/50 bg-molten/[0.05]")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-fg">{t.name}</h3>
                  {isCurrent && <Badge tone="molten">Current</Badge>}
                </div>
                <div className="mt-3 text-2xl font-semibold text-fg">
                  €{t.priceMonthly}
                  <span className="text-sm font-normal text-fg-subtle">/mo</span>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{t.tagline}</p>
                <ul className="mt-4 flex-1 space-y-1.5 border-t border-border pt-4 text-sm text-fg-muted">
                  {t.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {canBuy ? (
                  <Button href={t.ctaHref} variant="primary" size="sm" className="mt-5">
                    {t.cta}
                  </Button>
                ) : (
                  <span className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-fg-subtle">
                    {isCurrent ? "Current plan" : BILLING_OPEN ? "Contact us to switch" : "Opens with billing"}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-fg">Invoices</h2>
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="No invoices yet"
          description={BILLING_OPEN ? "Invoices appear here after your first payment." : "Nothing to pay during the beta."}
          action={
            <Button href="/pricing" variant="secondary" size="sm">
              View plans
            </Button>
          }
        />
      </div>
    </>
  );
}
