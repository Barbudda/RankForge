"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Repository } from "@/types";
import type { PlanLimits } from "@/lib/pricing";
import type { Monitor, MonitorCheck } from "@/lib/monitor/data";
import { runMonitorNow, saveMonitor } from "@/lib/monitor/actions";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "signal" | "amber" | "danger";

function status(monitor: Monitor | null, latest: MonitorCheck | undefined): { label: string; tone: Tone } {
  if (!monitor || !latest) return { label: "Not checked yet", tone: "neutral" };
  if (latest.status === "error") return { label: "Check failed", tone: "danger" };
  if (latest.level === "critical") return { label: "Critical change", tone: "danger" };
  if (latest.level === "warning") return { label: "Warning", tone: "amber" };
  return { label: "No regressions", tone: "signal" };
}

/** Deterministic date (UTC) so server and client render the same text. */
function fmt(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 160;
  const h = 36;
  const min = Math.min(...values, 50);
  const max = Math.max(...values, 100);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label={`Score over the last ${values.length} checks`} role="img">
      <polyline points={pts} fill="none" stroke="var(--color-molten)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const LEVEL_TAG: Record<string, string> = {
  critical: "border-danger/40 text-danger",
  warning: "border-amber/40 text-amber",
  info: "border-border text-fg-subtle",
};

export function MonitorCard({
  repo,
  monitor,
  checks,
  limits,
  disabled,
}: {
  repo: Repository;
  monitor: Monitor | null;
  checks: MonitorCheck[];
  limits: PlanLimits;
  /** Monitoring can't be used on this deployment (Supabase/migration missing). */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [enabled, setEnabled] = useState(monitor?.enabled ?? false);
  const [frequency, setFrequency] = useState<"daily" | "weekly">(monitor?.frequency ?? limits.frequency);
  const [alertEmail, setAlertEmail] = useState(monitor?.alertEmail ?? "");
  const [webhookUrl, setWebhookUrl] = useState(monitor?.webhookUrl ?? "");
  const [minLevel, setMinLevel] = useState<"critical" | "warning" | "info">(monitor?.minLevel ?? "warning");

  const latest = checks[0];
  const st = status(monitor, latest);
  const scores = checks.filter((c) => c.status === "ok" && typeof c.overall === "number").map((c) => c.overall as number).reverse();
  const previous = checks.find((c, i) => i > 0 && c.status === "ok");
  const delta = latest?.overall != null && previous?.overall != null ? latest.overall - previous.overall : null;
  const hasUrl = /^https?:\/\//i.test(repo.productionUrl);

  const save = () =>
    startTransition(async () => {
      const r = await saveMonitor({ repoId: repo.id, enabled, frequency, alertEmail, webhookUrl, minLevel });
      setMessage(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error ?? "Couldn't save." });
      if (r.ok) router.refresh();
    });

  const checkNow = () =>
    startTransition(async () => {
      setMessage({ ok: true, text: "Checking the site… this takes up to a minute." });
      const r = await runMonitorNow(repo.id);
      setMessage(r.ok ? { ok: true, text: r.summary ?? "Check done." } : { ok: false, text: r.error ?? "The check failed." });
      if (r.ok) setEnabled(true);
      router.refresh();
    });

  return (
    <Card id={repo.id} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-fg">{repo.fullName || repo.name}</h3>
            <Badge tone={st.tone}>{st.label}</Badge>
            {monitor && !monitor.enabled && <Badge tone="neutral">Paused</Badge>}
          </div>
          {hasUrl ? (
            <a
              href={repo.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-fg-subtle hover:text-fg"
            >
              {repo.productionUrl}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <p className="mt-1 text-xs text-fg-subtle">No production URL: add one on the repository page to monitor it.</p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={checkNow} disabled={pending || disabled || !hasUrl}>
          <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
          Check now
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex items-end gap-4">
          <div>
            <div className="text-xs text-fg-subtle">Score</div>
            <div className="font-mono text-2xl font-semibold text-fg">
              {latest?.overall ?? "–"}
              {delta !== null && delta !== 0 && (
                <span className={cn("ml-1 text-sm", delta > 0 ? "text-signal" : "text-danger")}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
          </div>
          <Sparkline values={scores} />
        </div>
        <div className="text-sm text-fg-muted">
          {latest ? latest.summary : "Turn monitoring on or run a first check: you'll get the state of the site straight away."}
          <div className="mt-1 text-xs text-fg-subtle">
            Last check {fmt(monitor?.lastCheckAt ?? null)}
            {monitor?.enabled && monitor.nextCheckAt ? ` · next ${fmt(monitor.nextCheckAt)}` : ""}
          </div>
        </div>
      </div>

      {latest && latest.changes.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
          {latest.changes.slice(0, 6).map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
              <span className={cn("mt-0.5 shrink-0 rounded border px-1.5 font-mono text-[10px] uppercase", LEVEL_TAG[c.level])}>
                {c.level}
              </span>
              <span>{c.title}</span>
            </li>
          ))}
          {latest.changes.length > 6 && <li className="text-xs text-fg-subtle">+{latest.changes.length - 6} more in the history</li>}
        </ul>
      )}

      <details className="group mt-4 border-t border-border pt-3">
        <summary className="cursor-pointer text-sm font-medium text-fg">Alerts and schedule</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-[var(--color-molten)]" />
            Monitor this site
          </label>
          <label className="text-sm text-fg-muted">
            <span className="mb-1 block text-xs">Check</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
            >
              <option value="daily" disabled={limits.frequency === "weekly"}>
                Every day{limits.frequency === "weekly" ? " (Pro)" : ""}
              </option>
              <option value="weekly">Every week</option>
            </select>
          </label>
          <label className="text-sm text-fg-muted">
            <span className="mb-1 block text-xs">Alert email (empty = your account email)</span>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-fg placeholder:text-fg-subtle"
            />
          </label>
          <label className="text-sm text-fg-muted">
            <span className="mb-1 block text-xs">Slack, Discord or webhook URL{limits.webhooks ? "" : " (Pro)"}</span>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={!limits.webhooks}
              placeholder="https://hooks.slack.com/services/…"
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-fg placeholder:text-fg-subtle disabled:opacity-50"
            />
          </label>
          <label className="text-sm text-fg-muted">
            <span className="mb-1 block text-xs">Alert me on</span>
            <select
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value as "critical" | "warning" | "info")}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm text-fg"
            >
              <option value="critical">Critical changes only</option>
              <option value="warning">Warnings and critical changes</option>
              <option value="info">Every change</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button variant="primary" size="sm" onClick={save} disabled={pending || disabled || !hasUrl}>
              Save
            </Button>
          </div>
        </div>
      </details>

      {checks.length > 0 && (
        <details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer text-sm font-medium text-fg">History ({checks.length})</summary>
          <ul className="mt-3 space-y-2">
            {checks.slice(0, 12).map((c) => (
              <li key={c.id} className="grid gap-1 text-sm sm:grid-cols-[150px_60px_1fr]">
                <span className="font-mono text-xs text-fg-subtle">{fmt(c.createdAt)}</span>
                <span className="font-mono text-fg">{c.status === "ok" ? c.overall : "error"}</span>
                <span className="text-fg-muted">
                  {c.summary}
                  {c.trigger === "manual" && <span className="text-fg-subtle"> · manual</span>}
                  {c.alerted && <span className="text-fg-subtle"> · alert sent</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {message && (
        <p role="status" className={cn("mt-3 text-sm", message.ok ? "text-fg-muted" : "text-danger")}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
