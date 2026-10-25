// Billing: the Stripe webhook → profile plan, with real Stripe signatures
// (generated offline by the SDK) against a fake database and a fake list of
// subscriptions. The real code is bundled with esbuild, as in monitor.test.
// Run: npm run test:billing
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import Stripe from "stripe";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECRET = "whsec_rankforge_test";
const sdk = new Stripe("sk_test_offline");

let handleStripeWebhook;
let billingFieldsFor;

before(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "rf-billing-"));
  await build({
    entryPoints: [join(ROOT, "src/lib/billing/webhook.ts"), join(ROOT, "src/lib/billing/subscription.ts")],
    outdir: outDir,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    tsconfig: join(ROOT, "tsconfig.json"),
    external: ["stripe"],
    logLevel: "silent",
  });
  ({ handleStripeWebhook } = await import(pathToFileURL(join(outDir, "webhook.js")).href));
  ({ billingFieldsFor } = await import(pathToFileURL(join(outDir, "subscription.js")).href));
});

// ── fakes ──────────────────────────────────────────────────────────────
function fakeDb(profiles) {
  const events = [];
  const updates = [];
  const db = {
    profiles,
    events,
    updates,
    from(table) {
      return {
        insert: async (row) => {
          if (table === "billing_events" && events.some((e) => e.id === row.id)) {
            return { error: { code: "23505", message: "duplicate key" } };
          }
          if (table === "billing_events") events.push(row);
          return { error: null };
        },
        update: (fields) => ({
          eq: (col, val) => ({
            select: async () => {
              const hit = profiles.filter((p) => p[col] === val);
              for (const p of hit) Object.assign(p, fields);
              updates.push({ table, fields, col, val, matched: hit.length });
              return { data: hit.map((p) => ({ id: p.id })), error: null };
            },
          }),
        }),
        delete: () => ({
          eq: async (col, val) => {
            const i = events.findIndex((e) => e[col] === val);
            if (i > -1) events.splice(i, 1);
            return { error: null };
          },
        }),
      };
    },
  };
  return db;
}

const sub = ({ id, status, lookupKey, created = 1_790_000_000, cancelAt = null }) => ({
  id,
  object: "subscription",
  status,
  created,
  cancel_at: cancelAt,
  customer: "cus_123",
  items: {
    data: [{ id: `si_${id}`, current_period_end: 1_792_000_000, price: { id: `price_${lookupKey}`, lookup_key: lookupKey } }],
  },
});

function deps(db, subscriptions, { fail = false } = {}) {
  return {
    db,
    secret: SECRET,
    stripe: {
      webhooks: sdk.webhooks,
      subscriptions: {
        list: async ({ customer }) => {
          if (fail) throw new Error("Stripe is down");
          assert.equal(customer, "cus_123");
          return { data: subscriptions };
        },
      },
    },
  };
}

function signed(event) {
  const payload = JSON.stringify(event);
  return { payload, header: sdk.webhooks.generateTestHeaderString({ payload, secret: SECRET }) };
}

const checkoutEvent = (id = "evt_checkout") => ({
  id,
  object: "event",
  type: "checkout.session.completed",
  data: { object: { object: "checkout.session", customer: "cus_123", client_reference_id: "user_1", mode: "subscription" } },
});

// ── tests ──────────────────────────────────────────────────────────────
test("a completed checkout puts the account on Pro", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: "cus_123" }]);
  const { payload, header } = signed(checkoutEvent());
  const res = await handleStripeWebhook(payload, header, deps(db, [sub({ id: "sub_1", status: "active", lookupKey: "rankforge_pro_monthly" })]));
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.plan, "pro");
  const p = db.profiles[0];
  assert.equal(p.plan, "pro");
  assert.equal(p.stripe_subscription_id, "sub_1");
  assert.equal(p.subscription_status, "active");
  assert.equal(p.current_period_end, new Date(1_792_000_000 * 1000).toISOString(), "period end read from the subscription item");
});

test("the same event delivered twice is applied once", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: "cus_123" }]);
  const d = deps(db, [sub({ id: "sub_1", status: "active", lookupKey: "rankforge_pro_monthly" })]);
  const { payload, header } = signed(checkoutEvent("evt_twice"));
  await handleStripeWebhook(payload, header, d);
  const again = await handleStripeWebhook(payload, header, d);
  assert.equal(again.status, 200);
  assert.equal(again.body.duplicate, true);
  assert.equal(db.updates.length, 1);
});

