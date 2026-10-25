import type { Plan } from "@/types";

export type PaidPlan = Exclude<Plan, "free">;

/**
 * Stripe prices are found by lookup key, so changing a price never needs a
 * deploy: create the new price in Stripe with the same lookup key
 * ("transfer lookup key") and checkout uses it at once. `npm run
 * stripe:setup` creates both prices with these keys. STRIPE_PRICE_PRO and
 * STRIPE_PRICE_STUDIO override them with explicit price ids.
 */
export const PRICE_LOOKUP_KEYS: Record<PaidPlan, string> = {
  pro: "rankforge_pro_monthly",
  studio: "rankforge_studio_monthly",
};

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, studio: 2 };

export function explicitPriceId(plan: PaidPlan): string | undefined {
  return (plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STUDIO) || undefined;
}

/** The plan a Stripe price grants, or null for a price RankForge doesn't sell. */
export function planForPrice(price: { id: string; lookup_key?: string | null }): PaidPlan | null {
  for (const plan of ["pro", "studio"] as const) {
    if (price.id === explicitPriceId(plan) || price.lookup_key === PRICE_LOOKUP_KEYS[plan]) return plan;
  }
  return null;
}

export function higherPlan(a: Plan, b: Plan): Plan {
  return PLAN_RANK[a] >= PLAN_RANK[b] ? a : b;
}
