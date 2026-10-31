// Pages de règles (/docs/issues/<id>) : une par règle du catalogue, sans
// phrase recopiée d'une page à l'autre (la duplication que Septune signale
// chez les autres). Run: npm run test:rule-docs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let m;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-ruledocs-"));
  await build({
    stdin: {
      contents:
        'export * from "./src/lib/audit/rule-docs.ts"; export { RULE_CATALOG } from "./src/lib/audit/catalog.ts"; export { RULE_DOC_DATA } from "./src/lib/audit/rule-docs.data.ts"; export { FIXABLE_RULE_IDS } from "./src/lib/audit/deterministic-fix.ts";',
      resolveDir: ROOT,
      loader: "ts",
    },
    outfile: join(outDir, "rule-docs.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  m = await import(pathToFileURL(join(outDir, "rule-docs.mjs")).href);
});

const TEXT_FIELDS = ["summary", "measured", "consequence", "fix", "verify"];

function allText(doc) {
  return [
    ...TEXT_FIELDS.map((f) => doc[f]),
    doc.failing.label,
    doc.failing.code,
    ...Object.values(doc.frameworks ?? {}),
  ];
}

test("every catalog rule has a page, and no page is orphaned", () => {
  const ids = m.RULE_CATALOG.map((r) => r.id);
  assert.deepEqual(Object.keys(m.RULE_DOC_DATA).sort(), [...ids].sort());
  assert.equal(m.RULE_PAGES.length, ids.length);
});

test("each page has every section filled", () => {
  for (const p of m.RULE_PAGES) {
    for (const f of TEXT_FIELDS) assert.ok(p[f]?.trim().length > 20, `${p.id}.${f}`);
    assert.ok(p.failing.code.trim().length > 0, `${p.id}.failing.code`);
    assert.ok(["html", "http", "text", "xml"].includes(p.failing.lang), `${p.id}.failing.lang`);
    assert.ok(p.failing.code.split("\n").length <= 14, `${p.id}.failing.code is too long`);
    assert.match(p.published, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(p.updated, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("related checks exist, are distinct and never the page itself", () => {
  const ids = new Set(m.RULE_CATALOG.map((r) => r.id));
  for (const p of m.RULE_PAGES) {
    assert.ok(p.related.length >= 1 && p.related.length <= 4, `${p.id}: ${p.related.length} related`);
    assert.equal(new Set(p.related).size, p.related.length, `${p.id}: duplicate related`);
    for (const r of p.related) {
      assert.ok(ids.has(r), `${p.id} → unknown ${r}`);
      assert.notEqual(r, p.id, `${p.id} links to itself`);
    }
  }
});

test("no em dash, no command for the unpublished package", () => {
  for (const p of m.RULE_PAGES) {
    for (const t of allText(p)) {
      assert.ok(!t.includes("—"), `${p.id}: em dash in "${t.slice(0, 60)}"`);
      assert.ok(!/npx\s+septune/.test(t), `${p.id}: npx septune`);
    }
  }
});

test("no sentence is shared between two pages", () => {
  const seen = new Map();
  for (const p of m.RULE_PAGES) {
    const sentences = new Set(
      [...TEXT_FIELDS.map((f) => p[f]), ...Object.values(p.frameworks ?? {})]
        .flatMap((t) => t.split(/(?<=[.!?])\s+/))
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length >= 40),
    );
    for (const s of sentences) {
      const other = seen.get(s);
      assert.ok(!other, `"${s}" is on ${other} and ${p.id}`);
      seen.set(s, p.id);
    }
  }
});

test("old doc slugs point at existing pages", () => {
  const ids = new Set(m.RULE_CATALOG.map((r) => r.id));
  for (const [from, to] of Object.entries(m.LEGACY_DOC_SLUGS)) {
    assert.ok(ids.has(to), `${from} → ${to}`);
    assert.ok(!ids.has(from), `${from} is still a rule id`);
  }
});

test("every fixable rule shows a generated patch for Next.js", () => {
  for (const id of m.FIXABLE_RULE_IDS) {
    const fix = m.fixTemplateFor(id, "nextjs");
    assert.ok(fix?.diff?.length > 0, id);
    assert.ok(!fix.diff.includes("—"), `${id}: em dash in the patch`);
  }
  assert.equal(m.fixTemplateFor("meta-title-duplicate", "nextjs"), null);
});

test("every rule page title passes Septune's own length check", () => {
  for (const p of m.RULE_PAGES) {
    const full = `${m.pageTitle(p)} · Septune`;
    assert.ok(full.length <= 65, `${p.id}: ${full.length} chars`);
  }
});

test("the no-sitemap patch adds one line and keeps the existing robots.txt", () => {
  for (const fw of ["nextjs", "nuxt", "astro", "sveltekit"]) {
    const { diff } = m.fixTemplateFor("framework-robots-no-sitemap", fw);
    assert.ok(!diff.includes("new file mode"), `${fw}: rewrites the file`);
    assert.equal(diff.split("\n").filter((l) => /^\+.*sitemap/i.test(l)).length, 1, fw);
    assert.ok(!diff.includes("+Allow: /"), `${fw}: adds rules`);
  }
});

test("Astro patches use sitemap-index.xml, the file @astrojs/sitemap writes", () => {
  assert.match(m.fixTemplateFor("framework-robots-no-sitemap", "astro").diff, /\+Sitemap: https:\/\/example\.com\/sitemap-index\.xml/);
  assert.match(m.fixTemplateFor("framework-robots-missing", "astro").diff, /sitemap-index\.xml/);
  assert.match(m.fixTemplateFor("framework-sitemap-missing", "astro").diff, /\+  integrations: \[sitemap\(\)\]/);
  assert.match(m.fixTemplateFor("framework-robots-no-sitemap", "nextjs").diff, /sitemap: "https:\/\/example\.com\/sitemap\.xml"/);
});

test("the og:image URL patch sets metadataBase on Next.js", () => {
  assert.match(m.fixTemplateFor("meta-og-image-url", "nextjs").diff, /\+  metadataBase: new URL\("https:\/\/example\.com"\)/);
});
