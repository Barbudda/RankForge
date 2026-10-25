// Pre-orders: validation, duplicates, the honeypot, storage errors.
// Run: npm run test:preorder
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let savePreorder;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-preorder-"));
  await build({
    entryPoints: [join(ROOT, "src/lib/preorder/core.ts")],
    outfile: join(outDir, "core.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  ({ savePreorder } = await import(pathToFileURL(join(outDir, "core.mjs")).href));
});

function fakeDb({ fail = null } = {}) {
  const rows = [];
  return {
    rows,
    from(table) {
      assert.equal(table, "preorders");
      return {
        insert: async (row) => {
          if (fail) return { error: fail };
          if (rows.some((r) => r.email === row.email && r.plan === row.plan)) {
            return { error: { code: "23505", message: "duplicate key value" } };
          }
          rows.push(row);
          return { error: null };
        },
      };
    },
  };
}

test("a pre-order is stored with a normalised email and a clean source", async () => {
  const db = fakeDb();
  const r = await savePreorder(db, { email: "  Jane@Example.COM ", plan: "pro", source: "pricing<script>" });
  assert.deepEqual(r, { ok: true, email: "jane@example.com", plan: "pro", already: false });
  assert.deepEqual(db.rows, [{ email: "jane@example.com", plan: "pro", source: "pricingscript" }]);
});

test("the same email and plan twice is a success, stored once", async () => {
  const db = fakeDb();
  await savePreorder(db, { email: "jane@example.com", plan: "studio" });
  const again = await savePreorder(db, { email: "JANE@example.com", plan: "studio" });
  assert.equal(again.ok, true);
  assert.equal(again.already, true);
  assert.equal(db.rows.length, 1);
  // Another plan is another pre-order.
  await savePreorder(db, { email: "jane@example.com", plan: "pro" });
  assert.equal(db.rows.length, 2);
});

test("bad input is refused with a message, and nothing is stored", async () => {
  const db = fakeDb();
  assert.equal((await savePreorder(db, { email: "not-an-email", plan: "pro" })).ok, false);
  assert.equal((await savePreorder(db, { email: "a@b", plan: "pro" })).ok, false);
  assert.equal((await savePreorder(db, { email: "jane@example.com", plan: "enterprise" })).ok, false);
  assert.equal((await savePreorder(db, { email: `${"x".repeat(250)}@example.com`, plan: "pro" })).ok, false);
  assert.equal(db.rows.length, 0);
});

test("a bot filling the honeypot gets a normal answer and stores nothing", async () => {
  const db = fakeDb();
  const r = await savePreorder(db, { email: "bot@spam.example", plan: "pro", honeypot: "https://spam.example" });
  assert.equal(r.ok, true);
  assert.equal(db.rows.length, 0);
});

test("a storage failure is reported, not swallowed", async () => {
  const db = fakeDb({ fail: { code: "57014", message: "canceling statement due to statement timeout" } });
  const r = await savePreorder(db, { email: "jane@example.com", plan: "pro" });
  assert.equal(r.ok, false);
  assert.equal(r.unavailable, undefined);
  assert.match(r.error, /try again/);
});

test("a missing table means pre-orders aren't open yet, not 'try again'", async () => {
  for (const code of ["42P01", "PGRST205"]) {
    const db = fakeDb({ fail: { code, message: "relation \"preorders\" does not exist" } });
    const r = await savePreorder(db, { email: "jane@example.com", plan: "pro" });
    assert.equal(r.ok, false);
    assert.equal(r.unavailable, true);
    assert.doesNotMatch(r.error, /try again/);
  }
});
