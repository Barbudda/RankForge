/**
 * RankForge support knowledge base. Grounds the support chatbot:
 * - SUPPORT_SYSTEM is the system prompt when an LLM key is configured.
 * - KB powers the offline fallback (keyword-matched answers) so the
 *   assistant is useful even without an API key.
 */

export const SUPPORT_SYSTEM = `You are the RankForge support assistant — concise, friendly and accurate.

ABOUT RANKFORGE
RankForge is a technical-SEO agent for GitHub repos. It connects to a repository, crawls the rendered site, maps every technical-SEO issue back to a file, and opens small, reviewable pull requests that fix it. It is built for modern repos (Next.js, Nuxt, Astro, SvelteKit, Remix, Vite + React, MDX, static). It does NOT promise rankings — it ships better technical SEO as code you review and merge.

HOW IT WORKS
1) Install the GitHub App (read-only by default) and pick repos. 2) Add a production/staging URL. 3) Run an audit — issues are scored by impact, effort, risk and confidence, then prioritized. 4) Review each issue's suggested fix and diff. 5) Merge the pull requests. Next.js is the most deeply supported framework.

MODIFICATION LEVELS (autonomy spectrum, per repo)
- Advisor: advice only, no code/diffs, read-only.
- Suggest: generates diffs to copy, read-only (never touches GitHub).
- Draft PRs: opens draft pull requests on a branch.
- Auto (low-risk): auto-opens ready PRs for low-risk fixes; risky ones stay drafts.
- Autopilot: max autonomy across categories/paths. Even here, changes arrive as pull requests you review — RankForge never force-pushes to your default branch.

SEO CATEGORIES
metadata, indexing, page structure, images, schema.org, internal linking, performance, framework-specific.

SECURITY
Read-only by default; write access scoped to RankForge branches only; never a direct commit/merge to your default branch; no access to environment secrets; full audit log; disable the agent anytime; self-host option on Enterprise.

PRICING (placeholders)
Starter €29/mo (1 repo), Growth €99/mo (5 repos), Agency €299/mo (25 repos, multi-tenant), Enterprise custom (self-host, SSO/SAML). Free first audit, no card required. Support is self-serve via this assistant.

RULES
- Only answer questions about RankForge and technical SEO. If asked something unrelated, gently steer back.
- Be concise (2-5 sentences). Use plain language. Point users to the dashboard ("Connect GitHub" / Settings) or pricing when relevant.
- Never claim RankForge guarantees Google rankings. Never invent features or prices not listed above.`;

export interface KbEntry {
  keywords: string[];
  answer: string;
}

export const KB: KbEntry[] = [
  {
    keywords: ["what", "rankforge", "do", "is", "about"],
    answer:
      "RankForge is a technical-SEO agent for your GitHub repo. It crawls your rendered site, maps each SEO issue back to a file, and opens small, reviewable pull requests that fix it — for Next.js, Nuxt, Astro, SvelteKit, Remix, MDX and static sites.",
  },
  {
    keywords: ["how", "work", "works", "start", "begin", "setup", "audit"],
    answer:
      "Connect the GitHub App (read-only by default), add a production URL, and run an audit. You'll see prioritized issues scored by impact/effort/risk, each with a suggested fix and diff — then merge the pull requests. Head to the dashboard and click “Connect GitHub” to begin.",
  },
  {
    keywords: ["framework", "frameworks", "next", "nextjs", "nuxt", "astro", "sveltekit", "remix", "support", "supported"],
    answer:
      "RankForge supports Next.js, Nuxt, Astro, SvelteKit, Remix, Vite + React, MDX and static sites. Next.js, Nuxt, Astro and MDX have the deepest framework-aware fixes today.",
  },
  {
    keywords: ["level", "levels", "autonomy", "modification", "advisor", "suggest", "draft", "autopilot", "root", "how far"],
    answer:
      "You choose how far RankForge goes per repo: Advisor (advice only), Suggest (diffs to copy), Draft PRs, Auto for low-risk PRs, or Autopilot (full autonomy). Even on Autopilot, changes arrive as pull requests you review — never a force-push to your default branch. Set it in Settings or on a repository's page.",
  },
  {
    keywords: ["safe", "security", "secure", "permission", "permissions", "main", "branch", "merge", "access", "secret", "secrets", "write"],
    answer:
      "RankForge is read-only by default; write access is scoped to its own branches. It never commits or merges to your default branch, never touches your secrets, and logs every action. You review and merge every change, and can disable the agent anytime.",
  },
  {
    keywords: ["price", "pricing", "cost", "plan", "plans", "free", "trial", "much"],
    answer:
      "Plans: Starter €29/mo (1 repo), Growth €99/mo (5 repos), Agency €299/mo (25 repos), Enterprise custom (self-host, SSO). Your first audit is free — no card required. See the pricing page for details.",
  },
  {
    keywords: ["pr", "prs", "pull", "request", "requests", "create", "merge", "fix", "diff"],
    answer:
      "Each issue maps to a small, branch-scoped pull request with the patch, expected impact, risk and a validation checklist. They're easy to review and you stay in control of every merge — nothing reaches your default branch automatically.",
  },
  {
    keywords: ["agency", "agencies", "multiple", "repos", "clients", "monorepo", "team"],
    answer:
      "Yes — the Agency plan adds multi-tenant client workspaces, monorepo support, per-client reporting and role-based access so you can manage many sites from one dashboard.",
  },
  {
    keywords: ["rank", "ranking", "rankings", "google", "guarantee", "first", "position"],
    answer:
      "RankForge doesn't promise rankings — it ships better technical SEO as code you review and merge. It fixes the technical foundations (metadata, indexing, schema, structure, internal links, performance) that help search engines understand your site.",
  },
  {
    keywords: ["category", "categories", "issue", "issues", "metadata", "schema", "images", "indexing", "performance", "links"],
    answer:
      "Audits cover eight categories: metadata, indexing, page structure, images, schema.org, internal linking, performance SEO and framework-specific issues — each scored by impact, effort, risk and confidence.",
  },
  {
    keywords: ["contact", "help", "support", "human", "email"],
    answer:
      "You're talking to support right now — ask me anything about RankForge. For account or billing specifics, head to Settings or Billing in the dashboard.",
  },
];

// NOTE: server-only module — the api/chat route is its sole consumer. Client
// components must not import it (the chat widget inlines its own suggested
// questions) so the prompt/KB never reach the browser bundle.

const DEFAULT_ANSWER =
  "I can help with anything about RankForge — how it audits your repo, the modification levels, security, supported frameworks, or pricing. What would you like to know? You can also click “Connect GitHub” on the dashboard to try it.";

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
