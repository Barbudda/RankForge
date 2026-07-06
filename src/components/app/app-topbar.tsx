"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, Command, LogOut } from "lucide-react";
import type { User } from "@/types";
import { UseInEditorButton } from "./use-in-editor";

export function AppTopbar({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg/80 px-5 backdrop-blur-xl">
      {/* Mobile brand */}
      <Link href="/dashboard" className="font-semibold tracking-tight lg:hidden">
        Rank<span className="text-fg-muted">Forge</span>
      </Link>

      {/* Search / command palette — not wired yet, honestly disabled. */}
      <button
        disabled
        title="Search coming soon"
        className="hidden h-9 flex-1 cursor-default items-center gap-2.5 rounded-lg border border-border bg-surface/60 px-3 text-sm text-fg-subtle opacity-70 sm:flex md:max-w-md"
      >
        <Search className="size-4" />
        <span>Search repos, issues, PRs…</span>
        <span className="ml-auto flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px]">
          <Command className="size-2.5" />K
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Discoverable entry point to the MCP server — always visible. */}
        <UseInEditorButton variant="ghost" className="hidden sm:inline-flex" />

        <button
          disabled
          title="Notifications coming soon"
          className="grid size-9 cursor-default place-items-center rounded-lg border border-border text-fg-muted opacity-70"
          aria-label="Notifications"
        >
          <Bell className="size-4.5" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface/60 py-1 pl-1 pr-3">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={28}
            height={28}
            className="size-7 rounded-md object-cover"
          />
          <div className="hidden text-left sm:block">
            <div className="text-xs font-medium leading-tight text-fg">
              {user.name}
            </div>
            <div className="text-[11px] leading-tight text-fg-subtle">
              @{user.githubLogin}
            </div>
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="grid size-9 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:text-fg"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
