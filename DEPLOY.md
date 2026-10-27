# Deploying Septune to Vercel

Sections 1 to 5 get the app running; section 6 is the checklist to go live and take payments.

Septune runs fully on Vercel. **No paid feature calls an AI model**: the
deterministic audit, mechanical fixes, monitoring and the extractive chatbot
need no key, so production runs without one (see "Costs and limits" at the
end). Follow this once.

## 1. Push to GitHub + import on Vercel
- Push this repo to GitHub, then "Add New… → Project" on Vercel and import it.
- Framework preset: **Next.js** (auto-detected). No build config needed.
- Domain: in Vercel → Project → Settings → **Domains**, `www.septune.dev` is
  the primary domain and `septune.dev` redirects to it. Every absolute URL in
  the code uses `https://www.septune.dev`. Changing domain later: see
  "Changing the domain" at the end.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

**Required (the app needs Supabase for auth + data):**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://www.septune.dev`. Canonicals, the sitemap, OG, emails, Stripe and Supabase links all use it. `NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing it. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API → publishable/anon key. All of the app's own data access runs through this under row-level security. Only the monitoring cron needs the secret key (section 5). |

**Optional: open the hosted agent (pick one).**

| Variable | Effect |
|---|---|
| `RANKFORGE_MCP_PUBLIC=1` | Opens the `/api/mcp` agent endpoint: anyone can connect their editor with no token. SSRF protection still blocks internal hosts, and tools that crawl a site are capped at 20 per hour per address. |
| `RANKFORGE_MCP_KEY=<secret>` | Instead requires this as an `Authorization: Bearer <secret>` header. |

**Optional: generative extras. Leave unset in production.**

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Adds AI fixes for judgment-heavy issues (3 model calls per fix), a content-quality pass on in-app audits (1 call per audit) and a generative chatbot (1 call per message), all billed per token. No paid feature needs it. If you set it, set a monthly spend limit in the Claude Console first (see "Costs and limits"). |

> Do **not** set `RANKFORGE_LLM` (ollama/claude-cli) on Vercel. Those are local-only.

## 3. Supabase setup (once)
- **Run the migrations** in `supabase/migrations/` (SQL editor, in order `0001 → 0002 → 0003 → 0004 → 0005 → 0006`). Each one is safe to run again, so when in doubt, run all six. `0003` (hardening/unique indexes) is required for correct upserts; `0004` creates the monitoring tables; `0005` adds billing and locks plan, billing and check-result columns against users; `0006` stores pre-orders.
- **Auth → URL Configuration**: set **Site URL** to `https://www.septune.dev`,
  and add `https://www.septune.dev/**` to **Redirect URLs** (so email
  confirmation and password reset land back on the site). A Site URL on a
  domain that no longer resolves breaks every confirmation link.
- Keep **Confirm email** on (Auth → Providers → Email). Real users only get the
  email once your own SMTP sender is set (section 6, step 3).

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
2. Auth → URL Configuration: **Site URL** `https://www.septune.dev`, and
   `https://www.septune.dev/**` in **Redirect URLs**.
3. Auth → Emails → **SMTP Settings**: connect your own sender. Supabase's
   built-in sender only delivers to your organization's members, two emails an
   hour: without custom SMTP, real users never get their confirmation email.
   With Resend: host `smtp.resend.com`, port `465`, user `resend`, password a
   Resend API key, sender e.g. `Septune <hello@septune.dev>` once
   `septune.dev` is verified in Resend (the same domain serves the alerts).

**Stripe**
4. Activate the account (business details, bank account). Stripe checks the
   site for terms, refunds and contact details: `/terms` covers paid plans,
   cancellation and refunds; `/privacy` the data; `/legal` the publisher (step 9).
5. Test mode first: put an `sk_test_…` key in `.env.local`, then run
   `npm run stripe:setup -- --webhook-url https://www.septune.dev/api/stripe/webhook`.
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

## Costs and limits
**Without any AI key**, everything that's sold works: the deterministic audit
(crawl, rules, link graph, measured images and links, content analysis),
mechanical fixes (robots, sitemap, viewport, lang, canonical, schema,
OpenGraph), the change report, monitoring and alerts, and the chatbot
(extractive answers from the docs). Judgment-heavy fixes go through the user's
own coding assistant with the Septune agent, on their subscription.

What runs on our servers, and what bounds it:

| Feature | Bound |
|---|---|
| Free audit (`/audit`) | 3 pages, 15 s crawl budget, 6 per hour per address |
| Noindex checker, llms.txt generator | 30 and 10 per hour per address |
| Hosted agent (`/api/mcp`) | Closed unless `RANKFORGE_MCP_PUBLIC` or `RANKFORGE_MCP_KEY`; 20 crawls per hour per address |
| Support chat (`/api/chat`) | 30 messages per hour per address |
| In-app audits | 10 per hour per user |
| Monitoring | The plan's sites, pages and frequency; "Check now" at most every 3 minutes per site |

The CLI, the local MCP server, the Claude Code plugin and the GitHub Action
run on the user's machine or CI: they cost nothing here. The hourly limits
live in each server instance's memory, so they slow abuse down rather than
count exactly.

Spend caps outside the code:
- **Vercel Pro → Settings → Billing → Spend Management**: set an on-demand
  budget; Vercel emails at 50, 75 and 100 %. "Pause Production Deployments"
  also exists, but it takes the whole site down, monitoring included.
- **If you ever set `ANTHROPIC_API_KEY`**: set a monthly spend limit first
  (platform.claude.com/settings/billing, "Spend limits"). Past it, the API
  refuses and Septune falls back to its deterministic answers.

## Changing the domain
1. Vercel → Domains: add the new domain, make it primary, redirect the others.
2. `NEXT_PUBLIC_APP_URL` → the new origin, then redeploy.
3. Supabase → Auth → URL Configuration: Site URL and Redirect URLs.
4. Resend: verify the new domain, then update `RANKFORGE_ALERT_FROM`.
5. Stripe: edit the webhook endpoint URL (Developers → Webhooks).
6. Search Console: add the new domain and submit `/sitemap.xml`. File a change
   of address only if the old domain still exists and redirects.
7. The code: `src/lib/net/user-agent.ts`, `cli/src/index.ts` (`APP_URL`), the
   READMEs, `scripts/public/` and this file. Then re-export the public repo.

## Note on the agent + localhost
A **hosted** agent audits **public URLs**: it crawls from Vercel and can't reach
a user's `localhost`. To audit a local dev server, use the open-source CLI's MCP
server on that machine (`claude mcp add septune -- npx -y septune mcp`)
or the Claude Code plugin (`/plugin install septune@septune`).