test("a forged or tampered event is rejected and changes nothing", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: "cus_123" }]);
  const { payload } = signed(checkoutEvent());
  const forged = sdk.webhooks.generateTestHeaderString({ payload, secret: "whsec_someone_else" });
  const res = await handleStripeWebhook(payload, forged, deps(db, []));
  assert.equal(res.status, 400);
  const tampered = await handleStripeWebhook(payload.replace("user_1", "user_2"), signed(checkoutEvent()).header, deps(db, []));
  assert.equal(tampered.status, 400);
  assert.equal(await handleStripeWebhook(payload, null, deps(db, [])).then((r) => r.status), 400);
  assert.equal(db.profiles[0].plan, "free");
  assert.equal(db.events.length, 0);
});

test("a cancelled subscription returns the account to Free", async () => {
  const db = fakeDb([{ id: "user_1", plan: "pro", stripe_customer_id: "cus_123" }]);
  const event = {
    id: "evt_deleted",
    object: "event",
    type: "customer.subscription.deleted",
    data: { object: sub({ id: "sub_1", status: "canceled", lookupKey: "rankforge_pro_monthly" }) },
  };
  const { payload, header } = signed(event);
  const res = await handleStripeWebhook(payload, header, deps(db, [sub({ id: "sub_1", status: "canceled", lookupKey: "rankforge_pro_monthly" })]));
  assert.equal(res.status, 200);
  assert.equal(db.profiles[0].plan, "free");
  assert.equal(db.profiles[0].subscription_status, "canceled");
});

test("plan rules: past_due keeps the plan, the best paid subscription wins, unknown prices grant nothing", () => {
  assert.equal(billingFieldsFor([sub({ id: "a", status: "past_due", lookupKey: "rankforge_studio_monthly" })]).plan, "studio");
  assert.equal(billingFieldsFor([sub({ id: "a", status: "unpaid", lookupKey: "rankforge_pro_monthly" })]).plan, "free");
  assert.equal(billingFieldsFor([sub({ id: "a", status: "incomplete", lookupKey: "rankforge_pro_monthly" })]).plan, "free");
  const both = billingFieldsFor([
    sub({ id: "old", status: "canceled", lookupKey: "rankforge_studio_monthly", created: 1_795_000_000 }),
    sub({ id: "new", status: "active", lookupKey: "rankforge_pro_monthly", created: 1_790_000_000 }),
  ]);
  assert.equal(both.plan, "pro");
  assert.equal(both.stripe_subscription_id, "new");
  assert.equal(billingFieldsFor([sub({ id: "x", status: "active", lookupKey: "someone_elses_price" })]).plan, "free");
  const cancelling = billingFieldsFor([sub({ id: "c", status: "active", lookupKey: "rankforge_pro_monthly", cancelAt: 1_793_000_000 })]);
  assert.equal(cancelling.plan, "pro", "still paid until the end of the period");
  assert.equal(cancelling.cancel_at, new Date(1_793_000_000 * 1000).toISOString());
  assert.deepEqual(billingFieldsFor([]), { plan: "free", stripe_subscription_id: null, subscription_status: null, current_period_end: null, cancel_at: null });
});

test("a profile not linked to the customer yet is found through the checkout's user id", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: null }]);
  const { payload, header } = signed(checkoutEvent("evt_link"));
  const res = await handleStripeWebhook(payload, header, deps(db, [sub({ id: "sub_1", status: "active", lookupKey: "rankforge_studio_monthly" })]));
  assert.equal(res.status, 200);
  assert.equal(res.body.matched, true);
  assert.equal(db.profiles[0].plan, "studio");
  assert.equal(db.profiles[0].stripe_customer_id, "cus_123");
});

test("events RankForge doesn't use are acknowledged and ignored", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: "cus_123" }]);
  const { payload, header } = signed({ id: "evt_other", object: "event", type: "invoice.created", data: { object: { customer: "cus_123" } } });
  const res = await handleStripeWebhook(payload, header, deps(db, []));
  assert.equal(res.status, 200);
  assert.equal(res.body.ignored, "invoice.created");
  assert.equal(db.events.length, 0);
});

test("when Stripe can't be read, the webhook fails so Stripe retries it", async () => {
  const db = fakeDb([{ id: "user_1", plan: "free", stripe_customer_id: "cus_123" }]);
  const { payload, header } = signed(checkoutEvent("evt_retry"));
  const res = await handleStripeWebhook(payload, header, deps(db, [], { fail: true }));
  assert.equal(res.status, 500);
  assert.equal(db.events.length, 0, "the event is forgotten, so the retry is applied");
  const retry = await handleStripeWebhook(payload, header, deps(db, [sub({ id: "sub_1", status: "active", lookupKey: "rankforge_pro_monthly" })]));
  assert.equal(retry.status, 200);
  assert.equal(db.profiles[0].plan, "pro");
});
