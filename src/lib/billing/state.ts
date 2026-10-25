import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** What the billing page shows about the signed-in user's subscription. */
export interface BillingState {
  hasCustomer: boolean;
  status: string | null;
  periodEnd: string | null;
  cancelAt: string | null;
}

const EMPTY: BillingState = { hasCustomer: false, status: null, periodEnd: null, cancelAt: null };

export async function getBillingState(): Promise<BillingState> {
  if (!isSupabaseConfigured) return EMPTY;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;
  // Before migration 0005 these columns don't exist: the select fails and
  // the page simply shows no subscription.
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id, subscription_status, current_period_end, cancel_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return EMPTY;
  return {
    hasCustomer: Boolean(data.stripe_customer_id),
    status: (data.subscription_status as string | null) ?? null,
    periodEnd: (data.current_period_end as string | null) ?? null,
    cancelAt: (data.cancel_at as string | null) ?? null,
  };
}
