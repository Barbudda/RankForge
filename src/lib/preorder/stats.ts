import { createAdminClient } from "@/lib/supabase/admin";

/** Pre-order counts for the operator: the demand signal while payments are closed. */
export type PreorderStats =
  | { ok: true; pro: number; studio: number; waiting: number }
  | { ok: false; reason: "no-admin" | "no-table" | "error" };

export async function getPreorderStats(): Promise<PreorderStats> {
  const db = createAdminClient();
  if (!db) return { ok: false, reason: "no-admin" };
  const count = (plan?: string, waitingOnly = false) => {
    let q = db.from("preorders").select("id", { count: "exact", head: true });
    if (plan) q = q.eq("plan", plan);
    if (waitingOnly) q = q.is("notified_at", null);
    return q;
  };
  const [pro, studio, waiting] = await Promise.all([count("pro"), count("studio"), count(undefined, true)]);
  const failed = pro.error ?? studio.error ?? waiting.error;
  if (failed) return { ok: false, reason: /does not exist|42P01|PGRST205/i.test(`${failed.code} ${failed.message}`) ? "no-table" : "error" };
  return { ok: true, pro: pro.count ?? 0, studio: studio.count ?? 0, waiting: waiting.count ?? 0 };
}
