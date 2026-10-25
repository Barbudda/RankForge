import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Pre-orders for Pro and Studio while payments aren't open: validation and
 * storage, kept apart from the server action so they can be tested.
 */

export type PreorderPlan = "pro" | "studio";

export interface PreorderInput {
  email: string;
  plan: string;
  source?: string;
  /** Hidden field: people leave it empty, form-filling bots don't. */
  honeypot?: string;
}

export type PreorderResult =
  | { ok: true; email: string; plan: PreorderPlan; already: boolean }
  | { ok: false; error: string; unavailable?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isPreorderPlan(v: unknown): v is PreorderPlan {
  return v === "pro" || v === "studio";
}

export async function savePreorder(db: SupabaseClient, input: PreorderInput): Promise<PreorderResult> {
  const email = input.email.trim().toLowerCase();
  if (!isPreorderPlan(input.plan)) return { ok: false, error: "Pick Pro or Studio." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: "That email address doesn't look right." };
  // A filled honeypot gets the same answer as a real sign-up, and nothing is stored.
  if (input.honeypot) return { ok: true, email, plan: input.plan, already: false };

  const source = (input.source ?? "").replace(/[^a-z-]/gi, "").slice(0, 40) || null;
  const { error } = await db.from("preorders").insert({ email, plan: input.plan, source });
  if (!error) return { ok: true, email, plan: input.plan, already: false };
  if (error.code === "23505") return { ok: true, email, plan: input.plan, already: true };
  console.error("[preorder]", error.code, error.message);
  // No table yet (migration 0006 not run): trying again won't help, so say it isn't open.
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { ok: false, unavailable: true, error: "Pre-orders aren't switched on yet." };
  }
  return { ok: false, error: "Couldn't save your pre-order. Please try again in a minute." };
}
