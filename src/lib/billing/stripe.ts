import Stripe from "stripe";
import { config } from "@/lib/config";
import { BILLING_OPEN } from "@/lib/pricing";
import { PRICE_LOOKUP_KEYS, explicitPriceId, type PaidPlan } from "./prices";

/**
 * The Stripe client, for server code only (route handlers, server actions).
 * Everything here returns null when STRIPE_SECRET_KEY isn't set: billing
 * stays closed and the rest of the app works as before.
 */

let client: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key, { appInfo: { name: "RankForge", url: config.appUrl } }) : null;
  }
  return client;
}

/** Checkout can run: billing is open, Stripe and the service-role key are set. */
export function billingReady(): boolean {
  return BILLING_OPEN && Boolean(process.env.STRIPE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY);
}

/** The active price for a plan: explicit id from the env, else its lookup key. */
export async function priceIdFor(stripe: Stripe, plan: PaidPlan): Promise<string | null> {
  const explicit = explicitPriceId(plan);
  if (explicit) return explicit;
  const { data } = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEYS[plan]], active: true, limit: 1 });
  return data[0]?.id ?? null;
}
