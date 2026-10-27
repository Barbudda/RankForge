/**
 * Where the Supabase settings come from. The plain names, set by hand on
 * Vercel and in .env.local, point at the production project and win. The
 * Vercel Marketplace integration installed in October 2026 synced a second,
 * empty project under the "Septune_" prefix: it's only a fallback, read when
 * the plain names are missing. Each NEXT_PUBLIC_ name is written out in full
 * so Next.js can inline it in the browser bundle.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_Septune_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_Septune_SUPABASE_PUBLISHABLE_KEY;

/** Server-only: never set under a NEXT_PUBLIC_ name, so it can't reach the browser. */
export function supabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.Septune_SUPABASE_SECRET_KEY;
}
