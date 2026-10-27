import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

const URL = SUPABASE_URL;
const KEY = SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase env vars are present (app still runs without them). */
export const isSupabaseConfigured = Boolean(URL && KEY);

/** Browser Supabase client (Client Components, event handlers). */
export function createClient() {
  return createBrowserClient(URL!, KEY!);
}
