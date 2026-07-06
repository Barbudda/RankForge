"use client";

import Link from "next/link";

/**
 * Error boundary for the authenticated app surface. Nested inside the (app)
 * layout, so the sidebar/topbar shell stays intact while the page content
 * shows a recoverable failure state instead of Next's default screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface/40 p-10 text-center">
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]" />
      <div className="relative mx-auto max-w-md">
        <h2 className="text-xl font-semibold text-fg">
          Something broke while loading this page
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          {error.digest
            ? `The error was logged (ref ${error.digest}).`
            : "The error was logged."}{" "}
          Your data is safe — try again, or head back to the dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium text-fg transition-colors hover:border-electric/50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
