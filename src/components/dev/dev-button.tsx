"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  X,
  LayoutDashboard,
  FolderGit2,
  ScanSearch,
  FileDiff,
  GitPullRequest,
  Settings,
  CreditCard,
  Home,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  seedSampleData,
  clearSampleData,
  hasSampleData,
} from "@/lib/data/actions";

type Item = { href: string; label: string; icon: typeof Home };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Marketing",
    items: [
      { href: "/", label: "Landing", icon: Home },
      { href: "/pricing", label: "Pricing", icon: Tag },
    ],
  },
  {
    title: "App",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/repositories", label: "Repositories", icon: FolderGit2 },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    title: "Test the full flow",
    items: [
      { href: "/repositories/repo_acme", label: "Repo detail", icon: FolderGit2 },
      { href: "/audits/audit_acme_2", label: "Audit report", icon: ScanSearch },
      { href: "/issues/iss_acme_sitemap_dynamic", label: "Issue + diff", icon: FileDiff },
      { href: "/issues/iss_acme_canonical_features/pr", label: "Generate PR", icon: Sparkles },
      { href: "/pull-requests/pr_acme_42", label: "PR preview", icon: GitPullRequest },
    ],
  },
];

export function DevButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef(false);

  // Reflect whether the sample dataset is seeded — but only query when the
  // panel is actually opened, so idle page views trigger no server action.
  useEffect(() => {
    if (!open || checkedRef.current) return;
    checkedRef.current = true;
    let active = true;
    hasSampleData().then((on) => {
      if (active) setDevMode(on);
    });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Ctrl/Cmd + . toggles the panel.
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleDevMode = async () => {
    if (loading) return;
    const next = !devMode;
    setLoading(true);
    setError(null);
    // Seed/clear the labelled sample dataset into the owner's Supabase tables.
    const res = next ? await seedSampleData() : await clearSampleData();
    setLoading(false);
    if (res.ok) {
      setDevMode(next);
      router.refresh();
    } else {
      setError(res.error ?? "Sample data toggle failed.");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] print:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur transition-colors",
          devMode
            ? "border-amber/50 bg-amber/15 text-amber"
            : "border-border bg-bg/80 text-fg-muted hover:text-fg",
        )}
        aria-expanded={open}
        title="Dev access (Ctrl/⌘ + .)"
      >
        <FlaskConical className="size-3.5" />
        Dev
        {devMode && <span className="size-1.5 rounded-full bg-amber" />}
      </button>

      {open && (
        <>
          {/* click-away */}
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 cursor-default"
          />
          <div className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border border-border bg-elevated/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-fg">Dev access</div>
                <div className="text-[11px] text-fg-subtle">
                  Jump anywhere · sample data
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Dev mode toggle */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="text-xs font-medium text-fg">Sample data</div>
                <div className="text-[11px] text-fg-subtle">
                  {loading
                    ? "Saving to your account…"
                    : "Seed demo repos/audits into your account"}
                </div>
              </div>
              <button
                role="switch"
                aria-checked={devMode}
                onClick={toggleDevMode}
                disabled={loading}
                className={cn(
                  "inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors disabled:opacity-50",
                  devMode ? "bg-amber" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full bg-white shadow-sm transition-transform",
                    devMode ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>
            {error && (
              <div className="border-b border-border px-4 py-2 text-[11px] text-danger">
                {error}
              </div>
            )}

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {GROUPS.map((group) => (
                <div key={group.title} className="mb-1">
                  <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
                    {group.title}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                      >
                        <item.icon className="size-3.5 shrink-0 text-fg-subtle" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
