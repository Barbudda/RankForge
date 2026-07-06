import {
  Map,
  Braces,
  Link2,
  Building2,
  GaugeCircle,
  Check,
  X,
  GitPullRequestArrow,
  ScrollText,
} from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
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
    { n: "01", t: "Install the GitHub App", d: "Read-only by default. You pick the repos RankForge is allowed to see." },
    { n: "02", t: "Add a production URL", d: "Point it at staging or production. It crawls the rendered output, not just your source." },
    { n: "03", t: "Run an audit", d: "Each issue is scored by impact, effort and risk, then sorted so the high-value fixes rise to the top." },
    { n: "04", t: "Review the diffs", d: "Every issue links to the files it touches and a ready patch you can read." },
    { n: "05", t: "Merge the PRs", d: "RankForge opens the pull requests. You stay in control of every merge." },
  ];
  return (
    <SectionShell
      id="how-it-works"
      title="From install to merged PR, in five steps"
      dots={<CrawlerSwarm variant="howitworks" className={DOTS_MASK} />}
    >
      <div className="mx-auto max-w-3xl divide-y divide-border rounded-xl border border-border bg-surface/70 backdrop-blur-sm">
        {rows.map((r) => (
          <Reveal key={r.n}>
            <div className="flex items-start gap-5 p-6">
              <span className="font-mono text-sm text-electric-bright">{r.n}</span>
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
    { icon: GithubIcon, title: "GitHub-native fixes", body: "Issues become branch-scoped pull requests, never direct commits to main." },
    { icon: Braces, title: "Framework-aware metadata", body: "Knows generateMetadata, useSeoMeta, Astro frontmatter and more." },
    { icon: Map, title: "Sitemap & robots automation", body: "Generates dynamic sitemaps and repairs stale robots directives." },
    { icon: ScrollText, title: "Schema generation", body: "Organization, Article, Product, FAQ, BreadcrumbList and SoftwareApplication." },
    { icon: Link2, title: "Internal linking insights", body: "Finds orphan pages, weak anchors and click-depth problems." },
    { icon: GitPullRequestArrow, title: "Safe PR workflow", body: "Small, reversible diffs with risk scoring and validation steps." },
    { icon: GaugeCircle, title: "Performance SEO signals", body: "Surfaces render-blocking resources and Core Web Vitals regressions." },
    { icon: Building2, title: "Agency-ready dashboard", body: "Manage many repos and sites from one multi-tenant workspace." },
  ];
  return (
    <SectionShell
      id="features"
      align="left"
      title="Technical SEO, without the spreadsheet"
      description="Technical SEO automation for the metadata, sitemap and schema work that usually sits untouched at the bottom of a backlog."
      dots={<CauseWeb variant="features" className={DOTS_MASK} />}
    >
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <RevealItem
            key={f.title}
            className="group rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-electric/40"
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
            className="flex items-center justify-between rounded-xl border border-border bg-surface/60 px-4 py-3.5"
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
export function ComparisonSection() {
  const rows = [
    { label: "Finds technical issues", classic: true, rf: true },
    { label: "Maps each issue to code", classic: false, rf: true },
    { label: "Opens pull requests", classic: false, rf: true },
    { label: "Framework-aware", classic: false, rf: true },
    { label: "Safe review workflow", classic: false, rf: true },
    { label: "Compares source vs rendered HTML", classic: false, rf: true },
    { label: "Marketing reports & dashboards", classic: true, rf: true },
  ];
  const Cell = ({ ok }: { ok: boolean }) =>
    ok ? (
      <span className="inline-grid size-6 place-items-center rounded-full bg-signal/15">
        <Check className="size-3.5 text-signal" />
      </span>
    ) : (
      <span className="inline-grid size-6 place-items-center rounded-full bg-border/60">
        <X className="size-3.5 text-fg-subtle" />
      </span>
    );

  return (
    <SectionShell
      title="Audits tell you what's wrong. RankForge ships the fix."
      dots={<CauseWeb variant="comparison" className={DOTS_MASK} />}
    >
      <Reveal className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-surface/70 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/70 text-left">
              <th className="p-4 font-medium text-fg-muted">Capability</th>
              <th className="p-4 text-center font-medium text-fg-muted">
                Classic SEO tools
              </th>
              <th className="p-4 text-center font-medium text-electric-bright">
                RankForge
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border last:border-0">
                <td className="p-4 text-fg">{r.label}</td>
                <td className="p-4 text-center">
                  <Cell ok={r.classic} />
                </td>
                <td className="p-4 text-center">
                  <Cell ok={r.rf} />
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
