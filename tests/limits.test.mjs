// Cost guards: which hosted MCP calls are metered, and the per-key limiter.
// Run: npm run test:limits
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let mod;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-limits-"));
  await build({
    stdin: {
      contents: [
        'export * from "./src/lib/mcp/hosted-limits.ts";',
        'export { MCP_TOOLS } from "./src/lib/mcp/tools.ts";',
        'export { createRateLimiter } from "./src/lib/net/public-endpoint.ts";',
      ].join("\n"),
      resolveDir: ROOT,
      loader: "ts",
    },
    outfile: join(outDir, "limits.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  mod = await import(pathToFileURL(join(outDir, "limits.mjs")).href);
});

const call = (name) => ({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: {} } });

test("only tool calls that crawl a site are metered", () => {
  assert.equal(mod.isCrawlCall(call("audit_site")), true);
  assert.equal(mod.isCrawlCall(call("compare_sites")), true);
  assert.equal(mod.isCrawlCall(call("list_rules")), false);
  assert.equal(mod.isCrawlCall(call("seo_docs")), false);
  assert.equal(mod.isCrawlCall({ jsonrpc: "2.0", id: 1, method: "tools/list" }), false);
  for (const junk of [null, [], "audit_site", 42, { method: "tools/call" }, { method: "tools/call", params: null }]) {
    assert.equal(mod.isCrawlCall(junk), false);
  }
});

test("every MCP tool is either metered or known to be free", () => {
  // A new tool must be classified on purpose: one that crawls and isn't
  // metered would let anyone crawl on the hosted server's bill.
  const FREE = new Set(["get_fix_template", "seo_docs", "list_rules"]);
  for (const t of mod.MCP_TOOLS) {
    assert.ok(
      mod.CRAWLING_TOOLS.has(t.name) || FREE.has(t.name),
      `${t.name}: add it to CRAWLING_TOOLS (src/lib/mcp/hosted-limits.ts) if it fetches a site, or to FREE here`,
    );
  }
  for (const name of mod.CRAWLING_TOOLS) {
    assert.ok(mod.MCP_TOOLS.some((t) => t.name === name), `${name} is metered but no longer exists`);
  }
});

test("the limiter counts per key and stops at the hourly budget", () => {
  const limited = mod.createRateLimiter(2);
  assert.equal(limited("a"), false);
  assert.equal(limited("a"), false);
  assert.equal(limited("a"), true);
  assert.equal(limited("b"), false);
});

test("the limit message offers the unlimited local server", () => {
  assert.match(mod.CRAWL_LIMIT_MESSAGE, new RegExp(`${mod.CRAWLS_PER_HOUR} site crawls per hour`));
  assert.match(mod.CRAWL_LIMIT_MESSAGE, /npx -y septune mcp/);
});
