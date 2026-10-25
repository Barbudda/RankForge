"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useLiquidRefraction } from "@/components/ui/liquid-refraction";

const LINKS = [
  { href: "/audit", label: "Free audit" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#editor", label: "In your editor" },
  { href: "/#security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  useLiquidRefraction(bar, { bezel: 14, thickness: 18, blur: 10 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      {/* Floating liquid-glass bar. A touch denser once content scrolls under it. */}
      <nav
        ref={bar}
        className={cn(
          "lg mx-auto flex h-14 max-w-[76rem] items-center justify-between rounded-full pr-2 pl-5 transition-[background-color] duration-300",
          scrolled && "bg-[rgb(18_15_13/0.62)]",
        )}
      >
        <Link href="/" aria-label="RankForge home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.07] hover:text-fg hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.07] hover:text-fg"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="lg lg-molten inline-flex h-9 items-center gap-2 whitespace-nowrap px-4 text-sm font-medium rounded-full transition-[filter] hover:brightness-110"
          >
            Start free
          </Link>
        </div>

        <button
          className="grid size-9 place-items-center rounded-full text-fg hover:bg-white/[0.07] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="lg mx-auto mt-2 max-w-[76rem] rounded-3xl lg:hidden">
          <div className="flex flex-col px-4 py-3">
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
              href="/signup"
              onClick={() => setOpen(false)}
              className="lg lg-molten mt-2 inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-medium rounded-full transition-[filter] hover:brightness-110"
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
