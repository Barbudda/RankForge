import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "@/components/app/settings-form";
import { GithubIcon } from "@/components/brand/github-icon";
import { Badge } from "@/components/ui/badge";
import { getCurrentWorkspace } from "@/lib/account";
import { getAgentSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [agentSettings, currentWorkspace] = await Promise.all([
    getAgentSettings(),
    getCurrentWorkspace(),
  ]);
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your GitHub connection, agent behavior and workspace."
      />

      {/* GitHub connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>GitHub connection</CardTitle>
          <CardDescription>
            RankForge installs as a GitHub App with read-only access by default.
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
                Repositories are added manually for now. The GitHub App (real,
                branch-scoped PRs) lands in a future release.
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
