import { NextResponse } from "next/server";
import { scanSite } from "@/lib/agents/crawl";
import { buildLlmsTxt, llmsTxtProblems } from "@/lib/audit/geo";
import { clientIp, createRateLimiter, parsePublicUrl } from "@/lib/net/public-endpoint";

/**
 * The free llms.txt generator behind /tools/llms-txt-generator: a bounded
 * crawl (15 pages, 18 s), robots.txt honoured, nothing stored. When the site
 * already has an llms.txt, its format is checked too.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const limited = createRateLimiter(10);

function friendly(e: unknown): { error: string; status: number } {
  const msg = e instanceof Error ? e.message : "";
  if (/robots\.txt disallows/i.test(msg)) {
    return { error: "This site's robots.txt doesn't let RankForgeBot crawl it. On your own site, the CLI can: npx rankforge-cli llms <url> --ignore-robots", status: 403 };
  }
  if (/private|internal|not allowed|blocked/i.test(msg)) return { error: "That address isn't a public website.", status: 400 };
  return { error: "Couldn't crawl that site. Check the URL and that the site is online.", status: 502 };
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
    return NextResponse.json({ error: "That's a lot of crawls for one hour. Try again later, or run npx rankforge-cli llms <url> for unlimited ones." }, { status: 429 });
  }

  try {
    const { pages, siteFiles } = await scanSite(url, {
      maxPages: 15,
      deadlineMs: 18_000,
      concurrency: 3,
      light: true,
      sitemapSeeds: 30,
    });
    const ok = pages.filter((p) => p.statusCode >= 200 && p.statusCode < 300);
    if (!ok.length) return NextResponse.json({ error: "No page of that site answered: nothing to build an llms.txt from." }, { status: 502 });
    return NextResponse.json({
      url,
      pages: ok.length,
      llmsTxt: buildLlmsTxt(pages, url),
      existing: siteFiles.hasLlmsTxt ? { problems: llmsTxtProblems(siteFiles.llmsTxt ?? "") } : null,
    });
  } catch (e) {
    const { error, status } = friendly(e);
    return NextResponse.json({ error }, { status });
  }
}
