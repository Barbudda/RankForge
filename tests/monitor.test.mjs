// End-to-end test of the monitoring pipeline (src/lib/monitor/process.ts)
// without a database or the network: the real code is bundled with esbuild,
// Supabase is replaced by an in-memory stand-in, and the outbound calls to
// Resend and Slack are intercepted. A local fixture site plays the monitored
// production site and regresses between two checks.
//
// Run: node --test tests/monitor.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The fixture is local, so the SSRF guard must allow 127.0.0.1 here.
process.env.RANKFORGE_ALLOW_LOCAL = "1";
process.env.RESEND_API_KEY = "re_test_key";
process.env.RANKFORGE_ALERT_FROM = "Septune <alerts@example.test>";
delete process.env.CRUX_API_KEY;

let processMonitor;
let server;
let base;
const state = { regressed: false };
const outbound = []; // intercepted Resend / Slack calls

const page = (title, extra = "") =>
  `<!doctype html><html lang="en"><head><title>${title}</title>
  <meta name="description" content="${title}: a page of the monitored fixture site.">
  <meta name="viewport" content="width=device-width, initial-scale=1">${extra}</head>
  <body><h1>${title}</h1><p>Real content about ${title.toLowerCase()} for the fixture.</p>
  <a href="/">Home</a> <a href="/pricing">Pricing</a> <a href="/docs">Docs</a></body></html>`;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-monitor-"));
  await build({
    entryPoints: [join(ROOT, "src/lib/monitor/process.ts")],
    outfile: join(outDir, "process.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    logLevel: "silent",
  });
  ({ processMonitor } = await import(pathToFileURL(join(outDir, "process.mjs")).href));

  server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];
    const html = { "content-type": "text/html; charset=utf-8" };
    if (path === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
    }
    if (path === "/sitemap.xml") {
      res.writeHead(200, { "content-type": "application/xml" });
      return res.end(`<urlset>${["/", "/pricing", "/docs"].map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`);
    }
    if (path === "/") return res.writeHead(200, html), res.end(page("Home", `<link rel="canonical" href="${base}/">`));
    if (path === "/pricing") {
      return res.writeHead(200, html), res.end(page("Pricing", `<link rel="canonical" href="${base}/pricing">${state.regressed ? '<meta name="robots" content="noindex">' : ""}`));
    }
    if (path === "/docs" && !state.regressed) return res.writeHead(200, html), res.end(page("Docs", `<link rel="canonical" href="${base}/docs">`));
    res.writeHead(404, html);
    res.end("<h1>Not found</h1>");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;

  // Intercept Resend and Slack; everything else (the fixture) goes through.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://api.resend.com/") || url.startsWith("https://hooks.slack.com/")) {
      outbound.push({ url, body: JSON.parse(init.body), auth: init.headers?.authorization });
      return new Response(JSON.stringify({ id: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return realFetch(input, init);
  };
});

after(() => server?.close());

/** Minimal stand-in for the two Supabase calls processMonitor makes. */
function fakeDb() {
  const tables = { monitor_checks: [], monitors: [] };
  const deletes = [];
  return {
    tables,
    deletes,
    from(name) {
      return {
        insert: async (row) => {
          tables[name].push(row);
          return { error: null };
        },
        update: (patch) => ({
          eq: async (col, val) => {
            tables[name].push({ ...patch, [col]: val, _update: true });
            return { error: null };
          },
        }),
        delete: () => ({
          eq: (col, val) => ({
            lt: async (col2, cutoff) => {
              tables[name] = tables[name].filter((r) => !(r[col] === val && r[col2] && r[col2] < cutoff));
              deletes.push({ table: name, [col]: val, before: cutoff });
              return { error: null };
            },
          }),
        }),
      };
    },
  };
}

const site = () => ({ name: "acme/site", productionUrl: `${base}/`, framework: "nextjs" });

test("first check stores a baseline and sends the day-one email", async () => {
  outbound.length = 0;
  state.regressed = false;
  const db = fakeDb();
  const monitor = {
    repo_id: "repo_1", user_id: "user_1", enabled: true, frequency: "daily",
    alert_email: "owner@example.test", webhook_url: "https://hooks.slack.com/services/T0/B0/X0",
    min_level: "warning", last_check_at: null, last_level: null, last_snapshot: null,
  };
  const r = await processMonitor(db, monitor, site(), { plan: "pro", trigger: "scheduled", appUrl: "https://app.example.test" });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.level, "none");
  assert.match(r.summary, /^First check: score \d+\/100 on 3 pages/);

  const check = db.tables.monitor_checks[0];
  assert.equal(check.status, "ok");
  assert.equal(check.pages, 3);
  const update = db.tables.monitors.find((u) => u._update);
  assert.ok(update.last_snapshot?.pages?.["/pricing"], "the snapshot is stored for the next diff");
  // Retention: checks older than the Pro plan's 12 months are pruned.
  const prune = db.deletes.find((d) => d.table === "monitor_checks" && d.repo_id === "repo_1");
  assert.ok(prune, "old checks are pruned");
  const months = (Date.now() - Date.parse(prune.before)) / (31 * 86_400_000);
  assert.ok(Math.abs(months - 12) < 0.1, `prune window is the plan's history (${months.toFixed(2)} months)`);
  const next = new Date(update.next_check_at).getTime() - Date.now();
  assert.ok(next > 23 * 3600_000 && next < 25 * 3600_000, "daily plan: next check in ~24 h");

  // Day one: email yes (state of the site), Slack no (nothing changed).
  const mails = outbound.filter((o) => o.url.includes("resend"));
  assert.equal(mails.length, 1);
  assert.equal(mails[0].auth, "Bearer re_test_key");
  assert.deepEqual(mails[0].body.to, ["owner@example.test"]);
  assert.match(mails[0].body.subject, /Monitoring is on/);
  assert.equal(outbound.filter((o) => o.url.includes("slack")).length, 0);
});

