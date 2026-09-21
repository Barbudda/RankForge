# rankforge-cli

**Deterministic technical-SEO audit from your terminal. No AI, no API keys, no telemetry.**

```bash
npx rankforge-cli audit https://your-site.com
```

Crawls a site the way a search engine sees it, **measures** every technical-SEO issue (never guesses), and prints a scored report with the affected URLs — plus ready-to-apply patches for the mechanical ones. Runs in seconds. Zero dependencies.

```
Score  87/100
  metadata          ███████████░   93
  indexing          █████████░░░   76
  images            ████████████  100
  internal-linking  ██████████░░   86
  …

Issues (8)
  CRITICAL Pages set to noindex (1)              → /login
  MEDIUM   Pages missing a canonical URL (2) · fix template
  MEDIUM   Missing internal links between related pages (8)
```

## Usage

```bash
rankforge audit <url> [--pages N] [--framework nextjs] [--json] [--fail-under N] [--no-probe]
rankforge fix <ruleId> [--framework nextjs] [--url https://…] [--json]
rankforge rules [--json]
```

```bash
rankforge audit http://localhost:3000                 # your dev server
rankforge audit https://site.com --pages 12 --framework astro
rankforge audit https://site.com --json               # machine-readable
rankforge audit https://staging.site.com --fail-under 80   # CI gate → exit 1
rankforge fix framework-robots-missing --framework nextjs   # a real diff
```

## What it checks

Metadata (titles, descriptions, OpenGraph) · Indexing (canonicals, noindex, lang, redirects, near-duplicates) · Structure (H1s, headings, thin content, readability, keyword stuffing) · Images (alt, dimensions, lazy-loading, **measured** weights & legacy formats) · Structured data (JSON-LD validity) · Internal linking (orphans, click depth, **real** broken links, semantic link suggestions) · Performance (TTFB, render-blocking, mixed content) · Framework conventions (Next.js, Nuxt, Astro, SvelteKit, Remix, Vite, MDX, static).

## Also

- **GitHub Action**: `uses: Barbudda/RankForge@main` with `url` + `fail-under`.
- **In your editor**: the same engine as an MCP server for Claude Code / Cursor / VS Code.
- **Hosted app** with change reports by file: [rank-forge-blue.vercel.app](https://rank-forge-blue.vercel.app)

Source & issues: [github.com/Barbudda/RankForge](https://github.com/Barbudda/RankForge) · MIT
