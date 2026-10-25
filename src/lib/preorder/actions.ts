"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter } from "@/lib/net/public-endpoint";
import { config } from "@/lib/config";
import { PRICING_TIERS } from "@/lib/pricing";
import { escapeHtml, sendTransactionalEmail } from "@/lib/email/send";
import { savePreorder } from "./core";

export type PreorderState =
  | { status: "idle" }
  | { status: "done"; email: string; already: boolean }
  | { status: "error"; error: string; contact?: string };

const CONTACT = "hugopoene74@gmail.com";
// Secret key or table missing: nobody should be turned away, so offer the way in by hand.
const UNAVAILABLE: PreorderState = { status: "error", error: "Pre-orders aren't switched on yet.", contact: CONTACT };

const limited = createRateLimiter(8);

export async function preorderAction(_prev: PreorderState, form: FormData): Promise<PreorderState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  if (limited(ip)) return { status: "error", error: "Too many tries from here. Please try again in an hour." };

  const db = createAdminClient();
  if (!db) return UNAVAILABLE;

  const plan = String(form.get("plan") ?? "");
  const res = await savePreorder(db, {
    email: String(form.get("email") ?? ""),
    plan,
    source: String(form.get("source") ?? ""),
    honeypot: String(form.get("website") ?? ""),
  });
  if (!res.ok) return res.unavailable ? UNAVAILABLE : { status: "error", error: res.error };

  if (!res.already && !form.get("website")) {
    const tier = PRICING_TIERS.find((t) => t.id === res.plan)!;
    const pricing = `${config.appUrl}/pricing`;
    await sendTransactionalEmail({
      to: res.email,
      subject: `You're on the list for Septune ${tier.name}`,
      text: `Thanks for pre-ordering Septune ${tier.name} (€${tier.priceMonthly}/month).\n\nNothing is charged now. We'll email you once, the day ${tier.name} opens, with a link to start; you can say no then.\n\nUntil then, the free plan and the CLI work today: ${pricing}\n\nDidn't ask for this? Ignore this email and we won't write again.`,
      html: `<p>Thanks for pre-ordering <strong>Septune ${escapeHtml(tier.name)}</strong> (€${tier.priceMonthly}/month).</p><p>Nothing is charged now. We'll email you once, the day ${escapeHtml(tier.name)} opens, with a link to start; you can say no then.</p><p>Until then, the free plan and the CLI work today: <a href="${pricing}">${pricing}</a></p><p style="color:#888">Didn't ask for this? Ignore this email and we won't write again.</p>`,
    });
  }
  return { status: "done", email: res.email, already: res.already };
}
