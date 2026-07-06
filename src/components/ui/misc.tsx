import { cn } from "@/lib/utils";
import type { Framework, SeoCategory } from "@/types";
import { CATEGORY_META, FRAMEWORK_META } from "@/lib/seo/constants";

/** Thin labeled progress bar. */
export function Progress({
  value,
  className,
  color = "var(--color-electric)",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/** Framework chip with brand dot. */
export function FrameworkBadge({ framework }: { framework: Framework }) {
  const meta = FRAMEWORK_META[framework];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-fg-muted">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: SeoCategory }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-fg-muted">
      {CATEGORY_META[category].label}
    </span>
  );
}

/** Section heading used inside the app pages. */
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Empty state placeholder. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-fg-subtle">{icon}</div>}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Small key/value stat used in detail pages. */
export function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{children}</dd>
    </div>
  );
}
