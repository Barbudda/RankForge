# Deploying Septune to Vercel

Sections 1 to 5 get the app running; section 6 is the checklist to go live and take payments.

Septune runs fully on Vercel. The **deterministic audit, mechanical fixes, and
the extractive chatbot need no AI key**. A generative LLM only adds nicer
fixes/chat. Follow this once.

## 1. Push to GitHub + import on Vercel
- Push this repo to GitHub, then "Add New… → Project" on Vercel and import it.
- Framework preset: **Next.js** (auto-detected). No build config needed.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

**Required (the app needs Supabase for auth + data):**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://septune-xxxx.vercel.app` (used for canonicals, OG, the MCP endpoint shown in-app). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API → publishable/anon key. All of the app's own data access runs through this under row-level security. Only the monitoring cron needs the secret key (section 5). |

**Optional: turn on the agent for your friend (pick one).**

| Variable | Effect |
|---|---|
| `RANKFORGE_MCP_PUBLIC=1` | Opens the `/api/mcp` agent endpoint so your friend can connect their editor with no token. SSRF protection still blocks internal hosts. Easiest for a demo. |
| `RANKFORGE_MCP_KEY=<secret>` | Instead requires this as a `Authorization: Bearer <secret>` header. Share the secret with your friend. |

**Optional: generative features (not required).**

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI fixes for judgment-heavy issues, audit content-quality enrichment, and a generative (vs extractive) chatbot. Costs per token. Without it, everything deterministic still works. |

> Do **not** set `RANKFORGE_LLM` (ollama/claude-cli) on Vercel. Those are local-only.

## 3. Supabase setup (once)
- **Run the migrations** in `supabase/migrations/` (SQL editor, in order `0001 → 0002 → 0003 → 0004 → 0005 → 0006`) if you haven't. `0003` (hardening/unique indexes) is required for correct upserts; `0004` creates the monitoring tables; `0005` adds billing and locks plan, billing and check-result columns against users; `0006` stores pre-orders.
- **Auth → URL Configuration**: set **Site URL** to your Vercel URL, and add
  `https://your-vercel-url/**` to **Redirect URLs** (so email confirmation and
  password reset land back on the deployed app).
- (Optional) In Auth → Providers → Email, turn **off** "Confirm email" for a
  frictionless demo, or leave it on and your friend clicks the email link.

## 4. Deploy & share
- Deploy. Send your friend the Vercel URL. They can:
  - **Sign up** → **Dashboard**.
  - **Connect a repository** (name + a production URL) and **Run an audit**. The
    deterministic engine crawls that public URL and reports real issues.
  - Open the audit → **Prepare fixes** → review the per-file diffs → **Open PR**.
  - Ask the **support chatbot** (bottom-right) anything about Septune.
  - **Use in your editor** (top-right button): connect Claude Code / Cursor / VS
    Code to the hosted agent and audit **any public site** from their editor.

## 5. Monitoring (the paid feature)

Septune checks each monitored site on a schedule, compares the check with the
previous one and sends alerts. It needs, on top of sections 2 and 3:

| Variable | Value |
|---|---|
| `CRON_SECRET` | A long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Vercel Cron sends it as a Bearer token; `/api/cron/monitor` refuses any other caller. |
| `SUPABASE_SECRET_KEY` | Supabase → API → secret key. Server-only: the cron reads every monitor across accounts. Never prefix it with `NEXT_PUBLIC_`. |
| `RESEND_API_KEY` | resend.com → API Keys. Without it, checks still run and are stored, but no email goes out. |
| `RANKFORGE_ALERT_FROM` | Optional sender, e.g. `Septune <alerts@your-domain.com>`, on a domain verified in Resend. Until then Resend only delivers to the account owner's address. |
| `CRUX_API_KEY` | Optional: Core Web Vitals of real users (Google Cloud → APIs → Chrome UX Report API). |
| `NEXT_PUBLIC_RANKFORGE_BILLING` | Leave unset until payments work: Pro and Studio buttons lead to the pre-order page. Set to `open` to switch them to checkout. |

