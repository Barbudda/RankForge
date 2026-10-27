import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNext } from "@/lib/safe-next";

const TYPES: EmailOtpType[] = ["email", "signup", "recovery", "email_change", "invite", "magiclink"];

/**
 * Where the auth emails link to (supabase/templates/): the token hash is
 * exchanged for a session server-side, so the link works from any device and
 * stays on www.septune.dev instead of supabase.co. Then on to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/dashboard");

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }
  // Expired, already used or mangled by a mail client: say so on the sign-in page.
  return NextResponse.redirect(new URL("/login?error=link", request.nextUrl.origin));
}
