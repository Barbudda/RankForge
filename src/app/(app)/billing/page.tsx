import type { Metadata } from "next";
import { CreditCard, Check, Receipt } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS } from "@/lib/pricing";
import { getCurrentWorkspace } from "@/lib/account";
import { getRepositories, getPullRequests } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const [currentWorkspace, repositories, prs] = await Promise.all([
    getCurrentWorkspace(),
    getRepositories(),
    getPullRequests(),
  ]);
  const current = currentWorkspace.plan;
  const tier = PRICING_TIERS.find((t) => t.id === current);

  const usage = [
    { label: "Repositories", used: repositories.length, total: tier?.limits.repos ?? "—" },
    { label: "Pull requests", used: prs.length, total: tier?.limits.prs ?? "—" },
  ];

  return (
    <>
      <PageHeader
        title="Billing"
        description="Manage your plan, usage and invoices. Payments are handled by Stripe (connect your key to go live)."
      />

      {/* Current plan + usage */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold capitalize text-fg">
                {current}
              </span>
              <Badge tone="electric">Active</Badge>
            </div>
            <div className="mt-1 text-sm text-fg-subtle">
              {tier?.priceMonthly != null ? `€${tier.priceMonthly} / month` : "Custom pricing"}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface/40 p-3">
              <CreditCard className="size-5 text-fg-subtle" />
              <div className="text-sm text-fg-muted">No payment method on file</div>
              <span
                className="ml-auto text-xs text-fg-subtle"
                title="Requires Stripe connection"
              >
                Coming soon
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage this period</CardTitle>
          </CardHeader>
          <div className="space-y-5 px-5 pb-5">
            {usage.map((u) => (
              <div key={u.label} className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">{u.label}</span>
                <span className="font-mono text-fg">
                  {u.used} <span className="text-fg-subtle">/ {u.total}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Plans */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-fg">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {PRICING_TIERS.map((t) => {
            const isCurrent = t.id === current;
            return (
              <Card
                key={t.id}
                className={cn(
                  "flex flex-col p-5",
                  isCurrent && "border-electric/50 bg-electric/[0.05]",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-fg">{t.name}</h3>
                  {isCurrent && <Badge tone="electric">Current</Badge>}
                </div>
                <div className="mt-3 text-2xl font-semibold text-fg">
                  {t.priceMonthly === null ? "Custom" : `€${t.priceMonthly}`}
                  {t.priceMonthly !== null && (
                    <span className="text-sm font-normal text-fg-subtle">/mo</span>
                  )}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-fg-muted">
                    <Check className="size-3.5 text-signal" />
                    {t.limits.repos}
                  </li>
                  <li className="flex items-center gap-2 text-fg-muted">
                    <Check className="size-3.5 text-signal" />
                    {t.limits.prs}
                  </li>
                  <li className="flex items-center gap-2 text-fg-muted">
                    <Check className="size-3.5 text-signal" />
                    {t.limits.audits}
                  </li>
                </ul>
                <button
                  disabled
                  title={
                    isCurrent
                      ? undefined
                      : "Checkout goes live once Stripe is connected"
                  }
                  className="mt-5 inline-flex h-9 cursor-default items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-fg-subtle"
                >
                  {isCurrent ? "Current plan" : `Switch to ${t.name}`}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-fg">Invoices</h2>
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="No invoices yet"
          description="Invoices will appear here once billing is active."
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
