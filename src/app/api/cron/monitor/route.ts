import { NextResponse } from "next/server";
import type { Framework } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/pricing";
import { config } from "@/lib/config";
import { processMonitor, type MonitorRow } from "@/lib/monitor/process";

/**
 * Scheduled monitoring. Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET` (vercel.json schedules it daily, the
 * most a Hobby project allows). Each run takes the monitors whose
 * next_check_at has passed, oldest first, three at a time, and stops before
 * the function's time limit; whatever is left waits for the next run.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUDGET_MS = 230_000;
const PARALLEL = 3;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled checks are off: CRON_SECRET is not set." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Scheduled checks are off: SUPABASE_SECRET_KEY is not set." }, { status: 503 });

  const started = Date.now();
  const { data: due, error } = await db
    .from("monitors")
    .select("repo_id, user_id, enabled, frequency, alert_email, webhook_url, min_level, last_check_at, last_level, last_snapshot")
    .eq("enabled", true)
    .lte("next_check_at", new Date().toISOString())
    .order("next_check_at", { ascending: true })
    .limit(60);
  if (error) {
    console.error("[cron/monitor]", error.message);
    return NextResponse.json({ error: "Could not read monitors." }, { status: 500 });
  }

  const queue = [...((due ?? []) as MonitorRow[])];
  const results: { repo: string; ok: boolean; level: string; alerted: boolean }[] = [];

  const worker = async () => {
    while (queue.length && Date.now() - started < BUDGET_MS) {
      const m = queue.shift()!;
      const [{ data: repo }, { data: profile }] = await Promise.all([
        db.from("repositories").select("name, full_name, production_url, framework").eq("id", m.repo_id).maybeSingle(),
        db.from("profiles").select("plan, email").eq("id", m.user_id).maybeSingle(),
      ]);
      if (!repo || !/^https?:\/\//i.test(repo.production_url ?? "")) {
        await db.from("monitors").update({ enabled: false }).eq("repo_id", m.repo_id);
        continue;
      }
      const res = await processMonitor(
        db,
        m,
        { name: repo.full_name || repo.name, productionUrl: repo.production_url, framework: repo.framework as Framework },
        { plan: effectivePlan(profile?.plan), trigger: "scheduled", appUrl: config.appUrl, ownerEmail: profile?.email ?? null },
      );
      results.push({ repo: m.repo_id, ok: res.ok, level: res.level, alerted: res.alerted });
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  return NextResponse.json({ checked: results.length, remaining: queue.length, results });
}
