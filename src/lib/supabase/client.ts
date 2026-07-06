import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase env vars are present (app still runs without them). */
export const isSupabaseConfigured = Boolean(URL && KEY);

/** Browser Supabase client (Client Components, event handlers). */
export function createClient() {
  return createBrowserClient(URL!, KEY!);
}