- The schedule lives in `vercel.json` (`/api/cron/monitor` every day at 07:00 UTC).
  Vercel Hobby allows one run per day, which is what daily plans need.
- **Vercel Hobby forbids commercial use**: move to Vercel Pro before turning on
  billing.
- `/monitoring` shows what is still missing (migration, cron, email) until all of
  it is in place.

## 6. Go live: taking payments

Do it in this order. **Settings → Go-live checklist** shows what is still
missing (set `RANKFORGE_ADMIN_EMAILS` to your email to see it); it never shows
a key's value.

**Supabase**
1. Run `supabase/migrations/0005_billing.sql` in the SQL editor.
2. Auth → URL Configuration: **Site URL** `https://www.rank-forge.dev`, and
   `https://www.rank-forge.dev/**` in **Redirect URLs**.
3. Auth → Emails → **SMTP Settings**: connect your own sender. Supabase's
   built-in sender only delivers to your organization's members, two emails an
   hour: without custom SMTP, real users never get their confirmation email.
   With Resend: host `smtp.resend.com`, port `465`, user `resend`, password a
   Resend API key, sender e.g. `Septune <hello@rank-forge.dev>` once
   `rank-forge.dev` is verified in Resend (the same domain serves the alerts).

**Stripe**
4. Activate the account (business details, bank account). Stripe checks the
   site for terms, refunds and contact details: `/terms` covers paid plans,
   cancellation and refunds; `/privacy` the data; `/legal` the publisher (step 9).
5. Test mode first: put an `sk_test_…` key in `.env.local`, then run
   `npm run stripe:setup -- --webhook-url https://www.rank-forge.dev/api/stripe/webhook`.
   It creates the Pro and Studio prices, the customer portal and the webhook,
   and prints `STRIPE_WEBHOOK_SECRET` and `STRIPE_PORTAL_CONFIGURATION`.
   Test a checkout with the card `4242 4242 4242 4242`.
6. Live: same command with the `sk_live_…` key; put the live values in Vercel
   (Production).
7. If you're under the VAT exemption (franchise en base), add
   "TVA non applicable, art. 293 B du CGI" to the invoice footer (Stripe →
   Settings → Invoices). If you charge VAT, set up Stripe Tax and
   `STRIPE_AUTOMATIC_TAX=1`.

**Vercel**
8. Move the project to Vercel Pro: Hobby forbids commercial use.
9. Production variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PORTAL_CONFIGURATION`, `SUPABASE_SECRET_KEY`, `CRON_SECRET`,
   `RESEND_API_KEY`, `RANKFORGE_ALERT_FROM`, `RANKFORGE_ADMIN_EMAILS`, and the
   publisher details `LEGAL_NAME`, `LEGAL_STATUS`, `LEGAL_ADDRESS`,
   `LEGAL_SIRET`, `LEGAL_EMAIL` (`LEGAL_VAT`, `LEGAL_PHONE` optional). `/legal`
   stays hidden until the first four are set.
10. When the checklist is green: `NEXT_PUBLIC_RANKFORGE_BILLING=open`, redeploy.
    Checkout replaces the pre-order buttons on `/billing` and the pricing page.
11. Tell the people who pre-ordered: `npm run preorders:notify` lists them,
    `npm run preorders:notify -- --send` emails each one once (through Resend)
    and marks them notified. Run it after step 10, not before.

**Selling to consumers?** If individuals (not only businesses) can subscribe,
the 14-day withdrawal right in `/terms` applies, and French law requires a
consumer mediator named on the site. Selling to professionals only avoids
both, but has to be stated and enforced at checkout. Decide before step 10.

## What works without any AI key
Deterministic audit (crawl + rules + link graph + measured images/links + content
analysis), mechanical fixes (robots, sitemap, viewport, lang, canonical, schema,
OpenGraph), the change report + PR flow, and the RAG chatbot (extractive).

## Note on the agent + localhost
A **hosted** agent audits **public URLs**: it crawls from Vercel and can't reach
a user's `localhost`. To audit a local dev server, use the open-source CLI's MCP
server on that machine (`claude mcp add septune -- npx -y septune mcp`)
or the Claude Code plugin (`/plugin install septune@septune`).
