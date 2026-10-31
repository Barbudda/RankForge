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
let runDeterministicAudit;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-parity-"));
  await build({
    stdin: {
      contents: 'export { runIndexingChecks } from "./src/lib/audit/indexing-checks.ts"; export { runDeterministicAudit } from "./src/lib/audit/engine.ts";',
      resolveDir: ROOT,
      loader: "ts",
    },
    outfile: join(outDir, "checks.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  ({ runIndexingChecks, runDeterministicAudit } = await import(pathToFileURL(join(outDir, "checks.mjs")).href));
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
    "indexing-sitemap-format",
    "structure-url-format",
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

test("unreadable sitemaps are reported once the site has or declares one", () => {
  const errors = [{ file: `${SITE}/sitemap-pages.xml`, reason: "served as an HTML page, not XML" }];
  const issue = run([page("/")], { sitemapErrors: errors, hasSitemap: true }).find((i) => i.ruleId === "indexing-sitemap-format");
  assert.ok(issue);
  assert.equal(issue.affectedUrls[0].url, "/sitemap-pages.xml");
  // No sitemap anywhere: that's "framework-sitemap-missing", not a format error.
  const none = run([page("/")], { sitemapErrors: errors, hasSitemap: false, robotsDeclaresSitemap: false });
  assert.ok(!ids(none).has("indexing-sitemap-format"));
});

test("URL shape: underscores, many parameters and very long URLs, on indexable pages only", () => {
  const long = "/" + "a".repeat(220);
  const issues = run([page("/my_page"), page("/list?a=1&b=2&c=3"), page(long), page("/clean-page")]);
  const issue = issues.find((i) => i.ruleId === "structure-url-format");
  assert.deepEqual(issue.affectedUrls.map((u) => u.url).sort(), ["/list?a=1&b=2&c=3", "/my_page", long].sort());
});

const probe = (url, status, hops = []) => ({ url, status, redirects: hops.length, hops, finalUrl: url, bytes: null, contentType: "", insecure: false });
const audit = (resources) =>
  runDeterministicAudit({ framework: "nextjs", productionUrl: SITE }, [page("/"), page("/about")], { hasSitemap: true, hasRobots: true, robotsDeclaresSitemap: true }, resources);

test("broken images and same-site CSS/JS are measured, timeouts aren't counted", () => {
  const res = {
    images: new Map([[`${SITE}/a.png`, probe(`${SITE}/a.png`, 404)], [`${SITE}/b.png`, probe(`${SITE}/b.png`, 0)], [`${SITE}/c.png`, probe(`${SITE}/c.png`, 200)]]),
    links: new Map(),
    assets: new Map([[`${SITE}/_next/app.js`, probe(`${SITE}/_next/app.js`, 404)], [`${SITE}/style.css`, probe(`${SITE}/style.css`, 200)]]),
  };
  const issues = audit(res).issues;
  const by = (id) => issues.find((i) => i.ruleId === id);
  assert.deepEqual(by("img-broken").affectedUrls.map((u) => u.url), ["/a.png"]);
  assert.deepEqual(by("perf-broken-assets").affectedUrls.map((u) => u.url), ["/_next/app.js"]);
});

test("temporary redirects on internal links are flagged, a sign-in wall and external links are not", () => {
  const moved = probe(`${SITE}/old`, 200, [302]);
  moved.finalUrl = `${SITE}/new`;
  const wall = probe(`${SITE}/dashboard`, 200, [307]);
  wall.finalUrl = `${SITE}/login`;
  const external = probe("https://other.example/x", 200, [302]);
  const res = {
    images: new Map(),
    links: new Map([[moved.url, moved], [wall.url, wall], [external.url, external], [`${SITE}/perm`, probe(`${SITE}/perm`, 200, [301])]]),
    assets: new Map(),
  };
  const issue = audit(res).issues.find((i) => i.ruleId === "indexing-temporary-redirect");
  assert.deepEqual(issue.affectedUrls.map((u) => u.url), ["/old"]);
  assert.match(issue.affectedUrls[0].note, /302 → \/new/);
});

const site = (pages, siteFiles = { hasSitemap: true, hasRobots: true, robotsDeclaresSitemap: true }, framework = "nextjs") =>
  runDeterministicAudit({ framework, productionUrl: SITE }, pages, siteFiles).issues;

test("og:image: relative paths and localhost are flagged, absolute and protocol-relative URLs are not", () => {
  const withOg = (path, image) => ({ ...page(path), og: { "og:image": image } });
  const issues = site([
    withOg("/", "/og.png"),
    withOg("/a", "http://localhost:3000/opengraph-image.png"),
    withOg("/b", "https://www.example.com/og.png"),
    withOg("/c", "//cdn.example.com/og.png"),
    page("/d"),
  ]);
  const issue = issues.find((i) => i.ruleId === "meta-og-image-url");
  assert.deepEqual(issue.affectedUrls.map((u) => u.url), ["/", "/a"]);
  assert.match(issue.affectedUrls[0].note, /relative URL/);
  assert.match(issue.affectedUrls[1].note, /localhost/);
  // Auditing the dev server itself: a localhost image is the site's own.
  const local = runDeterministicAudit({ framework: "nextjs", productionUrl: "http://localhost:3000" }, [{ ...withOg("/", "http://localhost:3000/og.png"), url: "http://localhost:3000/" }], {}).issues;
  assert.ok(!local.some((i) => i.ruleId === "meta-og-image-url"));
});

test("an empty app shell is reported, a server-rendered page with the same mount id is not", () => {
  const shell = {
    ...page("/"),
    html: '<!doctype html><html lang="en"><head><title>App</title><script type="module" src="/assets/index-a1b2.js"></script></head><body><div id="root"></div></body></html>',
    textContent: "",
    wordCount: 0,
  };
  const rendered = {
    ...page("/about"),
    html: '<!doctype html><html lang="en"><head><title>About</title><script src="/app.js"></script></head><body><div id="root"><main><h1>About</h1><p>Real text</p></main></div></body></html>',
    wordCount: 400,
  };
  const noScript = { ...page("/static"), html: '<html><body><div id="app"></div></body></html>', wordCount: 0 };
  const issue = site([shell, rendered, noScript]).find((i) => i.ruleId === "framework-js-only-content");
  assert.deepEqual(issue.affectedUrls.map((u) => u.url), ["/"]);
  assert.match(issue.evidence, /1 of 3 indexable pages/);
});

test("page words that are Object.prototype names don't crash the audit", () => {
  const odd = (path, title, text) => ({ ...page(path), title, textContent: text, wordCount: 400 });
  const words = "the URL constructor throws valueof tostring hasownproperty __proto__ ".repeat(40);
  const pages = [odd("/", "constructor", words), odd("/b", "constructor", words), odd("/c", "toString", words)];
  const { issues } = runDeterministicAudit({ framework: "nextjs", productionUrl: SITE }, pages, { hasSitemap: true, hasRobots: true, robotsDeclaresSitemap: true });
  const dup = issues.find((i) => i.ruleId === "meta-title-duplicate");
  assert.deepEqual(dup.affectedUrls.map((u) => u.url).sort(), ["/", "/b"]);
});
