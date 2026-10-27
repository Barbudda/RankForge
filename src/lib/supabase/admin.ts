import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, supabaseSecretKey } from "./env";

/**
 * Service-role Supabase client, for what RLS keeps from users: the monitoring
 * cron and "Check now", the Stripe webhook and checkout, pre-orders and their
 * count on the operator's settings card. It bypasses RLS, so every caller
 * either authenticates first (CRON_SECRET, the Stripe signature, the signed-in
 * user or operator) or makes one narrow, validated write (a visitor's
 * pre-order). Never import this from a client component.
 *
 * Returns null when SUPABASE_SECRET_KEY isn't configured: those features then
 * say they aren't available, and everything else keeps working.
 */
export function createAdminClient() {
  const url = SUPABASE_URL;
  const key = supabaseSecretKey();
  if (!url || !key || typeof window !== "undefined") return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
