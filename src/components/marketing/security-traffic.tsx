"use client";

import { useEffect, useRef, useState } from "react";
import {
  easeInOut,
  easeOut,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Lock,
  GitBranch,
  Eye,
  ShieldCheck,
  ScrollText,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { CauseWeb } from "./dots/cause-web";

/**
 * Section Security — "traffic" choreography.
 *
 * On desktop with motion enabled, the six guarantees arrive one by one like
 * oncoming traffic: each card scales up from the depth toward the viewer,
 * holds center stage, then pulls aside into a parked lane (alternating
 * left/right, scroll-parallax drift) to let the next one arrive. A tall
 * scroll runway drives everything — pure scroll-linked motion, no autonomous
 * loops.
 *
 * Accessibility / SSR safety:
 * - The static grid fallback and the animated stage are BOTH always rendered;
 *   visibility is decided purely by CSS (`lg:` + `motion-safe`/`motion-reduce`
 *   variants), so server and first client render always match (no
 *   useReducedMotion branching in markup — see house hydration rule).
 * - Content never depends on animation: the fallback grid carries the exact
 *   same six cards for mobile, reduced-motion users and crawlers.
 */

type SecurityCard = {
  icon: LucideIcon;
  title: string;
  body: string;
  tag: string;
};

const CARDS: SecurityCard[] = [
  {
    icon: Lock,
    title: "Minimal permissions",
    body: "Read-only by default. Write access is scoped to RankForge branches only.",
    tag: "permissions: read-only",
  },
  {
    icon: GitBranch,
    title: "Branch-only changes",
    body: "Never a direct commit or merge to main. Every change arrives as a PR.",
    tag: "target: rankforge/*",
  },
  {
    icon: Eye,
    title: "Review before shipping",
    body: "You inspect every diff. Nothing merges without a human.",
    tag: "merge: human-only",
  },
  {
    icon: ShieldCheck,
    title: "No access to secrets",
    body: "RankForge reads your source and rendered HTML. It never reads your environment secrets.",
    tag: "env: unreadable",
  },
  {
    icon: ScrollText,
    title: "Logs & audit trail",
    body: "Every action is recorded. Disable the agent at any time.",
    tag: "audit: full",
  },
  {
    icon: Building2,
    title: "Enterprise & self-host",
    body: "Advanced controls and self-hosting available for larger teams.",
    tag: "deploy: self-host",
  },
];

const TOTAL = CARDS.length;

/**
 * One card of the oncoming-traffic choreography.
 *
 * Timeline (7 segments for 6 cards): each card arrives BIG from the depth
 * (eased, fluid), holds center stage, then glides straight into its final
 * grid slot — so the section ENDS as the assembled 2×3 grid, every card
 * fully readable, exactly like the pre-animation layout.
 */
function TrafficCard({
  card,
  index,
  progress,
}: {
  card: SecurityCard;
  index: number;
  progress: MotionValue<number>;
}) {
  const seg = 1 / (TOTAL + 1); // one extra segment so the last card settles too
  const a0 = index * seg; // approach begins
  const a1 = index * seg + seg * 0.75; // arrived, center stage (longer = smoother)
  const d0 = (index + 1) * seg; // next card incoming → glide to grid slot
  const d1 = Math.min((index + 1) * seg + seg * 0.75, 1);

  // Final resting slot: the assembled grid (2 columns × 3 rows).
  const col = index % 2 === 0 ? -1 : 1;
  const row = Math.floor(index / 2); // 0..2
  const slotX = `${col * 55}%`;
  const slotY = `${(row - 1) * 76}%`;

  const times = [a0, a1, d0, d1];
  const eases = [easeOut, easeInOut, easeInOut];
  // Bigger throughout: starts at half size (not a distant dot), lands full
  // size center stage, settles at 0.72 in the grid — still fully readable.
  const scale = useTransform(progress, times, [0.5, 1, 1, 0.7], { ease: eases });
  const opacity = useTransform(progress, times, [0, 1, 1, 1], { ease: eases });
  const x = useTransform(progress, times, ["0%", "0%", "0%", slotX], { ease: eases });
  const y = useTransform(
    progress,
    times,
    // Approach from the vanishing point (slightly above center), then glide
    // down/up into the grid row.
    ["-30%", "0%", "0%", slotY],
    { ease: eases },
  );

  return (
    <motion.div
      style={{ scale, opacity, x, y }}
      className="absolute w-[34rem] max-w-[86vw]"
    >
      <div className="rounded-2xl border border-border bg-surface/80 p-7 shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-signal/30 bg-signal/[0.07]">
            <card.icon className="size-5 text-signal" />
          </span>
          <span className="rounded border border-border bg-bg/50 px-2 py-1 font-mono text-[11px] text-fg-subtle">
            {card.tag}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-fg">{card.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{card.body}</p>
      </div>
    </motion.div>
  );
}

export function SecuritySection() {
  const ref = useRef<HTMLDivElement>(null);
  // Self-computed runway progress (fresh rect per scroll event) — framer's
  // useScroll({target}) caches element offsets that go stale on this page
  // (late-mounting canvases above), which froze the section at progress 0.
  // Same battle-tested approach as the dots engine's computeProgress().
  const progress = useMotionValue(0);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const denom = r.height - window.innerHeight;
    if (denom <= 0) return;
    progress.set(Math.min(1, Math.max(0, -r.top / denom)));
  });
  useEffect(() => {
    // Initialize on mount (e.g. page restored mid-section).
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const denom = r.height - window.innerHeight;
    if (denom > 0) progress.set(Math.min(1, Math.max(0, -r.top / denom)));
  }, [progress]);

  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    setActive(Math.min(TOTAL - 1, Math.floor(v * (TOTAL + 1))));
  });

  // Heading parallax: drifts up as the traffic rolls in, clearing room for
  // the assembled grid at the end.
  const headY = useTransform(progress, [0, 1], [0, -84]);
  const headOpacity = useTransform(progress, [0, 0.06, 0.94, 1], [0.4, 1, 1, 0.85]);

  return (
    <section id="security" className="relative">
      {/* ── Static fallback: mobile + prefers-reduced-motion (CSS-only gate,
             SSR-stable) — same six cards, fully readable without motion. */}
      <div className="relative overflow-hidden py-24 md:py-28 lg:motion-safe:hidden">
        <div className="container-rf relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Built to be safe with write access
            </h2>
            <p className="mt-4 text-fg-muted">
              Read-only by default. When you grant write access, RankForge is
              boxed into its own branches and never touches main or your
              secrets.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {CARDS.map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-border bg-surface/60 p-6"
              >
                <c.icon className="size-5 text-signal" />
                <h3 className="mt-3 text-sm font-semibold text-fg">{c.title}</h3>
                <p className="mt-1.5 text-sm text-fg-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Animated stage: desktop + motion-safe. A 420vh runway scrolls the
             six cards through the approach → center → park choreography. */}
      <div ref={ref} className="relative hidden h-[480vh] lg:motion-safe:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          <CauseWeb
            variant="security"
            className="[mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_88%,transparent)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(70%_55%_at_50%_42%,#000_25%,transparent_80%)]"
          />

          {/* Heading (parallax) */}
          <motion.div
            style={{ y: headY, opacity: headOpacity }}
            className="container-rf relative z-10 pt-16"
          >
            <div className="max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Built to be safe with write access
              </h2>
              <p className="mt-4 text-fg-muted">
                Read-only by default. When you grant write access, RankForge is
                boxed into its own branches and never touches main or your
                secrets.
              </p>
            </div>
          </motion.div>

          {/* The road: cards arrive from the depth, then pull aside. */}
          <div className="relative z-10 flex flex-1 items-center justify-center [perspective:1200px]">
            {CARDS.map((card, i) => (
              <TrafficCard
                key={card.title}
                card={card}
                index={i}
                progress={progress}
              />
            ))}
          </div>

          {/* Progress: which guarantee is on stage. */}
          <div className="relative z-10 flex items-center justify-center gap-3 pb-6">
            {CARDS.map((c, i) => (
              <span
                key={c.title}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-8 bg-signal"
                    : i < active
                      ? "w-3 bg-signal/40"
                      : "w-3 bg-border"
                }`}
              />
            ))}
            <span className="ml-3 font-mono text-[11px] text-fg-subtle">
              {String(active + 1).padStart(2, "0")}/{String(TOTAL).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
