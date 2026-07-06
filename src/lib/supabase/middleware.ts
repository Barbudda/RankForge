import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Authenticated app routes — unauthenticated users are sent to /login. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/repositories",
  "/audits",
  "/issues",
  "/pull-requests",
  "/settings",
  "/billing",
];

/**
 * Refreshes the Supabase auth session on every request (keeps the cookie
 * fresh for Server Components) and guards the authenticated app routes.
 * No-ops cleanly when Supabase env vars are absent.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!URL || !KEY) return response; // Supabase not configured — pass through.

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  // No Supabase auth cookie at all → skip the network round-trip entirely.
  // (Covers sb-<ref>-auth-token and its chunked .0/.1 variants.)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return response;
  }

  try {
    const supabase = createServerClient(URL, KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // IMPORTANT: do not run code between createServerClient and getUser().
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  } catch {
    // Misconfigured/unreachable Supabase — never take down the whole site.
  }

  return response;
}
