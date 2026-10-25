"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRepository } from "@/lib/data";
import { getCurrentWorkspace } from "@/lib/account";
import { PLAN_LIMITS, effectivePlan } from "@/lib/pricing";
import { config } from "@/lib/config";
import { webhookProblem } from "./alerts";
import { processMonitor, type MonitorRow } from "./process";

type Result = { ok: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export interface MonitorSettingsInput {
  repoId: string;
  enabled: boolean;
  frequency: "daily" | "weekly";
  alertEmail: string;
  webhookUrl: string;
  minLevel: "critical" | "warning" | "info";
}

/** Create or update a site's monitor, within the plan's limits. */
export async function saveMonitor(input: MonitorSettingsInput): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Sign in first." };
  const repo = await getRepository(input.repoId);
  if (!repo) return { ok: false, error: "Site not found." };
  if (!/^https?:\/\//i.test(repo.productionUrl)) {
    return { ok: false, error: "This site has no production URL to check. Add one on the repository page." };
  }

  const plan = effectivePlan((await getCurrentWorkspace()).plan);
  const limits = PLAN_LIMITS[plan];
  const frequency = input.frequency === "daily" && limits.frequency === "daily" ? "daily" : "weekly";
  const alertEmail = input.alertEmail.trim();
  const webhookUrl = input.webhookUrl.trim();
  if (alertEmail && !EMAIL_RE.test(alertEmail)) return { ok: false, error: "That email address doesn't look right." };
  if (webhookUrl) {
    if (!limits.webhooks) return { ok: false, error: "Slack, Discord and webhook alerts are part of Pro." };
    const problem = webhookProblem(webhookUrl);
    if (problem) return { ok: false, error: problem };
  }
  const minLevel = ["critical", "warning", "info"].includes(input.minLevel) ? input.minLevel : "warning";

  if (input.enabled) {
    const { count } = await s.supabase
      .from("monitors")
      .select("repo_id", { count: "exact", head: true })
      .eq("enabled", true)
      .neq("repo_id", repo.id);
    if ((count ?? 0) >= limits.sites) {
      return {
        ok: false,
        error: `Your plan monitors up to ${limits.sites} site${limits.sites > 1 ? "s" : ""}. Turn one off first${plan === "studio" ? "." : ", or move to a larger plan."}`,
      };
    }
  }

  const { error } = await s.supabase.from("monitors").upsert(
    {
      repo_id: repo.id,
      user_id: s.user.id,
      enabled: input.enabled,
      frequency,
      alert_email: alertEmail || null,
      webhook_url: webhookUrl || null,
      min_level: minLevel,
    },
    { onConflict: "repo_id" },
  );
  if (error) {
    console.error("[saveMonitor]", error.message);
    return { ok: false, error: "Couldn't save the monitor. Has the 0004 migration been run?" };
  }
  revalidatePath("/monitoring");
  return { ok: true };
}

/** Run a check right now (and create the monitor if needed). */
export async function runMonitorNow(repoId: string): Promise<Result & { summary?: string; level?: string }> {
  const s = await session();
  if (!s) return { ok: false, error: "Sign in first." };
  const repo = await getRepository(repoId);
  if (!repo) return { ok: false, error: "Site not found." };
  if (!/^https?:\/\//i.test(repo.productionUrl)) return { ok: false, error: "This site has no production URL to check." };

  const plan = effectivePlan((await getCurrentWorkspace()).plan);
  const { data: existing, error: readErr } = await s.supabase
    .from("monitors")
    .select("repo_id, user_id, enabled, frequency, alert_email, webhook_url, min_level, last_check_at, last_level, last_snapshot")
    .eq("repo_id", repo.id)
    .maybeSingle();
  if (readErr) return { ok: false, error: "Monitoring isn't set up on this database yet (run migration 0004)." };

  let monitor = existing as MonitorRow | null;
  if (monitor?.last_check_at && Date.now() - new Date(monitor.last_check_at).getTime() < 3 * 60_000) {
    return { ok: false, error: "A check just ran. Give it a few minutes before the next one." };
  }
  if (!monitor) {
    const saved = await saveMonitor({
      repoId: repo.id,
      enabled: true,
      frequency: PLAN_LIMITS[plan].frequency,
      alertEmail: "",
      webhookUrl: "",
      minLevel: "warning",
    });
    if (!saved.ok) return saved;
    monitor = {
      repo_id: repo.id,
      user_id: s.user.id,
      enabled: true,
      frequency: PLAN_LIMITS[plan].frequency,
      alert_email: null,
      webhook_url: null,
      min_level: "warning",
      last_check_at: null,
      last_level: null,
      last_snapshot: null,
    };
  }

  // Check results (history, last snapshot, next date) are server-managed
  // since migration 0005: users can't write them, so the check does.
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Checks need SUPABASE_SECRET_KEY on the server (see DEPLOY.md, section 5)." };
  const res = await processMonitor(
    admin,
    monitor,
    { name: repo.fullName || repo.name, productionUrl: repo.productionUrl, framework: repo.framework },
    { plan, trigger: "manual", appUrl: config.appUrl, ownerEmail: s.user.email ?? null },
  );
  revalidatePath("/monitoring");
  return res.ok ? { ok: true, summary: res.summary, level: res.level } : { ok: false, error: res.error };
}
