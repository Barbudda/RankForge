# Septune

[![npm](https://img.shields.io/npm/v/septune?label=septune&color=34e0a1)](https://www.npmjs.com/package/septune) [![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE) [![node](https://img.shields.io/badge/node-%E2%89%A518-green)](https://nodejs.org) [![MCP](https://img.shields.io/badge/MCP-server-708cff)](https://www.septune.dev/docs/agent)

> **The CLI, the editor agent and the GitHub Action now live in their own public repo: [Barbudda/septune](https://github.com/Barbudda/septune)**, with the full guide. This repo is the hosted web app.

**Deterministic technical-SEO audit for your site, from the terminal, your CI, or your editor, plus hosted monitoring that tells you when a deploy breaks SEO. No AI required, no API keys, no telemetry in the CLI.**

```bash
npx septune audit https://your-site.com
```

Septune crawls a site the way a search engine sees it, **measures** every technical-SEO issue (it doesn't guess), and prints a scored report with the exact affected URLs, plus ready-to-apply patches for the mechanical ones.

```
Septune audit  https://your-site.com/
25 pages · 6.2s · deterministic, no AI, no external API
every linked page crawled · 31 sitemap URLs

Score  87/100
  metadata          ███████████░   93
  indexing          █████████░░░   76
  structure         ███████████░   95
  images            ████████████  100
  schema            ███████████░   96
  internal-linking  ██████████░░   86
  performance       ████████████   96
  framework         ████████████  100

Issues (8)
  CRITICAL Pages set to noindex (1)
           1 pages carry a noindex directive (robots meta tag or X-Robots-Tag header).
           → /pricing
  MEDIUM   Pages missing a canonical URL (2) · fix template
           2 of 24 indexable pages declare no canonical.
           → /about, /blog
  MEDIUM   Missing internal links between related pages (8)
           8 high-similarity internal-link opportunities (computed from on-site content).
           → /, /pricing, /docs +5 more
  …

Site signals  1 orphan page · max click depth 2 · 8 internal-link suggestions

✚ 2 issues have a ready patch: septune fix <ruleId> --framework <fw>
```

## Why deterministic

Most of technical SEO is something your **code controls** and something a machine can **check by measuring**, so Septune does exactly that. Every finding comes with evidence from the page. Nothing is hallucinated, nothing needs a model, nothing phones home. It runs in seconds, for free, forever.

What it measures on every crawl:

- **Metadata**: missing/duplicate titles and descriptions, length, OpenGraph & Twitter cards
- **Indexing**: canonicals (missing or pointing elsewhere), `noindex`, `<html lang>`, redirect chains, near-duplicate content (shingles)
- **Structure**: H1s, skipped heading levels, thin pages, readability, keyword stuffing, title↔content alignment (TF-IDF)
- **Images**: missing alt, missing dimensions (CLS), lazy-loading, **real byte weights** and legacy formats (measured over HTTP)
- **Structured data**: missing JSON-LD, invalid schema.org (required properties), homepage Organization/WebSite
- **Internal linking**: orphan pages, click depth, **broken links (real HTTP status)**, generic anchors, and semantic link suggestions from an internal link graph + local embeddings
- **Performance**: TTFB, render-blocking resources, oversized HTML, viewport, mixed content
- **Framework**: sitemap/robots presence and conventions for Next.js, Nuxt, Astro, SvelteKit, Remix, Vite, MDX, static

## Install & use

Node 18+. Zero dependencies.

```bash
# one-off
npx septune audit https://your-site.com

# or install globally
npm i -g septune
septune audit http://localhost:3000        # your dev server, before you deploy
septune audit https://your-site.com --pages 12 --framework astro
septune audit https://your-site.com --json  # machine-readable
septune diff https://your-site.com http://localhost:3000   # what your change breaks
septune watch https://your-site.com         # compare with a saved baseline
```

### Gate your CI

Comment on every pull request with what changed compared with production, and fail it when the preview would drop pages from search (new `noindex`, pages that start failing, robots.txt blocking Google):

```yaml
- uses: Barbudda/septune@v0.3.0
  with:
    url: ${{ steps.deploy.outputs.preview-url }}
    baseline-url: https://your-site.com
```

Or gate on the score alone: `septune audit https://staging.your-site.com --fail-under 80`.

### Ready-to-apply patches

Mechanical issues get a real, framework-idiomatic diff, with no model involved:

```bash
septune fix framework-robots-missing --framework nextjs
septune fix indexing-canonical-missing --framework astro --url https://your-site.com
septune rules   # the full catalog
```

## In your editor (MCP)

Septune also ships as an **MCP server**, so Claude Code, Cursor, VS Code or Windsurf can run the audit, compare your local version with production, get fix templates, then patch the repo they already have open. Septune does the measuring; your assistant does the reasoning.

```bash
# Claude Code plugin (MCP tools + /septune:seo and /septune:check)
/plugin marketplace add Barbudda/septune
/plugin install septune@septune

# or the bare MCP server, in any client
claude mcp add septune -- npx -y septune mcp
```

Then: *"Use septune to audit http://localhost:3000 and fix what you find."*
Setup for every client → [www.septune.dev/docs/agent](https://www.septune.dev/docs/agent)

## The hosted app

[www.septune.dev](https://www.septune.dev) is the same engine with an account: audit history, a **change report grouped by file** with every diff, and **monitoring**: Septune checks your production site on a schedule, compares each check with the previous one, and alerts you by email, Slack, Discord or webhook when something critical changes. Free covers one site checked weekly; Pro (5 sites, daily) and Studio (25 sites) open soon and can be pre-ordered now. The hosted app audits public URLs; run the CLI to audit `localhost`.

## Run it yourself

```bash
git clone https://github.com/Barbudda/RankForge
cd Septune && npm install
npm run cli:build && node cli/dist/index.js audit https://example.com   # the CLI
npm run dev                                                               # the app on :3000
```

The app works with zero configuration. Accounts need Supabase (see `.env.example`); monitoring also needs migration `0004_monitoring.sql`, `CRON_SECRET`, `SUPABASE_SECRET_KEY` and `RESEND_API_KEY`. AI-assisted fixes for judgment-heavy issues and a generative support chat are optional (Anthropic key, a local Ollama model, or nothing at all). See `DEPLOY.md` to host it. `npm test` runs the CLI end-to-end suite and the monitoring tests.

## How it's built

A single Next.js 16 / TypeScript app. The audit engine is plain TypeScript with no framework coupling. The CLI bundles it straight from `src/lib/audit`, so the terminal, the app and the editor agent can never drift apart.

| | |
|---|---|
| `src/lib/agents/crawl.ts` | breadth-first crawler seeded by the sitemap, honours robots.txt (SSRF-guarded when hosted) |
| `src/lib/audit/engine.ts` | 55 rules over the parsed pages (`catalog.ts` lists them) |
| `src/lib/audit/indexing-checks.ts` | robots.txt, hreflang, canonical targets, soft 404s, sitemap hygiene, HTTPS certificate |
| `src/lib/audit/snapshot.ts` | snapshots and diffs: what changed between two versions of a site |
| `src/lib/audit/link-graph.ts` | orphans, click depth, internal PageRank |
| `src/lib/audit/resource-probe.ts` | real image weights, link statuses, redirect chains |
| `src/lib/audit/content-intel.ts` | TF-IDF topics, readability, near-duplicates |
| `src/lib/audit/deterministic-fix.ts` | framework-idiomatic patch templates |
| `src/lib/monitor/` · `src/app/api/cron/monitor` | scheduled checks, alerts, history |
| `src/app/api/mcp/route.ts` | the hosted MCP server (stateless, zero deps) |
| `cli/` | the terminal CLI |

## Honest notes

- Septune never promises search rankings. It fixes the technical layer your repository controls, which is the part that's checkable.
- Green in reports means *measured*. A finding always cites evidence from the page.
- It's an early project by one person. Issues and PRs are welcome.

## License

MIT
