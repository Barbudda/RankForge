import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-fg-subtle">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-fg">
                  {b.label}
                </Link>
              ) : (
                <span className="text-fg-muted">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && (
                <ChevronRight className="size-3.5" />
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
