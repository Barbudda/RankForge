import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client, for the one place that acts without a signed-in
 * user: the scheduled monitoring cron. It bypasses RLS, so it must only ever
 * run in server code that has already authenticated the caller (the cron
 * route checks CRON_SECRET first). Never import this from a client component.
 *
 * Returns null when SUPABASE_SECRET_KEY isn't configured: scheduled checks
 * then simply don't run, and everything else keeps working.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || typeof window !== "undefined") return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
