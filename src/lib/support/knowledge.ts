/**
 * Septune support knowledge base. Grounds the support chatbot:
 * - SUPPORT_SYSTEM is the system prompt when an LLM key is configured.
 * - KB powers the offline fallback (keyword-matched answers) so the
 *   assistant is useful even without an API key.
 */

import { BILLING_NOTE, BILLING_OPEN } from "@/lib/pricing";

export const SUPPORT_SYSTEM = `You are the Septune support assistant. Be concise, friendly and accurate.

ABOUT RANKFORGE
Septune checks a site's technical SEO at the three moments it breaks: in your editor before you push (the open-source CLI or the Claude Code plugin), on every pull request (a GitHub Action that compares the preview with production, comments the result and fails the check when pages would leave search), and in production (scheduled checks with email, Slack, Discord or webhook alerts). Measurements are deterministic and every finding cites its evidence. Septune never writes to your repository and never promises Google rankings. Built for modern stacks (Next.js, Nuxt, Astro, SvelteKit, Remix, Vite + React, MDX, static).

HOW IT WORKS
1) Before you push: run npx septune audit http://localhost:3000, or install the Claude Code plugin (/plugin marketplace add Barbudda/septune, then /plugin install septune@septune) so your assistant audits and fixes. 2) In the pull request: add the GitHub Action Barbudda/septune with your preview URL and baseline-url set to production; it comments the changes on the pull request and fails it on critical regressions. 3) In production: sign up, add your site and turn on monitoring. 4) Fix from the evidence: every finding lists the affected URLs and likely files, and mechanical ones have a ready patch (septune fix <ruleId>). Next.js has the deepest support.

MODIFICATION LEVELS (hosted app, per repo)
- Advisor: advice only, no code or diffs.
- Suggest: a ready-to-copy diff for every issue.
- Draft PRs, Auto (low-risk), Autopilot: Septune prepares pull requests in the app for you to review and apply. Nothing is pushed to GitHub yet; a GitHub App is on the roadmap.

SEO CHECKS
54 site checks in eight categories (metadata, indexing, page structure, images, schema.org, internal linking, performance, framework) plus 12 AI-search readiness checks.

SECURITY
Septune only reads rendered pages, like any crawler, and honours robots.txt. It never writes to your repository: fixes reach your code through your own pull requests. The CLI and the editor agent run on your machine and send nothing to Septune; the GitHub Action uses the job's token only to comment on the pull request; hosted monitoring fetches your public pages. It never reads your source code or environment secrets, and every monitoring check is kept with what changed.

PRICING
Free €0 (CLI, editor agent, CI regression gate, white-label HTML reports, monitoring of 1 site weekly with email alerts). Pro €19/mo (monitoring of 5 sites daily, email/Slack/Discord/webhook alerts, 12 months of history). Studio €49/mo (25 sites, an alert address per site, 24 months of history). ${BILLING_NOTE} Payments, invoices, plan changes and cancellation go through Stripe and the billing portal (/billing). Not available yet: Search Console data, scheduled client reports, team seats. There is no SSO and no self-hosting. Support is self-serve via this assistant.

RULES
- Only answer questions about Septune and technical SEO. If asked something unrelated, gently steer back.
- Be concise (2-5 sentences). Use plain language. Point users to the free audit (/audit), the docs (/docs/agent), the dashboard or pricing when relevant.
- Never claim Septune guarantees Google rankings. Never invent features or prices not listed above.`;

export interface KbEntry {
  keywords: string[];
  answer: string;
}

