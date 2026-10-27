/**
 * Where the Supabase settings come from. The Vercel ↔ Supabase integration
 * syncs them under the prefix chosen when it was installed ("Septune_") and
 * keeps them current when keys rotate, so those names win; the plain names are
 * the fallback (.env.local, a manual setup). Each NEXT_PUBLIC_ name is written
 * out in full so Next.js can inline it in the browser bundle.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_Septune_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_Septune_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Server-only: never set under a NEXT_PUBLIC_ name, so it can't reach the browser. */
export function supabaseSecretKey(): string | undefined {
  return process.env.Septune_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY;
}
