import type { ReactNode } from "react";

/**
 * Shared shell for static prose pages (privacy, terms, docs, changelog).
 * Clears the fixed nav, constrains line length, and keeps the house type
 * scale without pulling in a prose plugin.
 */
export function ProsePage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative pt-32 pb-24 md:pt-40">
      <div className="container-rf">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          {intro && <p className="mt-4 text-fg-muted">{intro}</p>}
          <div className="mt-10 space-y-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function ProseBlock({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-fg">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-fg-muted">
        {children}
      </div>
    </div>
  );
}
