import type { CrawledPage } from "./types";
import { headerDirectives } from "./robots-directives";
import { botAllowed } from "./geo";

/**
 * Can Google index this one URL? Every place Google reads an indexing
 * directive, checked separately so the answer says which one decides:
 * the HTTP status, the X-Robots-Tag header, the robots and googlebot meta
 * tags, robots.txt and the canonical.
 */

export type SignalStatus = "ok" | "blocked" | "warning";

export interface IndexabilitySignal {
  id: string;
  label: string;
  status: SignalStatus;
  detail: string;
}

export interface IndexabilityReport {
  url: string;
  finalUrl: string;
  verdict: "indexable" | "caveats" | "blocked";
  summary: string;
  signals: IndexabilitySignal[];
}

const NOINDEX = /\b(noindex|none)\b/;

function samePage(a: string, b: string): boolean {
  try {
    const x = new URL(a);
    const y = new URL(b);
    const path = (u: URL) => u.pathname.replace(/\/+$/, "") || "/";
    return x.host.toLowerCase() === y.host.toLowerCase() && path(x) === path(y);
  } catch {
    return a === b;
  }
}

export function indexabilityReport(
  requestedUrl: string,
  page: CrawledPage,
  site: { robotsTxt?: string; robotsStatus?: number },
): IndexabilityReport {
  const signals: IndexabilitySignal[] = [];
  const finalUrl = page.url;

  // HTTP status (after redirects).
  if (page.statusCode >= 400) {
    signals.push({ id: "status", label: "HTTP status", status: "blocked", detail: `The page answers HTTP ${page.statusCode}: Google drops error pages from its index.` });
  } else if (!samePage(requestedUrl, finalUrl)) {
    signals.push({ id: "status", label: "HTTP status", status: "warning", detail: `This URL redirects to ${finalUrl}. Google indexes the destination, not this URL; the checks below are for the destination.` });
  } else {
    signals.push({ id: "status", label: "HTTP status", status: "ok", detail: `HTTP ${page.statusCode}.` });
  }

  // X-Robots-Tag header (the one a CDN or a staging config sets).
  const forGoogle = headerDirectives(page.xRobotsTag, "googlebot");
  if (forGoogle.some((d) => d === "noindex" || d === "none")) {
    signals.push({ id: "header", label: "X-Robots-Tag header", status: "blocked", detail: `The server sends "X-Robots-Tag: ${page.xRobotsTag}". Nothing in the HTML shows it: check your host, CDN or framework config.` });
  } else {
    signals.push({ id: "header", label: "X-Robots-Tag header", status: "ok", detail: page.xRobotsTag ? `"${page.xRobotsTag}": no noindex for Google.` : "Not sent." });
  }

  // Meta tags.
  const meta = [
    { name: "robots", value: page.metaRobots },
    { name: "googlebot", value: page.metaGooglebot ?? null },
  ];
  const noindexMeta = meta.filter((m) => m.value && NOINDEX.test(m.value));
  if (noindexMeta.length) {
    signals.push({
      id: "meta",
      label: "Robots meta tags",
      status: "blocked",
      detail: noindexMeta.map((m) => `<meta name="${m.name}" content="${m.value}">`).join(" and ") + " tells Google not to index the page.",
    });
  } else {
    const present = meta.filter((m) => m.value).map((m) => `${m.name}: "${m.value}"`);
    signals.push({ id: "meta", label: "Robots meta tags", status: "ok", detail: present.length ? `${present.join(", ")}: no noindex.` : "None: indexable by default." });
  }

  // robots.txt for Googlebot.
  const robots = site.robotsTxt ?? "";
  let path = "/";
  try {
    const u = new URL(finalUrl);
    path = u.pathname + u.search;
  } catch {
    // keep "/"
  }
  if (site.robotsStatus !== undefined && (site.robotsStatus >= 500 || site.robotsStatus === 429)) {
    signals.push({ id: "robots", label: "robots.txt", status: "blocked", detail: `robots.txt answers HTTP ${site.robotsStatus}: Google treats the whole site as off-limits until it answers again.` });
  } else if (robots && !botAllowed(robots, "Googlebot", path)) {
    signals.push({ id: "robots", label: "robots.txt", status: "warning", detail: `robots.txt doesn't let Googlebot crawl ${path}. Google can't read the page, nor any noindex on it; it may still list the bare URL if other pages link to it.` });
  } else {
    signals.push({ id: "robots", label: "robots.txt", status: "ok", detail: robots ? `Googlebot may crawl ${path}.` : "No robots.txt: everything may be crawled." });
  }

  // Canonical.
  if (page.statusCode < 400) {
    if (!page.canonical) {
      signals.push({ id: "canonical", label: "Canonical", status: "warning", detail: "No canonical tag: Google picks the preferred URL itself, which is usually fine on a single URL but risky with duplicates." });
    } else {
      let canonical = page.canonical;
      try {
        canonical = new URL(page.canonical, finalUrl).toString();
      } catch {
        // keep as written
      }
      if (samePage(canonical, finalUrl)) {
        signals.push({ id: "canonical", label: "Canonical", status: "ok", detail: "Points at the page itself." });
      } else {
        signals.push({ id: "canonical", label: "Canonical", status: "warning", detail: `Points at ${canonical}: Google will most likely index that URL instead of this one.` });
      }
    }
  }

  const blocked = signals.filter((s) => s.status === "blocked");
  const warnings = signals.filter((s) => s.status === "warning");
  const verdict = blocked.length ? "blocked" : warnings.length ? "caveats" : "indexable";
  const summary =
    verdict === "blocked"
      ? `Google won't index this page: ${blocked.map((s) => s.label).join(" and ")}.`
      : verdict === "caveats"
        ? `Nothing blocks indexing, but check: ${warnings.map((s) => s.label).join(" and ")}.`
        : "Nothing stops Google from indexing this page.";
  return { url: requestedUrl, finalUrl, verdict, summary, signals };
}
