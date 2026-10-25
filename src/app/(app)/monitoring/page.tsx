import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { MonitorCard } from "@/components/app/monitor-card";
import { getMonitoringOverview } from "@/lib/monitor/data";
import { PRICING_TIERS } from "@/lib/pricing";

export const metadata: Metadata = { title: "Monitoring" };
// "Check now" runs a full check inside the server action.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const o = await getMonitoringOverview();
  const tier = PRICING_TIERS.find((t) => t.id === o.plan)!;

  const notices: string[] = [];
  if (!o.available) notices.push("Monitoring needs the database: set the Supabase environment variables.");
  if (o.migrationMissing) {
    notices.push("This database doesn't have the monitoring tables yet: run supabase/migrations/0004_monitoring.sql in the Supabase SQL editor, then reload.");
  }
  if (o.available && !o.scheduled) {
    notices.push("Scheduled checks aren't active on this deployment (CRON_SECRET and SUPABASE_SECRET_KEY). Check now works in the meantime.");
  }
  if (o.available && !o.emailConfigured) notices.push("Email alerts need RESEND_API_KEY. Slack, Discord and webhook alerts work without it.");

  return (
    <>
      <PageHeader
        title="Monitoring"
        description="Septune checks each site on a schedule, compares it with the previous check, and alerts you when a deploy breaks SEO."
      />

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-fg-muted">
          <span className="font-medium text-fg">
            {tier.name}
            {!o.billingOpen && o.plan === "pro" ? " (free during the beta)" : ""}
          </span>
          {" · "}
          {o.enabledCount} of {o.limits.sites} site{o.limits.sites > 1 ? "s" : ""} monitored · checked {o.limits.frequency} · up to {o.limits.pages} pages each ·{" "}
          {o.limits.webhooks ? "email, Slack, Discord or webhook alerts" : "email alerts"}
        </p>
        <Button href="/billing" variant="ghost" size="sm">
          Plan details
        </Button>
      </Card>

      {notices.length > 0 && (
        <Card className="mb-4 border-dashed p-4">
          <ul className="space-y-1.5 text-sm text-fg-muted">
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      )}

      {o.sites.length === 0 ? (
        <EmptyState
          icon={<Activity className="size-7" />}
          title="Add a site to monitor"
          description="Connect a repository with its production URL, then turn monitoring on: the first check runs straight away."
          action={
            <Button href="/repositories" variant="primary" size="sm">
              Add a site
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {o.sites.map((s) => (
            <MonitorCard
              key={s.repo.id}
              repo={s.repo}
              monitor={s.monitor}
              checks={s.checks}
              limits={o.limits}
              disabled={!o.available || o.migrationMissing}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-fg-subtle">
        What a check looks at: pages that start failing or redirect, noindex (tag or header), canonicals, robots.txt (Googlebot and AI
        search crawlers), the sitemap, the HTTPS certificate, new issues from the audit engine, and Core Web Vitals when a CrUX key is set.
      </p>
    </>
  );
}
