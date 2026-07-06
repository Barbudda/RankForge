import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase env vars are present (app still runs without them). */
export const isSupabaseConfigured = Boolean(URL && KEY);

/**
 * Server Supabase client (Server Components, Route Handlers, Server Actions).
 * Reads/writes the auth cookies via next/headers. The setAll try/catch is the
 * documented pattern: writing cookies from a Server Component throws, and the
 * middleware refreshes the session instead.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(URL!, KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore (middleware refreshes).
        }
      },
    },
  });
}
