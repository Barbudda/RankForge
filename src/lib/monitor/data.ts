import type { Plan, Repository } from "@/types";
import type { SiteChange } from "@/lib/audit/snapshot";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseSecretKey } from "@/lib/supabase/env";
import { getRepositories } from "@/lib/data";
import { getCurrentWorkspace } from "@/lib/account";
import { BILLING_OPEN, PLAN_LIMITS, effectivePlan, type PlanLimits } from "@/lib/pricing";

export interface Monitor {
  repoId: string;
  enabled: boolean;
  frequency: "daily" | "weekly";
  alertEmail: string | null;
  webhookUrl: string | null;
  minLevel: "critical" | "warning" | "info";
  lastCheckAt: string | null;
  nextCheckAt: string | null;
  lastLevel: string | null;
  lastSummary: string | null;
}

export interface MonitorCheck {
  id: string;
  repoId: string;
  createdAt: string;
  trigger: "scheduled" | "manual";
  status: "ok" | "error";
  overall: number | null;
  geoScore: number | null;
  pages: number;
  level: "none" | "info" | "warning" | "critical";
  summary: string;
  changes: SiteChange[];
  alerted: boolean;
  error: string | null;
}

export interface MonitoringOverview {
  /** Supabase is configured (otherwise the app runs without data). */
  available: boolean;
  /** The 0004 migration hasn't been run on this database yet. */
  migrationMissing: boolean;
  plan: Plan;
  billingOpen: boolean;
  limits: PlanLimits;
  /** Scheduled checks can run on this deployment (cron secret + service key). */
  scheduled: boolean;
  /** Email alerts can be delivered (Resend key). */
  emailConfigured: boolean;
  enabledCount: number;
  sites: { repo: Repository; monitor: Monitor | null; checks: MonitorCheck[] }[];
}

const isMissingTable = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|could not find the table/i.test(e.message ?? "")));

export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  const workspace = await getCurrentWorkspace();
  const plan = effectivePlan(workspace.plan);
  const base: MonitoringOverview = {
    available: isSupabaseConfigured,
    migrationMissing: false,
    plan,
    billingOpen: BILLING_OPEN,
    limits: PLAN_LIMITS[plan],
    scheduled: Boolean(process.env.CRON_SECRET && supabaseSecretKey()),
    emailConfigured: Boolean(process.env.RESEND_API_KEY),
    enabledCount: 0,
    sites: [],
  };
  if (!isSupabaseConfigured) return base;

  const repos = await getRepositories();
  const supabase = await createClient();
  const [monitorsRes, checksRes] = await Promise.all([
    supabase
      .from("monitors")
      .select("repo_id, enabled, frequency, alert_email, webhook_url, min_level, last_check_at, next_check_at, last_level, last_summary"),
    supabase
      .from("monitor_checks")
      .select("id, repo_id, created_at, trigger, status, overall, geo_score, pages, level, summary, changes, alerted, error")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  if (isMissingTable(monitorsRes.error) || isMissingTable(checksRes.error)) {
    return { ...base, migrationMissing: true, sites: repos.map((repo) => ({ repo, monitor: null, checks: [] })) };
  }

  const monitors = new Map<string, Monitor>();
  for (const m of monitorsRes.data ?? []) {
    monitors.set(m.repo_id, {
      repoId: m.repo_id,
      enabled: m.enabled,
      frequency: m.frequency,
      alertEmail: m.alert_email,
      webhookUrl: m.webhook_url,
      minLevel: m.min_level,
      lastCheckAt: m.last_check_at,
      nextCheckAt: m.next_check_at,
      lastLevel: m.last_level,
      lastSummary: m.last_summary,
    });
  }
  const checks = new Map<string, MonitorCheck[]>();
  for (const c of checksRes.data ?? []) {
    const list = checks.get(c.repo_id) ?? [];
    if (list.length >= 30) continue;
    list.push({
      id: c.id,
      repoId: c.repo_id,
      createdAt: c.created_at,
      trigger: c.trigger,
      status: c.status,
      overall: c.overall,
      geoScore: c.geo_score,
      pages: c.pages,
      level: c.level,
      summary: c.summary,
      changes: Array.isArray(c.changes) ? (c.changes as SiteChange[]) : [],
      alerted: c.alerted,
      error: c.error,
    });
    checks.set(c.repo_id, list);
  }

  return {
    ...base,
    enabledCount: [...monitors.values()].filter((m) => m.enabled).length,
    sites: repos.map((repo) => ({ repo, monitor: monitors.get(repo.id) ?? null, checks: checks.get(repo.id) ?? [] })),
  };
}
