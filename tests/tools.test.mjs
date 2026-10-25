// The free noindex checker's verdicts, on hand-built pages (no network).
// Run: npm run test:tools
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let indexabilityReport;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-tools-"));
  await build({
    entryPoints: [join(ROOT, "src/lib/audit/indexability.ts")],
    outfile: join(outDir, "indexability.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  ({ indexabilityReport } = await import(pathToFileURL(join(outDir, "indexability.mjs")).href));
});

const URL_ = "https://acme.test/pricing";
const page = (over = {}) => ({
  url: URL_,
  statusCode: 200,
  canonical: URL_,
  metaRobots: null,
  metaGooglebot: null,
  xRobotsTag: null,
  ...over,
});
const statusOf = (r, id) => r.signals.find((s) => s.id === id).status;

test("a clean page is indexable", () => {
  const r = indexabilityReport(URL_, page(), { robotsTxt: "User-agent: *\nAllow: /\n", robotsStatus: 200 });
  assert.equal(r.verdict, "indexable");
  assert.ok(r.signals.every((s) => s.status === "ok"));
});

test("a noindex in the header is caught, and a header scoped to another bot isn't", () => {
  assert.equal(indexabilityReport(URL_, page({ xRobotsTag: "noindex" }), {}).verdict, "blocked");
  assert.equal(statusOf(indexabilityReport(URL_, page({ xRobotsTag: "googlebot: noindex" }), {}), "header"), "blocked");
  assert.equal(statusOf(indexabilityReport(URL_, page({ xRobotsTag: "bingbot: noindex" }), {}), "header"), "ok");
});

test("the googlebot meta tag counts like the robots one", () => {
  const r = indexabilityReport(URL_, page({ metaGooglebot: "noindex" }), {});
  assert.equal(r.verdict, "blocked");
  assert.match(r.signals.find((s) => s.id === "meta").detail, /name="googlebot"/);
  assert.equal(indexabilityReport(URL_, page({ metaRobots: "index, follow" }), {}).verdict, "indexable");
});

test("robots.txt blocking Googlebot is a warning, a failing robots.txt blocks", () => {
  const blocked = indexabilityReport(URL_, page(), { robotsTxt: "User-agent: Googlebot\nDisallow: /pricing\n", robotsStatus: 200 });
  assert.equal(blocked.verdict, "caveats");
  assert.match(blocked.signals.find((s) => s.id === "robots").detail, /can't read the page/);
  assert.equal(indexabilityReport(URL_, page(), { robotsTxt: "", robotsStatus: 503 }).verdict, "blocked");
});

test("a canonical elsewhere, a redirect and an error page are reported", () => {
  assert.equal(statusOf(indexabilityReport(URL_, page({ canonical: "https://acme.test/plans" }), {}), "canonical"), "warning");
  assert.equal(statusOf(indexabilityReport(URL_, page({ canonical: "/pricing/" }), {}), "canonical"), "ok", "relative + trailing slash = itself");
  const moved = indexabilityReport(URL_, page({ url: "https://acme.test/plans", canonical: "https://acme.test/plans" }), {});
  assert.equal(statusOf(moved, "status"), "warning");
  assert.equal(moved.finalUrl, "https://acme.test/plans");
  assert.equal(indexabilityReport(URL_, page({ statusCode: 404 }), {}).verdict, "blocked");
});
