import {
  Map,
  Braces,
  Link2,
  Building2,
  GaugeCircle,
  Bot,
  GitPullRequestArrow,
  ScrollText,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/animations/reveal";
import { CrawlerSwarm } from "./dots/crawler-swarm";
import { CauseWeb } from "./dots/cause-web";
import { FlowField } from "./dots/flow-field-layer";

/** Shared dot-layer mask: fade the top (headings) and bottom (next section). */
const DOTS_MASK =
  "[mask-image:linear-gradient(to_bottom,transparent,#000_15%,#000_90%,transparent)]";

function SectionShell({
  id,
  title,
  description,
  align = "center",
  dots,
  children,
}: {
  id?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  dots?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative overflow-hidden py-24 md:py-28">
      {dots}
      <div className="container-rf relative z-10">
        <Reveal
          className={
            align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
          }
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h2>
          {description && <p className="mt-4 text-fg-muted">{description}</p>}
        </Reveal>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────
export function HowItWorksSection() {
  const rows = [
    {
      n: "01",
      t: "Before you push: your editor",
      d: "The CLI or the Claude Code plugin audits localhost. Your AI assistant fixes what it finds from the evidence, then compares your version with production.",
    },
    {
      n: "02",
      t: "In the pull request",
      d: "The GitHub Action audits the preview deployment against production, page by page, comments the result on the pull request, and fails it when pages would leave search.",
    },
    {
      n: "03",
      t: "After the merge: production",
      d: "RankForge checks the live site on a schedule and alerts you by email, Slack or Discord when something critical changes: a noindex, a failing robots.txt, a page that starts returning errors, a certificate about to expire.",
    },
    {
      n: "04",
      t: "Fix from the evidence",
      d: "Every finding comes with the affected URLs and the files to look at. Mechanical ones come with a ready patch for your framework.",
    },
  ];
  return (
    <SectionShell
      id="how-it-works"
      title="Three checkpoints. One engine."
      description="SEO breaks in the same few places: a template change, a config flag, a CDN rule. RankForge checks each moment with the same deterministic engine, so the editor, the pull request and production always agree."
      dots={<CrawlerSwarm variant="howitworks" className={DOTS_MASK} />}
    >
      <div className="mx-auto max-w-3xl divide-y divide-border lg rounded-2xl">
        {rows.map((r) => (
          <Reveal key={r.n}>
            <div className="flex items-start gap-5 p-6">
              <span className="font-mono text-sm text-molten-bright">{r.n}</span>
              <div>
                <h3 className="text-base font-semibold text-fg">{r.t}</h3>
                <p className="mt-1 text-sm text-fg-muted">{r.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

// ── Features ─────────────────────────────────────────────────────
export function FeaturesSection() {
  const features = [
    { icon: Map, title: "Crawls like Googlebot", body: "Links first, then every URL your sitemap lists. robots.txt is read and honoured the way Google reads it." },
    { icon: Braces, title: "noindex, wherever it hides", body: "Meta tags and X-Robots-Tag headers, so a CDN rule or a staging flag can't slip through." },
    { icon: Link2, title: "Canonicals and hreflang", body: "Canonicals that point at redirects or errors, hreflang codes Google ignores, missing return links." },
    { icon: ScrollText, title: "Structured data that qualifies", body: "Checks the properties Google requires for rich results, not just that JSON-LD exists." },
    { icon: GaugeCircle, title: "Core Web Vitals of real users", body: "LCP, INP and CLS from Chrome UX Report data, watched from one check to the next." },
    { icon: Bot, title: "Ready for AI search", body: "Which of 21 AI crawlers can reach you, a checked llms.txt, and the signals answer engines quote." },
    { icon: GitPullRequestArrow, title: "A check on every pull request", body: "Preview against production on each push, with the result commented where your team reviews." },
    { icon: Building2, title: "Reports in your name", body: "White-label HTML reports for client sites, and one alert address per client on Studio." },
  ];
  return (
    <SectionShell
      id="features"
      align="left"
      title="Technical SEO, without the spreadsheet"
      description="54 checks for what actually breaks: indexing, canonicals, sitemaps, structured data, speed and AI-search access. Every finding cites its evidence."
      dots={<CauseWeb variant="features" className={DOTS_MASK} />}
    >
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <RevealItem
            key={f.title}
            className="group lg rounded-2xl p-5 transition-colors hover:border-molten/40"
          >
            <f.icon className="size-5 text-cyan" />
            <h3 className="mt-3 text-sm font-semibold text-fg">{f.title}</h3>
            <p className="mt-1.5 text-sm text-fg-muted">{f.body}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

// ── Frameworks ───────────────────────────────────────────────────
export function FrameworksSection() {
  const fw = [
    { name: "Next.js", note: "Deep support", strong: true },
    { name: "Nuxt", note: "Supported", strong: false },
    { name: "Astro", note: "Supported", strong: false },
    { name: "SvelteKit", note: "Supported", strong: false },
    { name: "Remix", note: "Supported", strong: false },
    { name: "Vite + React", note: "Supported", strong: false },
    { name: "MDX", note: "Content-aware", strong: true },
    { name: "Static", note: "Supported", strong: false },
  ];
  return (
    <SectionShell
      id="frameworks"
      title="It reads your framework's conventions"
      description="RankForge knows where metadata lives and how routes are generated in each stack, so its Next.js, Nuxt and Astro SEO fixes look like code you'd have written yourself."
      dots={<FlowField variant="frameworks" className={DOTS_MASK} />}
    >
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fw.map((f) => (
          <RevealItem
            key={f.name}
            className="flex items-center justify-between lg rounded-2xl px-4 py-3.5"
          >
            <span className="font-medium text-fg">{f.name}</span>
            <span
              className={
                f.strong
                  ? "text-xs font-medium text-signal"
                  : "text-xs text-fg-subtle"
              }
            >
              {f.note}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

// ── Comparison ───────────────────────────────────────────────────
type Checkpoint = "editor" | "pr" | "production";

const CHECKPOINT: Record<Checkpoint, { label: string; tone: string }> = {
  editor: { label: "In your editor", tone: "border-cyan/30 text-cyan" },
  pr: { label: "In the pull request", tone: "border-molten/40 text-molten-bright" },
  production: { label: "In production", tone: "border-signal/30 text-signal" },
};

export function ComparisonSection() {
  // Each row is a change the engine detects, and the first checkpoint that
  // sees it.
  const rows: { what: string; caught: Checkpoint; note?: string }[] = [
    { what: "A template change sets noindex on /pricing", caught: "pr", note: "the check fails before the merge" },
    { what: "A refactor drops the canonical from 40 pages", caught: "pr" },
    { what: "hreflang points at a page that now redirects", caught: "editor" },
    { what: "A CDN rule sends X-Robots-Tag: noindex on every page", caught: "production", note: "at the next check" },
    { what: "robots.txt starts answering 500, so Google pauses crawling", caught: "production" },
    { what: "A page quietly starts returning 404", caught: "production" },
    { what: "The HTTPS certificate expires in 9 days", caught: "production", note: "before it expires" },
    { what: "LCP gets worse for real users after a release", caught: "production", note: "from Chrome UX Report data" },
  ];

  return (
    <SectionShell
      title="How SEO breaks, and where it's caught"
      description="Site audits find what is already broken in production, weeks later. RankForge stops it in the pull request, then keeps watching after the merge."
      dots={<CauseWeb variant="comparison" className={DOTS_MASK} />}
    >
      <Reveal className="mx-auto max-w-3xl overflow-hidden lg rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-left">
              <th className="p-4 font-medium text-fg-muted">What happened</th>
              <th className="p-4 font-medium text-fg-muted">Where it&apos;s caught</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.what} className="border-b border-border last:border-0">
                <td className="p-4 text-fg">{r.what}</td>
                <td className="p-4">
                  <span className={`lg-chip inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${CHECKPOINT[r.caught].tone}`}>
                    {CHECKPOINT[r.caught].label}
                  </span>
                  {r.note && <span className="mt-1 block text-xs text-fg-subtle">{r.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </SectionShell>
  );
}

// Security lives in security-traffic.tsx (scroll-driven "traffic" choreography).
