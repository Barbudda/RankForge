/**
 * Tells the people who pre-ordered that their plan is open, once each.
 *
 *   npm run preorders:notify                 list who is waiting (dry run)
 *   npm run preorders:notify -- --send       email them through Resend
 *   npm run preorders:notify -- --send --plan pro
 *
 * Reads .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and for
 * --send RESEND_API_KEY and RANKFORGE_ALERT_FROM. Refuses to send while
 * payments are closed (NEXT_PUBLIC_RANKFORGE_BILLING isn't "open"): the link
 * would only lead back to the pre-order page.
 */
import { createClient } from "@supabase/supabase-js";

const PLANS: Record<string, { name: string; price: number }> = {
  pro: { name: "Pro", price: 19 },
  studio: { name: "Studio", price: 49 },
};

const has = (flag: string) => process.argv.includes(`--${flag}`);
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const mask = (email: string) => email.replace(/^(.).*?(@.*)$/, "$1***$2");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const url = process.env.NEXT_PUBLIC_Septune_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.Septune_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are needed (in .env.local).");
    process.exit(1);
  }
  const send = has("send");
  const plan = arg("plan");
  if (plan && !PLANS[plan]) {
    console.error('--plan must be "pro" or "studio".');
    process.exit(1);
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.septune.dev").replace(/\/$/, "");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let query = db.from("preorders").select("id, email, plan").is("notified_at", null).order("created_at", { ascending: true });
  if (plan) query = query.eq("plan", plan);
  const { data, error } = await query;
  if (error) {
    console.error(`Couldn't read pre-orders: ${error.message} (has migration 0006 been run?)`);
    process.exit(1);
  }
  const waiting = data ?? [];
  const byPlan = waiting.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.plan]: (acc[p.plan] ?? 0) + 1 }), {});
  console.log(`\n${waiting.length} pre-order(s) waiting: ${Object.entries(byPlan).map(([p, n]) => `${n} ${PLANS[p]?.name ?? p}`).join(", ") || "none"}`);
  for (const p of waiting.slice(0, 20)) console.log(`  ${mask(p.email)} · ${p.plan}`);
  if (waiting.length > 20) console.log(`  … and ${waiting.length - 20} more`);

  if (!send) {
    console.log("\nDry run. Add --send to email them.\n");
    return;
  }
  if (process.env.NEXT_PUBLIC_RANKFORGE_BILLING !== "open") {
    console.error("\nPayments aren't open (NEXT_PUBLIC_RANKFORGE_BILLING isn't \"open\"): nothing sent.\n");
    process.exit(1);
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("\nRESEND_API_KEY is needed to send.\n");
    process.exit(1);
  }
  const from = process.env.RANKFORGE_ALERT_FROM || "Septune <onboarding@resend.dev>";

  let sent = 0;
  for (const p of waiting) {
    const tier = PLANS[p.plan]!;
    const link = `${appUrl}/billing?plan=${p.plan}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [p.email],
        subject: `Septune ${tier.name} is open`,
        text: `You pre-ordered Septune ${tier.name}: it's open. Start here: ${link}\n\n€${tier.price}/month, cancel anytime. This is the one email we promised; we won't write about it again.`,
        html: `<p>You pre-ordered <strong>Septune ${tier.name}</strong>: it's open.</p><p><a href="${link}">Start with ${tier.name}</a> · €${tier.price}/month, cancel anytime.</p><p style="color:#888">This is the one email we promised; we won't write about it again.</p>`,
      }),
    });
    if (!res.ok) {
      console.error(`  ✗ ${mask(p.email)}: Resend answered HTTP ${res.status}; left for the next run`);
      continue;
    }
    await db.from("preorders").update({ notified_at: new Date().toISOString() }).eq("id", p.id);
    sent++;
    console.log(`  ✓ ${mask(p.email)}`);
    // Resend's default limit is a couple of requests per second.
    await sleep(600);
  }
  console.log(`\n${sent} of ${waiting.length} emailed.\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
