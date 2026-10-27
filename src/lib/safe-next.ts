/**
 * Only same-origin paths. Blocks open redirects via ?next=//evil.tld and its
 * backslash form /\evil.tld, which browsers read as //evil.tld. Shared by the
 * sign-in form and the email-link route, which both redirect to `next`.
 */
export function sanitizeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (next && /^\/(?![\\/])/.test(next) && !/[\u0000-\u001f\u007f]/.test(next)) return next;
  return fallback;
}
