import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "@/components/app/settings-form";
import { GithubIcon } from "@/components/brand/github-icon";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, getCurrentWorkspace } from "@/lib/account";
import { getAgentSettings } from "@/lib/data";
import { integrationChecks, isBlocking, isOperator } from "@/lib/integrations";
import { BILLING_OPEN } from "@/lib/pricing";
import { getPreorderStats } from "@/lib/preorder/stats";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };
// Rendered per request: the go-live checklist reads the running environment.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [agentSettings, currentWorkspace, user] = await Promise.all([
    getAgentSettings(),
    getCurrentWorkspace(),
    getCurrentUser(),
  ]);
  // The operator (RANKFORGE_ADMIN_EMAILS) sees the go-live checklist; so does
  // anyone running the app without Supabase, i.e. locally.
  const checks = isOperator(user.email) || !isSupabaseConfigured ? integrationChecks() : null;
  const missingRequired = checks?.filter(isBlocking).length ?? 0;
  const preorders = checks ? await getPreorderStats() : null;
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your workspace, how far Septune prepares fixes, and the GitHub connection."
      />

      {checks && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Go-live checklist</CardTitle>
            <CardDescription>
              {missingRequired
                ? `${missingRequired} setting${missingRequired > 1 ? "s" : ""} still needed ${BILLING_OPEN ? "to take payments" : "for the live site"}. Only operators see this card.`
                : BILLING_OPEN
                  ? "Everything needed to take payments is set. Only operators see this card."
                  : "The live site has what it needs; payment settings come when billing opens. Only operators see this card."}
            </CardDescription>
          </CardHeader>
          <ul className="divide-y divide-border px-5 pb-3">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    c.ok ? "bg-signal" : isBlocking(c) ? "bg-danger" : "bg-fg-subtle",
                  )}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                    {c.label}
                    <Badge tone={c.ok ? "signal" : isBlocking(c) ? "danger" : "neutral"}>
                      {c.ok ? "Set" : isBlocking(c) ? "Missing" : c.required ? "Later" : "Optional"}
                    </Badge>
                  </div>
                  {!c.ok && <p className="mt-1 text-xs text-fg-muted">{c.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {preorders && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pre-orders</CardTitle>
            <CardDescription>
              {preorders.ok
                ? "People who chose a paid plan before payments opened. Only operators see this card."
                : preorders.reason === "no-table"
                  ? "Run supabase/migrations/0006_preorders.sql to start collecting pre-orders."
                  : preorders.reason === "no-admin"
                    ? "Set SUPABASE_SECRET_KEY: pre-orders are stored with it."
                    : "Couldn't read pre-orders right now."}
            </CardDescription>
          </CardHeader>
          {preorders.ok && (
            <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-fg-subtle">Pro</dt>
                <dd className="mt-1 font-mono text-2xl text-fg">{preorders.pro}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-fg-subtle">Studio</dt>
                <dd className="mt-1 font-mono text-2xl text-fg">{preorders.studio}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-fg-subtle">Waiting for the email</dt>
                <dd className="mt-1 font-mono text-2xl text-fg">{preorders.waiting}</dd>
              </div>
            </dl>
          )}
        </Card>
      )}

      {/* GitHub connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>GitHub connection</CardTitle>
          <CardDescription>
            Septune reads your public site; it never needs access to your code today.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-border bg-surface">
              <GithubIcon className="size-5 text-fg" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-fg">
                GitHub App
                <Badge tone="neutral">Not connected</Badge>
              </div>
              <div className="text-xs text-fg-subtle">
                Sites are added by URL. A GitHub App that opens pull requests
                for you is on the roadmap; until then, fixes go through your
                own pull requests, checked by the GitHub Action.
              </div>
            </div>
          </div>
          <a
            href="https://github.com/settings/installations"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-border px-3 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            GitHub Apps
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </Card>

      <SettingsForm initial={agentSettings} />

      {/* Workspace */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <dl className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-fg-subtle">Name</dt>
            <dd className="mt-1 text-sm text-fg">{currentWorkspace.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-fg-subtle">Plan</dt>
            <dd className="mt-1 text-sm capitalize text-fg">{currentWorkspace.plan}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-fg-subtle">Seats</dt>
            <dd className="mt-1 text-sm text-fg">{currentWorkspace.seatCount}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
