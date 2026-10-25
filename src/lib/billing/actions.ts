"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { billingReady, getStripe, priceIdFor } from "./stripe";
import { PAID_STATUSES } from "./subscription";
import type { PaidPlan } from "./prices";

/**
 * Checkout and the customer portal. Both end in a redirect to Stripe; on any
 * problem they come back to /billing with a reason the page explains.
 * redirect() throws by design, so it's only ever called outside try/catch.
 */

type BillingError = "unavailable" | "signin" | "price" | "stripe";

async function signedInUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The user's Stripe customer id, created and saved on first use. */
async function customerFor(userId: string, email: string | undefined): Promise<string | null> {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return null;
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, email").eq("id", userId).maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id as string;
  const customer = await stripe.customers.create(
    { email: email ?? (profile?.email as string | undefined), metadata: { user_id: userId } },
    // A double click must not create two customers.
    { idempotencyKey: `septune-customer-${userId}` },
  );
  // The service role writes it: users can't change their own billing fields.
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

async function portalUrl(customerId: string): Promise<string> {
  const stripe = getStripe()!;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.appUrl}/billing`,
    ...(process.env.STRIPE_PORTAL_CONFIGURATION ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION } : {}),
  });
  return session.url;
}

export async function startCheckout(plan: PaidPlan): Promise<void> {
  if (!billingReady()) redirect("/billing?billing_error=unavailable");
  const user = await signedInUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/billing?plan=${plan}`)}`);

  let target: string | BillingError;
  try {
    const stripe = getStripe()!;
    const customerId = await customerFor(user.id, user.email);
    if (!customerId) {
      target = "unavailable";
    } else {
      const { data: subs } = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
      if (subs.some((s) => PAID_STATUSES.has(s.status))) {
        // Already paying: plan changes and cancellation happen in the portal.
        target = await portalUrl(customerId);
      } else {
        const price = await priceIdFor(stripe, plan);
        if (!price) {
          target = "price";
        } else {
          const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "1";
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            client_reference_id: user.id,
            line_items: [{ price, quantity: 1 }],
            subscription_data: { metadata: { user_id: user.id } },
            allow_promotion_codes: true,
            success_url: `${config.appUrl}/billing?checkout=success`,
            cancel_url: `${config.appUrl}/billing?checkout=cancel`,
            ...(automaticTax
              ? {
                  automatic_tax: { enabled: true },
                  billing_address_collection: "required" as const,
                  customer_update: { address: "auto" as const, name: "auto" as const },
                }
              : {}),
          });
          target = session.url ?? "stripe";
        }
      }
    }
  } catch (e) {
    console.error("[billing/checkout]", e instanceof Error ? e.message : e);
    target = "stripe";
  }
  redirect(target.startsWith("https://") ? target : `/billing?billing_error=${target}`);
}

export async function openBillingPortal(): Promise<void> {
  if (!billingReady()) redirect("/billing?billing_error=unavailable");
  const user = await signedInUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/billing")}`);

  let target: string;
  try {
    const customerId = await customerFor(user.id, user.email);
    target = customerId ? await portalUrl(customerId) : "/billing?billing_error=unavailable";
  } catch (e) {
    console.error("[billing/portal]", e instanceof Error ? e.message : e);
    target = "/billing?billing_error=stripe";
  }
  redirect(target);
}
