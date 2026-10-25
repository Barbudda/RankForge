import { NextResponse } from "next/server";
import { crawlSite, probeSiteFiles } from "@/lib/agents/crawl";
import { indexabilityReport } from "@/lib/audit/indexability";
import { clientIp, createRateLimiter, parsePublicUrl } from "@/lib/net/public-endpoint";

/**
 * The free noindex checker behind /tools/noindex-checker: one URL, one fetch
 * of the page plus robots.txt, no sitemap or certificate probing. The visitor
 * asks for this one page, like opening it in a browser, so it's fetched even
 * where robots.txt keeps SeptuneBot out; robots.txt is still read to report
 * what Googlebot may do.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const limited = createRateLimiter(30);

function friendly(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (/private|internal|not allowed|blocked/i.test(msg)) return "That address isn't a public website.";
  return "Couldn't reach that page. Check the URL and that the site is online.";
}

export async function POST(req: Request) {
  let body: { url?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const url = parsePublicUrl(body.url);
  if (!url) return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
  if (limited(clientIp(req))) {
    return NextResponse.json({ error: "That's a lot of checks for one hour. Try again a bit later, or run npx septune audit for unlimited ones." }, { status: 429 });
  }

  try {
    const [site, crawl] = await Promise.all([
      probeSiteFiles(url, { sitemaps: false, tls: false, light: true }),
      crawlSite(url, { maxPages: 1, hardCap: 1, deadlineMs: 12_000, concurrency: 1 }),
    ]);
    const page = crawl.pages[0];
    if (!page) return NextResponse.json({ error: "Couldn't load that page." }, { status: 502 });
    return NextResponse.json(indexabilityReport(url, page, site));
  } catch (e) {
    return NextResponse.json({ error: friendly(e) }, { status: 502 });
  }
}