export const KB: KbEntry[] = [
  {
    keywords: ["what", "septune", "do", "is", "about"],
    answer:
      "Septune checks your site's technical SEO where it breaks: in your editor before you push, on every pull request (preview against production, with a comment and a check that fails when pages would leave search), and in production with alerts. It works with Next.js, Nuxt, Astro, SvelteKit, Remix, MDX and static sites.",
  },
  {
    keywords: ["how", "work", "works", "start", "begin", "setup", "audit"],
    answer:
      "Start with npx septune audit <your-url>, or the free audit at /audit. Then add the GitHub Action so every pull request is checked against production, and sign up to turn on monitoring for your live site. The guide is at /docs/agent.",
  },
  {
    keywords: ["framework", "frameworks", "next", "nextjs", "nuxt", "astro", "sveltekit", "remix", "support", "supported"],
    answer:
      "Septune supports Next.js, Nuxt, Astro, SvelteKit, Remix, Vite + React, MDX and static sites. Next.js, Nuxt, Astro and MDX have the deepest framework-aware fixes today.",
  },
  {
    keywords: ["level", "levels", "autonomy", "modification", "advisor", "suggest", "draft", "autopilot", "root", "how far"],
    answer:
      "In the hosted app you choose how far Septune prepares fixes per repo: Advisor (advice only), Suggest (diffs to copy), or Draft PRs, Auto and Autopilot, which prepare pull requests in Septune for you to review. Nothing is pushed to GitHub yet. Set it in Settings or on a repository's page.",
  },
  {
    keywords: ["safe", "security", "secure", "permission", "permissions", "main", "branch", "merge", "access", "secret", "secrets", "write"],
    answer:
      "Septune only reads your rendered pages, like any crawler. It never writes to your repository and never reads your source code or secrets. Fixes reach your code through your own pull requests, and the pull-request check verifies them.",
  },
  {
    keywords: ["price", "pricing", "cost", "plan", "plans", "free", "trial", "much"],
    answer:
      `Free costs nothing: CLI, editor agent, CI gate, reports and monitoring of 1 site weekly. Pro is €19/month (5 sites checked daily, Slack/Discord/webhook alerts) and Studio €49/month (25 sites). ${BILLING_OPEN ? "Subscribe or cancel anytime from the billing page." : "Payments aren't open yet: pre-order Pro or Studio at /preorder and you'll get an email the day it opens."} See the pricing page.`,
  },
  {
    keywords: ["pr", "prs", "pull", "request", "requests", "create", "merge", "fix", "diff"],
    answer:
      "Septune checks pull requests: the GitHub Action audits the preview against production, comments what changed and fails the check when pages would leave search. It doesn't open pull requests itself; fixes come as patches or through your AI editor, and you open the PR.",
  },
  {
    keywords: ["agency", "agencies", "multiple", "repos", "clients", "monorepo", "team"],
    answer:
      "The Studio plan monitors up to 25 sites, with a separate alert address or webhook per site, so a freelancer or small agency can watch client sites from one account. Client workspaces and team seats aren't available yet. White-label HTML reports work today from the CLI (septune audit <url> --html report.html --brand \"Your studio\").",
  },
  {
    keywords: ["rank", "ranking", "rankings", "google", "guarantee", "first", "position"],
    answer:
      "Septune doesn't promise rankings. It keeps the technical foundations working (metadata, indexing, schema, structure, internal links, performance), which is the part of SEO your code controls.",
  },
  {
    keywords: ["category", "categories", "issue", "issues", "metadata", "schema", "images", "indexing", "performance", "links"],
    answer:
      "Audits cover eight categories: metadata, indexing, page structure, images, schema.org, internal linking, performance SEO and framework-specific issues. Each one is scored by impact, effort, risk and confidence.",
  },
  {
    keywords: ["contact", "help", "support", "human", "email"],
    answer:
      "You're talking to support right now, so ask me anything about Septune. For account deletion or anything I can't answer, email the address on the privacy page.",
  },
];

// NOTE: server-only module — the api/chat route is its sole consumer. Client
// components must not import it (the chat widget inlines its own suggested
// questions) so the prompt/KB never reach the browser bundle.

const DEFAULT_ANSWER =
  "I can help with anything about Septune: the audit, the pull-request check, monitoring, security, supported frameworks or pricing. What would you like to know? You can also run a free audit at /audit.";

/** Offline fallback: score KB entries by keyword overlap with the question. */
export function findAnswer(question: string): string {
  const q = question.toLowerCase();
  const words = new Set(q.split(/[^a-z0-9]+/).filter((w) => w.length > 2));
  let best: KbEntry | null = null;
  let bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += 2;
      else if (words.has(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 2 && best ? best.answer : DEFAULT_ANSWER;
}
