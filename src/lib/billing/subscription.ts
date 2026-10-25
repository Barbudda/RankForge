import type Stripe from "stripe";
import type { Plan } from "@/types";
import { higherPlan, planForPrice } from "./prices";

/**
 * A customer's Stripe subscriptions → the billing fields stored on their
 * profile. Pure, so the webhook can be replayed in any order: it always
 * recomputes from every subscription the customer has, never from the one
 * event that arrived.
 */

/**
 * Statuses that keep the paid plan. past_due keeps it while Stripe retries
 * the card (smart retries), so a failed renewal doesn't cut monitoring off
 * at once; unpaid, canceled, incomplete and paused don't.
 */
export const PAID_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

export interface BillingFields {
  plan: Plan;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
}

const iso = (seconds?: number | null) => (seconds ? new Date(seconds * 1000).toISOString() : null);

function planOf(sub: Stripe.Subscription): Plan {
  let plan: Plan = "free";
  for (const item of sub.items.data) {
    const p = planForPrice(item.price);
    if (p) plan = higherPlan(plan, p);
  }
  return plan;
}

/**
 * The subscription that decides the account: the highest paid plan among the
 * subscriptions in a paid status, or else the most recent one (so the
 * billing page can still say "canceled" or "payment incomplete").
 */
export function billingFieldsFor(subscriptions: Stripe.Subscription[]): BillingFields {
  const paying = subscriptions
    .filter((s) => PAID_STATUSES.has(s.status) && planOf(s) !== "free")
    .sort((a, b) => higherRank(planOf(b), planOf(a)) || b.created - a.created);
  const decisive = paying[0] ?? [...subscriptions].sort((a, b) => b.created - a.created)[0];
  if (!decisive) {
    return { plan: "free", stripe_subscription_id: null, subscription_status: null, current_period_end: null, cancel_at: null };
  }
  const item = decisive.items.data[0];
  return {
    plan: paying[0] ? planOf(decisive) : "free",
    stripe_subscription_id: decisive.id,
    subscription_status: decisive.status,
    // Since API 2025-03-31 the billing period lives on each subscription item.
    current_period_end: iso(item?.current_period_end),
    cancel_at: iso(decisive.cancel_at),
  };
}

function higherRank(a: Plan, b: Plan): number {
  return a === b ? 0 : higherPlan(a, b) === a ? 1 : -1;
}
