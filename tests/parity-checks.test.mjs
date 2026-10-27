// Site-audit parity checks (Semrush's error list): each fires on a broken
// case and stays quiet on a healthy one. Run: npm run test:parity
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let runIndexingChecks;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-parity-"));
  await build({
    entryPoints: [join(ROOT, "src/lib/audit/indexing-checks.ts")],
    outfile: join(outDir, "checks.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  ({ runIndexingChecks } = await import(pathToFileURL(join(outDir, "checks.mjs")).href));
});

const SITE = "https://www.example.com";
const page = (path, { head = "", links = [], viewport = "width=device-width, initial-scale=1", canonical } = {}) => ({
  url: `${SITE}${path}`,
  statusCode: 200,
  html: `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body>x</body></html>`,
  title: "t",
  metaDescription: "d",
  canonical: canonical ?? `${SITE}${path}`,
  h1s: ["h"],
  headings: [],
  images: [],
  links: links.map((href) => ({ href, internal: true, anchor: "a" })),
  jsonLd: [],
  renderMs: 1,
  lang: "en",
  metaRobots: null,
  viewport,
  hreflang: [],
  og: {},
  twitterCard: null,
  textContent: "x",
  wordCount: 400,
  htmlBytes: 1000,
  responseTimeMs: 100,
  renderBlocking: { scripts: 0, stylesheets: 0 },
  imagesMissingDims: 0,
});

const run = (pages, siteFiles = {}) =>
  runIndexingChecks({
    pages,
    startUrl: SITE,
    siteFiles: { hasSitemap: true, hasRobots: true, robotsDeclaresSitemap: true, ...siteFiles },
    norm: (u) => u.replace(SITE, "") || "/",
    hints: { page: "page", layout: "layout", sitemap: "sitemap", robots: "robots", config: "config" },
  });
const ids = (issues) => new Set(issues.map((i) => i.ruleId));

test("a healthy site raises none of the parity checks", () => {
  const found = ids(
    run([page("/", { links: ["/about", "https://www.example.com/pricing", "mailto:a@b.co", "#top"] }), page("/about")], {
      robotsTxt: "User-agent: *\nAllow: /\n# a comment\nSitemap: https://www.example.com/sitemap.xml\n",
      hostVariants: [
        { kind: "host", url: "https://example.com/", status: 200, finalUrl: "https://www.example.com/", canonical: null },
        { kind: "http", url: "http://www.example.com/", status: 200, finalUrl: "https://www.example.com/", canonical: null },
      ],
    }),
  );
  for (const id of [
    "indexing-host-duplicate",
    "indexing-http-not-redirected",
    "indexing-robots-format",
    "indexing-canonical-multiple",
    "indexing-meta-refresh",
    "perf-viewport-no-width",
    "link-malformed",
  ]) {
    assert.ok(!found.has(id), `${id} fired on a healthy site`);
  }
});

test("both spellings of the domain serving the site is a duplicate, unless the spare one is canonicalised", () => {
  const dup = [{ kind: "host", url: "https://example.com/", status: 200, finalUrl: "https://example.com/", canonical: null }];
  assert.ok(ids(run([page("/")], { hostVariants: dup })).has("indexing-host-duplicate"));
  const canonicalised = [{ ...dup[0], canonical: "https://www.example.com/" }];
  assert.ok(!ids(run([page("/")], { hostVariants: canonicalised })).has("indexing-host-duplicate"));
  const unreachable = [{ ...dup[0], status: 0, finalUrl: dup[0].url }];
  assert.ok(!ids(run([page("/")], { hostVariants: unreachable })).has("indexing-host-duplicate"));
});

test("an http homepage that stays on http is reported", () => {
  const v = [{ kind: "http", url: "http://www.example.com/", status: 200, finalUrl: "http://www.example.com/", canonical: null }];
  const issue = run([page("/")], { hostVariants: v }).find((i) => i.ruleId === "indexing-http-not-redirected");
  assert.ok(issue);
  assert.equal(issue.affectedUrls[0].url, "http://www.example.com/");
});

test("robots.txt typos and unsupported Noindex lines are listed with their line numbers", () => {
  const issue = run([page("/")], { robotsTxt: "User-agent: *\nDissalow: /private\nNoindex: /old\njust words\n" }).find(
    (i) => i.ruleId === "indexing-robots-format",
  );
  assert.ok(issue);
  assert.match(issue.evidence, /3 unreadable lines/);
  assert.match(issue.affectedUrls[0].note, /line 2: unknown directive "Dissalow"/);
  assert.match(issue.affectedUrls[0].note, /line 3: Noindex isn't supported/);
});

test("head problems: two canonicals, a meta refresh, a viewport without width", () => {
  const issues = run([
    page("/two", { head: '<link rel="canonical" href="/a"><link rel="canonical" href="/b">' }),
    page("/refresh", { head: '<meta http-equiv="refresh" content="0;url=/new">' }),
    page("/narrow", { viewport: "initial-scale=1" }),
  ]);
  const by = (id) => issues.find((i) => i.ruleId === id);
  assert.deepEqual(by("indexing-canonical-multiple").affectedUrls.map((u) => u.url), ["/two"]);
  assert.match(by("indexing-canonical-multiple").affectedUrls[0].note, /2 canonical tags: \/a, \/b/);
  assert.equal(by("indexing-meta-refresh").affectedUrls[0].note, "0;url=/new");
  assert.deepEqual(by("perf-viewport-no-width").affectedUrls.map((u) => u.url), ["/narrow"]);
});

test("malformed hrefs are caught, valid and non-web ones are not", () => {
  const issue = run([
    page("/", { links: ["https:/www.example.com/x", "http//example.com", "htps://example.com", "/a\\b", "/about us", "/fine", "tel:+33", "javascript:void(0)"] }),
  ]).find((i) => i.ruleId === "link-malformed");
  assert.ok(issue);
  assert.match(issue.evidence, /^5 malformed links on 1 page/);
});
