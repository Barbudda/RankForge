# RankForge

[![npm](https://img.shields.io/npm/v/rankforge-cli?label=rankforge-cli&color=34e0a1)](https://www.npmjs.com/package/rankforge-cli) [![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE) [![node](https://img.shields.io/badge/node-%E2%89%A518-green)](https://nodejs.org) [![MCP](https://img.shields.io/badge/MCP-server-708cff)](https://rank-forge-blue.vercel.app/docs/agent)

**Deterministic technical-SEO audit for your site — from the terminal, your CI, or your editor. No AI required, no API keys, no telemetry.**

```bash
npx rankforge-cli audit https://your-site.com
```

RankForge crawls a site the way a search engine sees it, **measures** every technical-SEO issue (it doesn't guess), and prints a scored report with the exact affected URLs — plus ready-to-apply patches for the mechanical ones.

```
RankForge audit  https://your-site.com/
8 pages · 4.2s · deterministic — no AI, no external API

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
           1 pages carry a robots noindex directive.
           → /login
  MEDIUM   Pages missing a canonical URL (2) · fix template
           2 of 8 pages declare no canonical.
           → /about, /pricing
  MEDIUM   Missing internal links between related pages (8)
           8 high-similarity internal-link opportunities (computed from on-site content).
           → /, /pricing, /docs +5 more
  …

Site signals  1 orphan page · max click depth 2 · 8 internal-link suggestions

✚ 2 issues have a ready patch: rankforge fix <ruleId> --framework <fw>
```

## Why deterministic

Most of technical SEO is something your **code controls** and something a machine can **check by measuring** — so RankForge does exactly that. Every finding comes with evidence from the page. Nothing is hallucinated, nothing needs a model, nothing phones home. It runs in seconds, for free, forever.

What it measures on every crawl:

- **Metadata** — missing/duplicate titles and descriptions, length, OpenGraph & Twitter cards
- **Indexing** — canonicals (missing or pointing elsewhere), `noindex`, `<html lang>`, redirect chains, near-duplicate content (shingles)
- **Structure** — H1s, skipped heading levels, thin pages, readability, keyword stuffing, title↔content alignment (TF-IDF)
- **Images** — missing alt, missing dimensions (CLS), lazy-loading, **real byte weights** and legacy formats (measured over HTTP)
- **Structured data** — missing JSON-LD, invalid schema.org (required properties), homepage Organization/WebSite
- **Internal linking** — orphan pages, click depth, **broken links (real HTTP status)**, generic anchors, and semantic link suggestions from an internal link graph + local embeddings
- **Performance** — TTFB, render-blocking resources, oversized HTML, viewport, mixed content
- **Framework** — sitemap/robots presence and conventions for Next.js, Nuxt, Astro, SvelteKit, Remix, Vite, MDX, static

## Install & use

Node 18+. Zero dependencies.

```bash
# one-off
npx rankforge-cli audit https://your-site.com

# or install globally
npm i -g rankforge-cli
rankforge audit http://localhost:3000        # your dev server, before you deploy
rankforge audit https://your-site.com --pages 12 --framework astro
rankforge audit https://your-site.com --json  # machine-readable
```

### Gate your CI

Fail the build when the score drops:

```bash
rankforge audit https://staging.your-site.com --fail-under 80
```

Or use the bundled GitHub Action:

```yaml
- uses: Barbudda/RankForge@main
  with:
    url: https://staging.your-site.com
    fail-under: 80
```

### Ready-to-apply patches

Mechanical issues get a real, framework-idiomatic diff — no model involved:

```bash
rankforge fix framework-robots-missing --framework nextjs
rankforge fix indexing-canonical-missing --framework astro --url https://your-site.com
rankforge rules   # the full catalog
```

## In your editor (MCP)

RankForge also ships as an **MCP server**, so Claude Code, Cursor, VS Code or Windsurf can run the audit and get fix templates — then patch the repo they already have open. RankForge does the measuring; your assistant does the reasoning.

```bash
claude mcp add --transport http rankforge http://localhost:3000/api/mcp
```

Then: *"Use rankforge to audit http://localhost:3000 and fix what you find."*
Setup for every client → [rank-forge-blue.vercel.app/docs/agent](https://rank-forge-blue.vercel.app/docs/agent)

## The hosted app

[rank-forge-blue.vercel.app](https://rank-forge-blue.vercel.app) is the same engine with an account: audit history, a **change report grouped by file** with every diff, and patches bundled for review. Free to use. The hosted agent audits public URLs; run the CLI (or the app locally) to audit `localhost`.

## Run it yourself

```bash
git clone https://github.com/Barbudda/RankForge
cd RankForge && npm install
npm run cli:build && node cli/dist/index.js audit https://example.com   # the CLI
npm run dev                                                               # the app on :3000
```

The app works with zero configuration. Accounts need Supabase (see `.env.example`); AI-assisted fixes for judgment-heavy issues and a generative support chat are optional (Anthropic key, a local Ollama model, or nothing at all). See `DEPLOY.md` to host it.

## How it's built

A single Next.js 16 / TypeScript app. The audit engine is plain TypeScript with no framework coupling — the CLI bundles it straight from `src/lib/audit` so the terminal, the app and the editor agent can never drift apart.

| | |
|---|---|
| `src/lib/agents/crawl.ts` | bounded breadth-first crawler (SSRF-guarded when hosted) |
| `src/lib/audit/engine.ts` | ~35 rules over the parsed pages |
| `src/lib/audit/link-graph.ts` | orphans, click depth, internal PageRank |
| `src/lib/audit/resource-probe.ts` | real image weights, link statuses, redirect chains |
| `src/lib/audit/content-intel.ts` | TF-IDF topics, readability, near-duplicates |
| `src/lib/audit/deterministic-fix.ts` | framework-idiomatic patch templates |
| `src/app/api/mcp/route.ts` | the MCP server (stateless, zero deps) |
| `cli/` | the terminal CLI |

## Honest notes

- RankForge never promises search rankings. It fixes the technical layer your repository controls — the part that's checkable.
- Green in reports means *measured*. A finding always cites evidence from the page.
- It's an early project by one person. Issues and PRs are welcome.

## License

MIT
