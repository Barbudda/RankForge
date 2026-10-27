import { BILLING_OPEN } from "@/lib/pricing";
import { config } from "@/lib/config";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseSecretKey } from "@/lib/supabase/env";

/**
 * Go-live checklist: which integrations this deployment has, from the
 * presence of their environment variables. Never returns a value, only
 * whether it's set, and only the operator sees it (RANKFORGE_ADMIN_EMAILS).
 */

export interface IntegrationCheck {
  id: string;
  label: string;
  ok: boolean;
  /** What it unlocks, and what to set when it's missing. */
  detail: string;
  /** Needed for its stage (vs. nice to have). */
  required: boolean;
  /** "live": the site itself, sign-in, pre-orders, monitoring. "payments": only once billing opens. */
  stage: "live" | "payments";
}

/** A required setting missing for the stage the site is in now. */
export function isBlocking(c: IntegrationCheck): boolean {
  return c.required && !c.ok && (c.stage === "live" || BILLING_OPEN);
}

const set = (...names: string[]) => names.every((n) => Boolean(process.env[n]));

export function integrationChecks(): IntegrationCheck[] {
  const appUrl = new URL(config.appUrl);
  return [
    {
      id: "app-url",
      label: "Public site URL",
      ok: appUrl.protocol === "https:" && appUrl.hostname !== "localhost",
      detail: `Canonicals, emails and Stripe redirects use ${config.appUrl}. Set NEXT_PUBLIC_APP_URL to https://www.septune.dev in production.`,
      required: true,
      stage: "live",
    },
    {
      id: "supabase",
      label: "Supabase (sign-in, data)",
      ok: Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY),
      detail: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Without them the app runs on sample data and nobody can sign in.",
      required: true,
      stage: "live",
    },
    {
      id: "supabase-admin",
      label: "Supabase service key",
      ok: Boolean(supabaseSecretKey()),
      detail: "SUPABASE_SECRET_KEY: pre-orders, scheduled checks, \"Check now\" and the Stripe webhook write with it. Server-only.",
      required: true,
      stage: "live",
    },
    {
      id: "stripe",
      label: "Stripe",
      ok: set("STRIPE_SECRET_KEY"),
      detail: "STRIPE_SECRET_KEY (sk_live_… in production). Then run npm run stripe:setup to create the prices, portal and webhook.",
      required: true,
      stage: "payments",
    },
    {
      id: "stripe-webhook",
      label: "Stripe webhook",
      ok: set("STRIPE_WEBHOOK_SECRET"),
      detail: "STRIPE_WEBHOOK_SECRET, printed by npm run stripe:setup. Without it a payment never upgrades the account.",
      required: true,
      stage: "payments",
    },
    {
      id: "stripe-portal",
      label: "Stripe customer portal",
      ok: set("STRIPE_PORTAL_CONFIGURATION"),
      detail: "STRIPE_PORTAL_CONFIGURATION, printed by npm run stripe:setup (or activate the portal in the Stripe dashboard).",
      required: false,
      stage: "payments",
    },
    {
      id: "billing-open",
      label: "Payments open",
      ok: BILLING_OPEN,
      detail: "NEXT_PUBLIC_RANKFORGE_BILLING=open, once everything above is green. Until then Pro and Studio take pre-orders.",
      required: false,
      stage: "payments",
    },
    {
      id: "cron",
      label: "Scheduled checks",
      ok: set("CRON_SECRET"),
      detail: "CRON_SECRET: Vercel Cron calls /api/cron/monitor with it every day (vercel.json).",
      required: true,
      stage: "live",
    },
    {
      id: "email",
      label: "Alert emails",
      ok: set("RESEND_API_KEY"),
      detail: "RESEND_API_KEY, plus RANKFORGE_ALERT_FROM on a domain verified in Resend (alerts@septune.dev).",
      required: true,
      stage: "live",
    },
    {
      id: "email-from",
      label: "Alert sender domain",
      ok: set("RANKFORGE_ALERT_FROM"),
      detail: "RANKFORGE_ALERT_FROM. Until the domain is verified in Resend, alerts only reach the Resend account owner.",
      required: true,
      stage: "live",
    },
    {
      id: "crux",
      label: "Core Web Vitals",
      ok: set("CRUX_API_KEY"),
      detail: "CRUX_API_KEY (Google Cloud, Chrome UX Report API). Optional: checks run without it.",
      required: false,
      stage: "live",
    },
  ];
}

/** Whether this signed-in email is an operator of this deployment. */
export function isOperator(email: string | null | undefined): boolean {
  const list = (process.env.RANKFORGE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && list.includes(email.toLowerCase()));
}