test("a regression triggers a critical alert by email and Slack", async () => {
  outbound.length = 0;
  state.regressed = false;
  const db = fakeDb();
  const monitor = {
    repo_id: "repo_2", user_id: "user_1", enabled: true, frequency: "daily",
    alert_email: "owner@example.test", webhook_url: "https://hooks.slack.com/services/T0/B0/X0",
    min_level: "warning", last_check_at: null, last_level: null, last_snapshot: null,
  };
  await processMonitor(db, monitor, site(), { plan: "pro", trigger: "scheduled", appUrl: "https://app.example.test" });
  const baseline = db.tables.monitors.find((u) => u._update).last_snapshot;

  state.regressed = true; // /pricing becomes noindex, /docs starts returning 404
  outbound.length = 0;
  const db2 = fakeDb();
  const r = await processMonitor(db2, { ...monitor, last_snapshot: baseline, last_level: "none" }, site(), {
    plan: "pro", trigger: "scheduled", appUrl: "https://app.example.test",
  });
  state.regressed = false;
  assert.equal(r.ok, true, r.error);
  assert.equal(r.level, "critical");
  assert.equal(r.alerted, true);
  const kinds = db2.tables.monitor_checks[0].changes.map((c) => c.kind);
  assert.ok(kinds.includes("noindex-added"), "noindex on /pricing");
  assert.ok(kinds.includes("page-error"), "/docs now 404");

  const mail = outbound.find((o) => o.url.includes("resend"));
  const slack = outbound.find((o) => o.url.includes("slack"));
  assert.match(mail.body.subject, /Critical on acme\/site/);
  assert.match(mail.body.text, /pricing became noindex/);
  assert.ok(slack, "Slack gets the alert too (Pro)");
  assert.match(slack.body.text, /Critical on acme\/site/);
});

test("free plan: weekly cadence and no webhook alerts", async () => {
  outbound.length = 0;
  state.regressed = false;
  const db = fakeDb();
  const monitor = {
    repo_id: "repo_3", user_id: "user_1", enabled: true, frequency: "daily",
    alert_email: null, webhook_url: "https://hooks.slack.com/services/T0/B0/X0",
    min_level: "info", last_check_at: null, last_level: null, last_snapshot: null,
  };
  await processMonitor(db, monitor, site(), { plan: "free", trigger: "scheduled", appUrl: "https://app.example.test", ownerEmail: "me@example.test" });
  const update = db.tables.monitors.find((u) => u._update);
  const next = new Date(update.next_check_at).getTime() - Date.now();
  assert.ok(next > 6 * 86_400_000, "free plan stays weekly even if 'daily' was stored");
  const baseline = update.last_snapshot;

  state.regressed = true;
  outbound.length = 0;
  await processMonitor(fakeDb(), { ...monitor, last_snapshot: baseline }, site(), {
    plan: "free", trigger: "scheduled", appUrl: "https://app.example.test", ownerEmail: "me@example.test",
  });
  state.regressed = false;
  assert.equal(outbound.filter((o) => o.url.includes("slack")).length, 0, "no webhooks on Free");
  const mail = outbound.find((o) => o.url.includes("resend"));
  assert.deepEqual(mail.body.to, ["me@example.test"], "falls back to the account email");
});

test("an unreachable site records an error and alerts once", async () => {
  outbound.length = 0;
  const db = fakeDb();
  const monitor = {
    repo_id: "repo_4", user_id: "user_1", enabled: true, frequency: "daily",
    alert_email: "owner@example.test", webhook_url: null, min_level: "warning",
    last_check_at: null, last_level: "none", last_snapshot: { v: 1, pages: {}, issues: [] },
  };
  const dead = { name: "acme/dead", productionUrl: "http://127.0.0.1:9/", framework: "nextjs" };
  const r = await processMonitor(db, monitor, dead, { plan: "pro", trigger: "scheduled", appUrl: "https://app.example.test" });
  assert.equal(r.ok, false);
  assert.equal(db.tables.monitor_checks[0].status, "error");
  assert.equal(outbound.filter((o) => o.url.includes("resend")).length, 1, "alerts on the first failure");

  outbound.length = 0;
  await processMonitor(fakeDb(), { ...monitor, last_level: "error" }, dead, { plan: "pro", trigger: "scheduled", appUrl: "https://app.example.test" });
  assert.equal(outbound.length, 0, "doesn't repeat the alert while the site stays down");
});
