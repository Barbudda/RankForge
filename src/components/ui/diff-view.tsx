import { cn } from "@/lib/utils";

/**
 * Renders a unified diff string with GitHub-style coloring.
 * Pure presentational — splits on newlines and styles by leading char.
 */
export function DiffView({
  diff,
  className,
  filename,
}: {
  diff: string;
  className?: string;
  filename?: string;
}) {
  const lines = diff.split("\n");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-code font-mono text-[12.5px] leading-relaxed",
        className,
      )}
    >
      {filename && (
        <div className="flex items-center gap-2 border-b border-border bg-surface/70 px-4 py-2 text-xs text-fg-muted">
          <span className="size-2 rounded-full bg-electric/70" />
          {filename}
        </div>
      )}
      <pre className="overflow-x-auto">
        <code className="block min-w-full">
          {lines.map((line, i) => {
            const isAdd = line.startsWith("+") && !line.startsWith("+++");
            const isDel = line.startsWith("-") && !line.startsWith("---");
            const isMeta = line.startsWith("@@");
            const isHead =
              line.startsWith("+++") ||
              line.startsWith("---") ||
              line.startsWith("diff ");
            return (
              <span
                key={i}
                className={cn(
                  "block px-4",
                  isAdd && "bg-signal/10 text-signal",
                  isDel && "bg-danger/10 text-danger",
                  isMeta && "text-violet/80",
                  isHead && "text-fg-subtle",
                  !isAdd && !isDel && !isMeta && !isHead && "text-fg-muted",
                )}
              >
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
