import { Plus } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { CauseWeb } from "./dots/cause-web";
import { FAQS } from "@/lib/seo/content";

// Data moved to src/lib/seo/content.ts (single source for the visible FAQ,
// the FAQPage JSON-LD and the support chatbot's RAG corpus). Re-exported so
// existing imports keep working.
export { FAQS };


export function FaqSection({
  items = FAQS,
  title = "Questions you're probably about to ask",
}: {
  items?: ReadonlyArray<{ q: string; a: string }>;
  title?: string;
}) {
  return (
    <section id="faq" className="relative overflow-hidden py-24 md:py-28">
      <CauseWeb
        variant="faq"
        className="[mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_90%,transparent)]"
      />
      <div className="container-rf relative z-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h2>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {items.map((item) => (
            <Reveal key={item.q}>
              <details className="group rounded-xl border border-border bg-surface/60 px-5 open:border-electric/30 open:bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium text-fg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus className="size-5 shrink-0 text-fg-subtle transition-transform group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-fg-muted">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
