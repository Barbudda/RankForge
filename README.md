# RankForge

> **A technical-SEO agent for GitHub repos that audits your modern site and opens ready-to-merge pull requests.**

RankForge connects to a GitHub repository, crawls the **rendered** site, maps every technical-SEO issue back to a file, and generates small, reviewable pull requests that fix it — with impact, effort and risk scoring on every issue.

It is built for modern repos (Next.js, Nuxt, Astro, SvelteKit, Remix, Vite + React, MDX, static) — not legacy CMS checklists.

> RankForge does **not** promise rankings. It ships better technical SEO as code you review and merge.

---

## ✨ What's in this MVP

A complete, beautiful, **fully working** product surface running on realistic mock data:

- **Spectacular landing page** with a `ChaosToClarityBackground`, a scroll-driven "code chaos → SEO clarity" transformation, an animated generated-PR card, and all 12 marketing sections (hero, problem, solution, how-it-works, features, demo flow, frameworks, comparison, security, pricing, FAQ, final CTA).
- **A serious product app**: dashboard, repositories, repository detail, audit detail, prioritized & filterable issues, issue detail with a suggested fix + diff, **pull-request preview** (real and simulated), settings (agent behavior), and billing.
- **An extensible architecture**: typed domain model, a GitHub service (mock + Octokit-ready adapter), an audit engine (crawler / framework-detector / rules / fix-generator interfaces + a rules catalog), and pure scoring functions.

Everything runs with **zero external credentials** in `mock` mode.

---

## 🧱 Stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, RSC, Turbopack) |
| Language | **TypeScript** (strict, `noUncheckedIndexedAccess`) |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens) |
| Animation | **Motion** (Framer Motion) — isolated in `components/animations` & `components/marketing` |
| Icons | lucide-react (+ a custom GitHub mark) |
| Fonts | Inter + JetBrains Mono via `next/font` |
| Data | Centralized typed **mock layer** (`src/lib/mock`) |

Deliberately **no native dependencies** (Windows + OneDrive friendly) and no database in the MVP — the data layer is a swap-in interface.

---

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (Turbopack)
npm run start        # serve the production build
npm run lint         # eslint (flat config, next preset)
npm run typecheck    # tsc --noEmit
```

Then open:

- `/` — the landing page
- `/dashboard` — the product app
- `/pricing` — standalone pricing

---

## 🔐 Environment variables

Copy `.env.example` → `.env.local`. **Nothing is required** — the app runs fully in mock mode without any of these.

| Variable | Purpose |
| --- | --- |
| `RANKFORGE_MODE` | `mock` (default) or `live` |
| `NEXT_PUBLIC_APP_URL` | Public URL for canonical/OG tags |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_WEBHOOK_SECRET` | GitHub App |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Auth (when added) |
| `DATABASE_URL` | Postgres (when added) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing (mocked) |
| `ANTHROPIC_API_KEY` | LLM-backed fix generation (interface ready) |

`src/lib/config.ts` reads these and decides mock vs live.

---

## 🗂 Architecture

```
src/
├─ app/
│  ├─ (marketing)/        # landing + pricing (own nav/footer layout)
│  └─ (app)/              # product app (sidebar + topbar layout)
│     ├─ dashboard, repositories, repositories/[id]
│     ├─ audits/[id], issues/[id], issues/[id]/pr
│     ├─ pull-requests, pull-requests/[id]
│     └─ settings, billing
├─ components/
│  ├─ marketing/          # hero, chaos background, sections, pricing, faq…
│  ├─ animations/         # Reveal, RevealGroup (reduced-motion aware)
│  ├─ app/                # sidebar, topbar, cards, tables, PR preview…
│  ├─ ui/                 # Button, Card, Badge, ScoreRing, DiffView…
│  └─ brand/              # Logo, GitHub icon
├─ lib/
│  ├─ mock/               # realistic fixtures (repos, audits, 20 issues, PRs)
│  ├─ github/             # GitHubService interface + Mock + Octokit adapters
│  ├─ audit/              # Crawler/Detector/Rule/FixGenerator interfaces + rules
│  ├─ scoring/            # pure scoring & prioritization functions
│  ├─ seo/                # category/severity/framework constants
│  ├─ pricing.ts          # centralized pricing tiers
│  └─ config.ts           # runtime mode + env access
└─ types/                 # the strict domain model
```

### Design system

Tokens live in `src/app/globals.css` under `@theme` — deep-black canvas with electric-blue / cyan / signal-green / violet accents, plus utilities (`text-gradient`, `bg-grid`, `glass`, `glow-electric`, `spotlight`, `border-beam`). All animations respect `prefers-reduced-motion`.

---

## 🔌 Wiring the real backend

The MVP is structured so each integration is an interface swap, not a rewrite.

### GitHub (real PRs)

1. `npm i @octokit/rest @octokit/auth-app`
2. Set `RANKFORGE_MODE=live` + GitHub App credentials.
3. Implement the methods in `src/lib/github/octokit.ts` (each is stubbed with the exact Octokit calls to make). `getGitHubService()` will pick it up automatically.

### Crawler (real rendering)

1. `npm i playwright` and `npx playwright install chromium`.
2. Implement a `LiveCrawler` against the `Crawler` interface in `src/lib/audit/types.ts`.
3. Add a `LiveAuditRunner` and return it from `getAuditRunner()`.

### Fix generation (LLM)

`FixGenerator.generateFix(issue, repoContext)` is the seam for an LLM. With `ANTHROPIC_API_KEY` set, implement it to produce the patch + diff from the issue and repo context (the latest, most capable Claude models are recommended).

### Database

Replace the `src/lib/mock` reads with a real store (Drizzle/Prisma + Postgres). The UI only depends on the functions exported from `src/lib/mock` (e.g. `getRepository`, `getLatestAudit`, `getIssuesForRepo`), so this is a contained change.

---

## 🧪 SEO coverage

Issues are organized into eight categories — **metadata, indexing, page structure, images, schema.org, internal linking, performance, framework-specific** — each scored by **impact · effort · risk · confidence** and prioritized automatically. The rule catalog lives in `src/lib/audit/rules.ts`.

---

## 🛟 Safety model (shown on the landing too)

- Read-only by default; write access scoped to RankForge branches.
- **Never** a direct commit or merge to your default branch.
- Every change is a small, reviewable PR with a checklist and rollback notes.
- No access to environment secrets. Disable the agent any time.

---

## 📋 Status & known limits

- **Mock mode only** in this build — GitHub/crawler/LLM/Stripe/Auth are interface-complete with realistic mocks and clearly marked TODOs.
- Next.js is the most deeply modeled framework; others are represented and ready to extend.
- Pricing numbers are placeholders (`src/lib/pricing.ts`).

---

Built for modern web teams. From broken tags to reviewable diffs.
