/**
 * Shared guards for the public, no-signup endpoints (free audit, free
 * tools). The SSRF guard lives in the fetch layer; these bound the cost.
 */

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** A user-typed URL, scheme optional, or null when it isn't http(s). */
export function parsePublicUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 2048) return null;
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Best-effort per-IP limiter: per-instance memory, so serverless instances
 * don't share it. It bounds bursts; the per-request caps are the real cost
 * control.
 */
export function createRateLimiter(perHour: number) {
  const hits = new Map<string, number[]>();
  return function limited(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - 60 * 60 * 1000;
    const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);
    if (recent.length >= perHour) {
      hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (!v.some((t) => t > windowStart)) hits.delete(k);
    }
    return false;
  };
}
