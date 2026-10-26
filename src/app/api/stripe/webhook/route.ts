import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { handleStripeWebhook } from "@/lib/billing/webhook";

/**
 * Stripe → Septune. Configure the endpoint as
 * https://www.septune.dev/api/stripe/webhook (npm run stripe:setup does
 * it) and set STRIPE_WEBHOOK_SECRET to its signing secret. The signature is
 * checked against the raw body, so the body must not be parsed first.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const db = createAdminClient();
  if (!stripe || !secret || !db) {
    return NextResponse.json(
      { error: "Billing isn't configured: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and SUPABASE_SECRET_KEY are required." },
      { status: 503 },
    );
  }
  const res = await handleStripeWebhook(await req.text(), req.headers.get("stripe-signature"), { stripe, db, secret });
  return NextResponse.json(res.body, { status: res.status });
}
