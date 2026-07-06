import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_40%,#000,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-96 spotlight" />
      <div className="relative text-center">
        <Logo className="justify-center" />
        <p className="mt-8 font-mono text-7xl font-semibold text-electric-bright">404</p>
        <h1 className="mt-4 text-xl font-semibold text-fg">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          This route returned a noindex — let&apos;s get you back to clarity.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
          >
            Back home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium text-fg transition-colors hover:border-electric/50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
