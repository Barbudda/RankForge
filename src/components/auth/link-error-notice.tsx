"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * Shown when /auth/confirm sends someone back with ?error=link. Read in the
 * browser so /login stays a static page; the server snapshot is null, so the
 * hydrated markup matches the prerendered one.
 */
export function LinkErrorNotice() {
  const error = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get("error"),
    () => null,
  );
  if (error !== "link") return null;
  return (
    <p role="alert" className="w-full max-w-sm rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      That link has expired or was already used. Sign in, or use &ldquo;Forgot password?&rdquo; to get a new one.
    </p>
  );
}
