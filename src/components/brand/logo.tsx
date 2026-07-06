import { cn } from "@/lib/utils";

/** RankForge mark: a stylized "forge spark" formed from a code chevron. */
export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-electric">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 text-white"
          aria-hidden
        >
          <path
            d="M9 7L5 12l4 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 7l4 5-4 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          Rank<span className="text-fg-muted">Forge</span>
        </span>
      )}
    </span>
  );
}
