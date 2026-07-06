/**
 * Neutral route-transition skeleton shared by all (app) routes — a title bar
 * and a generic content panel that don't promise any specific page layout
 * (settings, lists and detail pages all differ).
 */
export default function AppLoading() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="mb-8 h-8 w-48 rounded-lg bg-surface" />
      <div className="h-40 rounded-xl border border-border bg-surface/50" />
      <div className="mt-4 h-72 rounded-xl border border-border bg-surface/40" />
    </div>
  );
}
