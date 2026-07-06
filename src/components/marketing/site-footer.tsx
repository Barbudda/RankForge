import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const CONTACT_EMAIL = "hugopoene74@gmail.com";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#security", label: "Security" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Frameworks",
    links: [
      { href: "/frameworks/nextjs", label: "Next.js SEO" },
      { href: "/frameworks/nuxt", label: "Nuxt SEO" },
      { href: "/frameworks/astro", label: "Astro SEO" },
      { href: "/frameworks/sveltekit", label: "SvelteKit SEO" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/agent", label: "Agent in your editor" },
      { href: "/changelog", label: "Changelog" },
      { href: "/#faq", label: "FAQ" },
      { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-soft">
      <div className="container-rf py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-fg-muted">
              A technical-SEO automation agent for GitHub repos. It audits your
              site and opens small, reviewable pull requests.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-fg">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) =>
                  l.href.startsWith("mailto:") ? (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-fg-muted transition-colors hover:text-fg"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-fg-muted transition-colors hover:text-fg"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-fg-subtle md:flex-row">
          <nav className="flex items-center gap-4" aria-label="Legal">
            <p>© 2026 RankForge</p>
            <Link href="/privacy" className="transition-colors hover:text-fg">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-fg">
              Terms
            </Link>
          </nav>
          <p>No ranking promises. Just better technical SEO, shipped as code.</p>
        </div>
      </div>
    </footer>
  );
}
