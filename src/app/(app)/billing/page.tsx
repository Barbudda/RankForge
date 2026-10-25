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
import { getBillingState } from "@/lib/billing/state";
import { billingReady } from "@/lib/billing/stripe";
import { openBillingPortal, startCheckout } from "@/lib/billing/actions";
import type { PaidPlan } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

const NOTICES: Record<string, { tone: "signal" | "amber" | "danger"; text: string }> = {
  success: { tone: "signal", text: "Thanks! Your plan switches over as soon as Stripe confirms the payment, usually within a few seconds. Refresh if it hasn't yet." },
  cancel: { tone: "amber", text: "Checkout cancelled. Nothing was charged." },
  unavailable: { tone: "amber", text: "Payments aren't switched on yet. Your current plan keeps working." },
  signin: { tone: "amber", text: "Sign in again to manage your subscription." },
  price: { tone: "danger", text: "This plan has no price set up in Stripe yet. Nothing was charged; please try again later." },
  stripe: { tone: "danger", text: "Stripe didn't answer as expected. Nothing was charged; please try again in a minute." },
};

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function statusLine(status: string | null, periodEnd: string | null, cancelAt: string | null): string | null {
  if (status === "past_due") return "The last payment failed. Stripe will retry; update your card in the billing portal to keep your plan.";
  if (cancelAt) return `Cancelled: your plan stays active until ${date(cancelAt)}.`;
  if ((status === "active" || status === "trialing") && periodEnd) return `Renews on ${date(periodEnd)}.`;
  if (status === "incomplete") return "The first payment needs confirmation. Open the billing portal to finish it.";
  return null;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const notice = NOTICES[one("checkout") ?? one("billing_error") ?? ""];
  const wanted = one("plan");

  const [workspace, monitoring, billing] = await Promise.all([
    getCurrentWorkspace(),
    getMonitoringOverview(),
    getBillingState(),
  ]);
  const stored = workspace.plan;
  const current = effectivePlan(stored);
  const tier = PRICING_TIERS.find((t) => t.id === current)!;
  const limits = PLAN_LIMITS[current];
  const ready = billingReady();
  const subscribed = billing.hasCustomer && current !== "free";
  const status = statusLine(billing.status, billing.periodEnd, billing.cancelAt);

  const usage = [
    { label: "Sites monitored", used: monitoring.enabledCount, total: limits.sites },
    { label: "Check frequency", used: null, total: limits.frequency },
    { label: "Pages per check", used: null, total: limits.pages },
    { label: "Alert channels", used: null, total: limits.webhooks ? "email, Slack, Discord, webhook" : "email" },
  ];

  return (
    <>
      <PageHeader title="Billing" description="Your plan, what it includes, and how many sites it watches." />

      {notice && (
        <div
          role="status"
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            notice.tone === "signal" && "border-signal/30 bg-signal/[0.06] text-fg",
            notice.tone === "amber" && "border-amber/30 bg-amber/[0.06] text-fg",
            notice.tone === "danger" && "border-danger/30 bg-danger/[0.06] text-fg",
          )}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{subscribed ? "Your subscription" : "Your plan"}</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-fg">{tier.name}</span>
              <Badge tone={billing.status === "past_due" ? "amber" : "molten"}>
                {billing.status === "past_due" ? "Payment due" : "Active"}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-fg-subtle">
              €{tier.priceMonthly} / month
            </div>
            {status && <p className="mt-3 text-sm text-fg-muted">{status}</p>}
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/40 p-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-fg-subtle" />
              <p className="text-sm text-fg-muted">{BILLING_NOTE}</p>
            </div>
            {ready && billing.hasCustomer && (
              <form action={openBillingPortal} className="mt-4">
                <Button type="submit" variant="secondary" size="sm">
                  Manage billing
                </Button>
              </form>
            )}
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
            const paid = t.id !== "free";
            return (
              <Card
                key={t.id}
                className={cn(
                  "flex flex-col p-5",
                  isCurrent && "border-molten/50 bg-molten/[0.05]",
                  !isCurrent && wanted === t.id && "border-cyan/50",
                )}
              >
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
                {isCurrent ? (
                  <span className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-fg-subtle">
                    Current plan
                  </span>
                ) : ready && paid && !subscribed ? (
                  <form action={startCheckout.bind(null, t.id as PaidPlan)} className="mt-5">
                    <Button type="submit" variant="primary" size="sm" className="w-full">
                      Upgrade to {t.name}
                    </Button>
                  </form>
                ) : ready && subscribed ? (
                  <form action={openBillingPortal} className="mt-5">
                    <Button type="submit" variant="secondary" size="sm" className="w-full">
                      {paid ? `Switch to ${t.name}` : "Cancel in the billing portal"}
                    </Button>
                  </form>
                ) : !BILLING_OPEN && paid ? (
                  <Button href={`/preorder?plan=${t.id}&source=billing`} variant="secondary" size="sm" className="mt-5 w-full">
                    Pre-order {t.name}
                  </Button>
                ) : (
                  <span className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-fg-subtle">
                    Available soon
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
          title={billing.hasCustomer && ready ? "Invoices live in the billing portal" : "No invoices yet"}
          description={
            billing.hasCustomer && ready
              ? "Every invoice and receipt, downloadable as PDF, along with your card and billing details."
              : BILLING_OPEN
                ? "Invoices appear after your first payment."
                : "Nothing to pay: paid plans open soon."
          }
          action={
            billing.hasCustomer && ready ? (
              <form action={openBillingPortal}>
                <Button type="submit" variant="secondary" size="sm">
                  Open the billing portal
                </Button>
              </form>
            ) : (
              <Button href="/pricing" variant="secondary" size="sm">
                View plans
              </Button>
            )
          }
        />
      </div>
    </>
  );
}
