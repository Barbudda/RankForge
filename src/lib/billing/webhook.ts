import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { billingFieldsFor } from "./subscription";

/**
 * Stripe webhook → profile plan. Framework-free so it can be tested with a
 * real signature and a fake database; the route handler only passes the raw
 * body through.
 *
 * Every handled event triggers the same thing: re-read all the customer's
 * subscriptions from Stripe and store the result. Events can arrive late,
 * twice or out of order without the plan ever going backwards.
 */

export type StripeLike = Pick<Stripe, "webhooks" | "subscriptions">;

export interface WebhookResult {
  status: number;
  body: Record<string, unknown>;
}

const HANDLED = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

function customerOf(event: Stripe.Event): string | null {
  const obj = event.data.object as { customer?: string | { id: string } | null };
  return idOf(obj.customer);
}

/** The RankForge user an event names, used when the profile isn't linked to the customer yet. */
function userOf(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") return event.data.object.client_reference_id ?? null;
  const obj = event.data.object as { metadata?: Record<string, string> | null };
  return obj.metadata?.user_id ?? null;
}

export async function syncCustomer(
  stripe: StripeLike,
  db: SupabaseClient,
  customerId: string,
  userId: string | null,
): Promise<{ plan: string; matched: boolean }> {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const fields = billingFieldsFor(subs.data);

  const { data: byCustomer, error } = await db
    .from("profiles")
    .update(fields)
    .eq("stripe_customer_id", customerId)
    .select("id");
  if (error) throw new Error(`profiles update failed: ${error.message}`);
  if (byCustomer && byCustomer.length) return { plan: fields.plan, matched: true };

  // The checkout ran before the customer id was saved on the profile.
  if (!userId) return { plan: fields.plan, matched: false };
  const { data: byUser, error: linkError } = await db
    .from("profiles")
    .update({ ...fields, stripe_customer_id: customerId })
    .eq("id", userId)
    .select("id");
  if (linkError) throw new Error(`profiles link failed: ${linkError.message}`);
  return { plan: fields.plan, matched: Boolean(byUser && byUser.length) };
}

export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
  deps: { stripe: StripeLike; db: SupabaseClient; secret: string },
): Promise<WebhookResult> {
  let event: Stripe.Event;
  try {
    event = deps.stripe.webhooks.constructEvent(rawBody, signature ?? "", deps.secret);
  } catch {
    return { status: 400, body: { error: "Invalid Stripe signature." } };
  }

  const customerId = customerOf(event);
  if (!HANDLED.has(event.type) || !customerId) return { status: 200, body: { received: true, ignored: event.type } };

  // A log of applied events. The sync itself is idempotent, so a duplicate
  // is simply acknowledged.
  const { error: logError } = await deps.db.from("billing_events").insert({ id: event.id, type: event.type });
  if (logError) {
    if (logError.code === "23505") return { status: 200, body: { received: true, duplicate: true } };
    console.error("[stripe/webhook] event log:", logError.message);
    return { status: 500, body: { error: "Couldn't record the event." } };
  }

  try {
    const res = await syncCustomer(deps.stripe, deps.db, customerId, userOf(event));
    if (!res.matched) console.warn(`[stripe/webhook] no profile for customer ${customerId} (${event.type})`);
    return { status: 200, body: { received: true, plan: res.plan, matched: res.matched } };
  } catch (e) {
    console.error("[stripe/webhook] sync:", e instanceof Error ? e.message : e);
    // Forget the event so Stripe's retry is applied instead of skipped.
    await deps.db.from("billing_events").delete().eq("id", event.id);
    return { status: 500, body: { error: "Couldn't apply the event." } };
  }
}
