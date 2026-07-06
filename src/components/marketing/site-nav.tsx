"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#editor", label: "In your editor" },
  { href: "/#security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="container-rf flex h-16 items-center justify-between">
        <Link href="/" aria-label="RankForge home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
          >
            <GithubIcon className="size-4" />
            Connect GitHub
          </Link>
        </div>

        <button
          className="grid size-9 place-items-center rounded-md border border-border text-fg md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-bg/95 backdrop-blur-xl md:hidden">
          <div className="container-rf flex flex-col py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-sm text-fg-muted hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-3 text-sm text-fg-muted hover:text-fg"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-electric px-4 text-sm font-medium text-white"
            >
              <GithubIcon className="size-4" />
              Connect GitHub
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
