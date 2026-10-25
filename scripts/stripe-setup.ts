/**
 * Sets up RankForge's billing in a Stripe account, in one command:
 *
 *   npm run stripe:setup                         (reads .env.local)
 *   npm run stripe:setup -- --webhook-url https://www.rank-forge.dev/api/stripe/webhook
 *
 * Creates, or finds when they already exist:
 *   - the Pro (€19) and Studio (€49) products and their monthly prices,
 *     with the lookup keys checkout uses (src/lib/billing/prices.ts);
 *   - a customer-portal configuration (cancel at period end, switch plans,
 *     invoices, card) → STRIPE_PORTAL_CONFIGURATION;
 *   - the webhook endpoint → STRIPE_WEBHOOK_SECRET (Stripe shows the
 *     secret only when the endpoint is created).
 *
 * Test key (sk_test_…) = test mode, live key = live mode: run it once per
 * mode. Nothing is ever deleted. Node 24 runs this TypeScript file as is.
 */
import Stripe from "stripe";

const PLANS = [
  {
    plan: "pro",
    name: "RankForge Pro",
    description: "Monitoring of 5 sites checked daily, with alerts by email, Slack, Discord or webhook.",
    amount: 1900,
    lookupKey: "rankforge_pro_monthly",
  },
  {
    plan: "studio",
    name: "RankForge Studio",
    description: "Monitoring of 25 sites checked daily, with an alert address and webhook per client.",
    amount: 4900,
    lookupKey: "rankforge_studio_monthly",
  },
] as const;

// Keep in sync with HANDLED in src/lib/billing/webhook.ts.
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function publicOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "https:" && u.hostname !== "localhost" ? u.origin : null;
  } catch {
    return null;
  }
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("STRIPE_SECRET_KEY is not set. Put it in .env.local (or the environment) and run again.");
    process.exit(1);
  }
  const stripe = new Stripe(key);
  const mode = key.includes("_live_") ? "LIVE" : "TEST";
  const origin = arg("app-url") ?? publicOrigin() ?? "https://www.rank-forge.dev";
  console.log(`\nStripe setup for RankForge (${mode} mode) · site ${origin}\n`);

  // ── Products and prices ──────────────────────────────────────────────
  const prices: Record<string, { product: string; price: string }> = {};
  for (const p of PLANS) {
    const found = await stripe.prices.list({ lookup_keys: [p.lookupKey], active: true, limit: 1 });
    const current = found.data[0];
    if (current && current.unit_amount === p.amount && current.currency === "eur") {
      const product = typeof current.product === "string" ? current.product : current.product.id;
      prices[p.plan] = { product, price: current.id };
      console.log(`✓ ${p.name}: price ${current.id} already set up`);
      continue;
    }
    // Reuse the product if a previous run created it.
    const products = await stripe.products.list({ limit: 100, active: true });
    let product = products.data.find((x) => x.metadata.rankforge_plan === p.plan);
    if (!product) {
      product = await stripe.products.create({
        name: p.name,
        description: p.description,
        metadata: { rankforge_plan: p.plan },
      });
    }
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: p.amount,
      recurring: { interval: "month" },
      lookup_key: p.lookupKey,
      // Moves the key off an older price (e.g. after a price change).
      transfer_lookup_key: true,
      // The price shown on the site is what a customer pays, VAT included
      // if Stripe Tax is switched on later.
      tax_behavior: "inclusive",
      metadata: { rankforge_plan: p.plan },
    });
    prices[p.plan] = { product: product.id, price: price.id };
    console.log(`+ ${p.name}: €${p.amount / 100}/month, price ${price.id}`);
  }

  // ── Customer portal ──────────────────────────────────────────────────
  const configs = await stripe.billingPortal.configurations.list({ limit: 50 });
  let portal = configs.data.find((c) => c.metadata?.app === "rankforge" && c.active);
  const portalFeatures: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: {
        enabled: true,
        options: ["too_expensive", "missing_features", "switched_service", "unused", "other"],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "create_prorations",
      products: Object.values(prices).map((x) => ({ product: x.product, prices: [x.price] })),
    },
  };
  if (portal) {
    portal = await stripe.billingPortal.configurations.update(portal.id, { features: portalFeatures });
    console.log(`✓ Customer portal: ${portal.id} updated`);
  } else {
    portal = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "RankForge: manage your plan",
        privacy_policy_url: `${origin}/privacy`,
        terms_of_service_url: `${origin}/terms`,
      },
      default_return_url: `${origin}/billing`,
      features: portalFeatures,
      metadata: { app: "rankforge" },
    });
    console.log(`+ Customer portal: ${portal.id}`);
  }

  // ── Webhook ──────────────────────────────────────────────────────────
  const webhookUrl = arg("webhook-url") ?? `${origin}/api/stripe/webhook`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === webhookUrl);
  let webhookSecret: string | null = null;
  if (existing) {
    await stripe.webhookEndpoints.update(existing.id, { enabled_events: WEBHOOK_EVENTS, disabled: false });
    console.log(`✓ Webhook ${webhookUrl}: already set up (events refreshed)`);
  } else {
    const created = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: WEBHOOK_EVENTS,
      description: "RankForge: keeps each account's plan in sync",
    });
    webhookSecret = created.secret ?? null;
    console.log(`+ Webhook ${webhookUrl}`);
  }

  // ── What to set ──────────────────────────────────────────────────────
  console.log("\nAdd these to Vercel (Settings → Environment Variables) and to .env.local:\n");
  console.log(`  STRIPE_PORTAL_CONFIGURATION=${portal.id}`);
  if (webhookSecret) {
    console.log(`  STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
    console.log("\n  Stripe shows this secret only once. Copy it now.");
  } else {
    console.log("  STRIPE_WEBHOOK_SECRET=<already set when the endpoint was created; Stripe Dashboard → Developers → Webhooks → reveal or roll it>");
  }
  console.log("\nThen set NEXT_PUBLIC_RANKFORGE_BILLING=open and redeploy to open payments.\n");
}

main().catch((e) => {
  console.error(`\nStripe setup failed: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
