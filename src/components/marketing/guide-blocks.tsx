import Link from "next/link";
import type { GuideBlock } from "@/lib/seo/guides";

export const PROSE_LINK =
  "text-molten-bright underline decoration-molten-bright/40 underline-offset-2 hover:decoration-molten-bright";

// The guide text format: `code` spans and [label](href) links, nothing else.
const TOKEN = /(`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-code px-1 py-0.5 font-mono text-[0.85em] text-fg">
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const [, label, href] = link;
          return href!.startsWith("/") ? (
            <Link key={i} href={href!} className={PROSE_LINK}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href} className={PROSE_LINK}>
              {label}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

export function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === "p") {
          return (
            <p key={i}>
              <Inline text={block.text} />
            </p>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <figure key={i} className="mt-3">
            <figcaption className="mb-1.5 font-mono text-xs text-fg-subtle">{block.label}</figcaption>
            {/* Wrapped, not scrolled: the end of a long warning is often the part that matters. */}
            <pre className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-lg border border-border bg-code p-4 font-mono text-xs leading-relaxed text-fg-muted">
              <code>{block.code}</code>
            </pre>
          </figure>
        );
      })}
    </>
  );
}
