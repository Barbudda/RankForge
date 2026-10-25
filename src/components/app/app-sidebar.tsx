"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  FolderGit2,
  GitPullRequest,
  Settings,
  CreditCard,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";
import { BILLING_OPEN } from "@/lib/pricing";

function planLabel(plan: Workspace["plan"]): string {
  if (!BILLING_OPEN && plan === "free") return "Pro plan · beta";
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/pull-requests", label: "Pull requests", icon: GitPullRequest },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function AppSidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-soft/60 lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" aria-label="RankForge home">
          <Logo />
        </Link>
      </div>

      {/* Workspace label (static until multi-workspace lands) */}
      <div className="px-3 pt-4">
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-left">
          <span className="grid size-7 place-items-center rounded-md bg-molten text-xs font-bold text-ink">
            {workspace.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">
              {workspace.name}
            </span>
            <span className="block text-xs text-fg-subtle">
              {planLabel(workspace.plan)}
            </span>
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-molten/10 text-fg"
                  : "text-fg-muted hover:bg-surface/60 hover:text-fg",
              )}
            >
              <item.icon
                className={cn(
                  "size-4.5",
                  active ? "text-molten-bright" : "text-fg-subtle",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/repositories"
          className="flex items-center justify-center gap-2 rounded-lg bg-molten px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-molten-bright"
        >
          <Plus className="size-4" />
          Connect a repo
        </Link>
      </div>
    </aside>
  );
}
