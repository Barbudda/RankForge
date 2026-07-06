# Deploying RankForge to Vercel (for a friend to test)

RankForge runs fully on Vercel. The **deterministic audit, mechanical fixes, and
the extractive chatbot need no AI key** — a generative LLM only adds nicer
fixes/chat. Follow this once.

## 1. Push to GitHub + import on Vercel
- Push this repo to GitHub, then "Add New… → Project" on Vercel and import it.
- Framework preset: **Next.js** (auto-detected). No build config needed.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

**Required — the app needs Supabase for auth + data:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://rankforge-xxxx.vercel.app` (used for canonicals, OG, the MCP endpoint shown in-app). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API → publishable/anon key. All data access runs through this under row-level security — no service key needed. |

**Optional — turn on the agent for your friend (pick one):**

| Variable | Effect |
|---|---|
| `RANKFORGE_MCP_PUBLIC=1` | Opens the `/api/mcp` agent endpoint so your friend can connect their editor with no token. SSRF protection still blocks internal hosts. Easiest for a demo. |
| `RANKFORGE_MCP_KEY=<secret>` | Instead requires this as a `Authorization: Bearer <secret>` header. Share the secret with your friend. |

**Optional — generative features (not required):**

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI fixes for judgment-heavy issues, audit content-quality enrichment, and a generative (vs extractive) chatbot. Costs per token. Without it, everything deterministic still works. |

> Do **not** set `RANKFORGE_LLM` (ollama/claude-cli) on Vercel — those are local-only.

## 3. Supabase setup (once)
- **Run the migrations** in `supabase/migrations/` (SQL editor, in order `0001 → 0002 → 0003`) if you haven't. `0003` (hardening/unique indexes) is required for correct upserts.
- **Auth → URL Configuration**: set **Site URL** to your Vercel URL, and add
  `https://your-vercel-url/**` to **Redirect URLs** (so email confirmation and
  password reset land back on the deployed app).
- (Optional) In Auth → Providers → Email, turn **off** "Confirm email" for a
  frictionless demo, or leave it on and your friend clicks the email link.

## 4. Deploy & share
- Deploy. Send your friend the Vercel URL. They can:
  - **Sign up** → **Dashboard**.
  - **Connect a repository** (name + a production URL) and **Run an audit** — the
    deterministic engine crawls that public URL and reports real issues.
  - Open the audit → **Prepare fixes** → review the per-file diffs → **Open PR**.
  - Ask the **support chatbot** (bottom-right) anything about RankForge.
  - **Use in your editor** (top-right button): connect Claude Code / Cursor / VS
    Code to the hosted agent and audit **any public site** from their editor.

## What works without any AI key
Deterministic audit (crawl + rules + link graph + measured images/links + content
analysis), mechanical fixes (robots, sitemap, viewport, lang, canonical, schema,
OpenGraph), the change report + PR flow, and the RAG chatbot (extractive).

## Note on the agent + localhost
A **hosted** agent audits **public URLs** — it crawls from Vercel and can't reach
a user's `localhost`. To audit a local dev server, run RankForge locally
(`npm run dev`) and connect the editor to `http://localhost:3000/api/mcp`.
