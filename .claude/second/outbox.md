# Second · Outbox

---

## Mission « Graphisme signature » — WebGL `code chaos → SEO clarity` (worker: Opus 4.8)

**Date:** 2026-06-24 · **Result:** ✅ Done (A + B + C live; D prepared, awaiting keys)

### What was delivered

A signature WebGL hero scene replacing the 2D background, driven by scroll:

- **Volet A — WebGL engine.** A single `InstancedMesh` of textured SEO-token
  quads (real tokens: `<title> missing`, `alt=""`, `canonical: ?`, `h1 × 3`,
  `og:image missing`, `schema: missing`, `PR #42 ready`…). Each instance carries
  a **chaos** transform and an **order** transform baked into instanced
  attributes; one `uProgress` uniform lerps between them **entirely in the vertex
  shader** — zero per-instance CPU work per frame. At progress 0: deep-z scatter,
  wild rotation, red/amber. At 1: flat aligned grid, rotation 0, cyan/signal.
- **Volet B — Scroll choreography.** `useScroll(heroRef, ['start start','end
  start'])` → `useSpring(80, 24)` (the **same constants as `chaos-to-clarity.tsx`**
  so hero + section feel authored by one hand). Progress is written to the
  material uniform inside `useFrame` via `THREE.MathUtils.damp` — **no React state
  per frame**. The morph flows continuously into the existing "From code chaos to
  SEO clarity" section below.
- **Volet C — Premium polish.** Per-instance **staggered wave** (tokens resolve
  in sequence, not in lockstep), idle drift that **decays to perfect stillness**
  as order is reached, depth fade into `#05060b`, mouse micro-parallax (desktop),
  an **electric `#4f7bff` "ignition" sliver** at the red→green crossover so the
  ramp never muds to gray, and a cheap **additive "fake-bloom" pass** that lights
  only resolved tokens into a calm cyan/green constellation.
- **Volet D — prepared, awaiting keys.** `tools/asset-gen/README.md` documents the
  **offline** AI-asset factory (open-generative-ai is an app, higgsfield-client is
  a paid Python SDK — neither belongs in the web runtime). No keys were provided,
  so **nothing was executed**; the scene uses **100% procedural in-shader assets**,
  which fully suffice. Exact commands are documented for when keys exist. **No
  Python/Electron dependency added.**

### Files touched (graphics only)

**New**
- `src/components/marketing/glyph-field.shaders.ts` — GLSL (body + halo) + `TOKENS`
- `src/components/marketing/glyph-field.tsx` — atlas, dual-buffer geometry, materials, `useFrame`
- `src/components/marketing/glyph-field-canvas.tsx` — R3F `<Canvas>` root (default export → its own chunk)
- `src/components/marketing/chaos-field-3d.tsx` — orchestrator: dynamic `ssr:false` import, capability gating, IntersectionObserver, error boundary, 2D base/fallback
- `src/hooks/use-can-launch-webgl.ts` — deterministic client-only capability probe
- `tools/asset-gen/README.md` — Volet D

**Modified**
- `src/components/marketing/hero.tsx` — added `heroRef`; swapped `<ChaosToClarityBackground/>` → `<ChaosField3D heroRef={heroRef}/>`
- `src/components/marketing/chaos-background.tsx` — added `showFragments` prop (2D pills hide when WebGL is live; grid/spotlight/graph base stays)
- `package.json` / `package-lock.json` — deps

**NOT touched (per guardrails):** `src/lib/audit`, `src/lib/scoring`, `src/lib/github`,
`src/lib/mock` (data/business logic), `chaos-to-clarity.tsx`, `pr-card.tsx`,
`globals.css`, `layout.tsx`.

### Dependencies (allowed set)

Added: `three@0.184.0`, `@react-three/fiber@9.6.1`, `@react-three/drei@10.7.7`,
`@react-three/postprocessing@3.0.4` (+ `@types/three@0.184.1` transitively). All
React-19 / Next-16 compatible (R3F v9, drei v10).

> **Honesty note:** the shipped scene imports **only `three` + `@react-three/fiber`**.
> Fake-bloom is done with an additive instanced pass **instead of** an
> `EffectComposer` postprocessing pass — this deliberately avoids a full-screen
> render target (the #1 mobile fps cost per the perf envelope). `drei` /
> `postprocessing` are installed (allowed, zero bundle impact since not imported)
> and left available for future iterations.

### Verification

- `npm run typecheck` → **green**
- `npm run build` → **green**; `/` stays **`○ (Static)`** → three.js is in a
  separate `ssr:false` dynamic chunk, **not** in the SSR/initial bundle → **LCP
  unaffected**.
- `npm run lint` → **green** (fixed the new `react-hooks/set-state-in-effect` and
  `react-hooks/refs` rules by deferring the one-shot probe write to rAF and moving
  the failure latch from a ref to state).
- **Playwright visual QA** (real GPU: ANGLE / Intel / D3D11):
  - Top of page → full chaos (scattered, rotated red/amber tokens). ✅
  - Scroll → tokens align, tint shifts to cyan/green, motion calms. ✅
  - Mobile viewport (390×844) → hero stacks cleanly, field stays subtle, no breakage. ✅
  - **0 console errors.** One benign **dev-only** warning: `THREE.Clock` deprecation
    emitted by `@react-three/fiber` internals (upstream, not our code).

### Perf budget observed

- **36 instances desktop / 16 mobile**, **2 draw calls** (body + halo), `dpr`
  capped `[1,2]` / `[1,1.5]`, **no EffectComposer**.
- Canvas **lazy-mounted** after `requestIdleCallback` **and** hero-in-view, behind
  a capability gate (reduced-motion → never load; no WebGL2 → 2D; software
  renderer (SwiftShader/llvmpipe) → 2D; coarse-pointer / ≤4 cores / ≤4GB → mobile
  tier). `frameloop` pauses when the hero scrolls out of view. Runtime
  self-downgrade reverts to the 2D field if sustained ~<36fps.
- At 36 instanced quads + 36 additive halos in 2 draw calls, the scene is trivially
  GPU-bound; QA ran smooth at 1440×900. (No on-screen fps meter was added; the
  runtime sampler guards the lower bound.)

### Art-direction choices (tranchés)

Picked **"Twin-Buffer Glyph Lattice"** from a **6-agent design panel** (4 independent
approaches + a perf-envelope lens + a synthesis pass, run via the Workflow tool
before any code). Rationale: most premium look a single engineer can ship green
this session, grafting the best ideas from the runners-up:

- **Legible real SEO tokens** (canvas atlas) over abstract particles — the story is
  literal: warnings becoming checks.
- **Color ramp** uses only `@theme` tokens: red `#ff6b81` / amber `#ffb454` (chaos)
  → cyan `#22d3ee` / signal `#34e0a1` (order), with the electric `#4f7bff`
  **ignition** at the crossover. No new palette introduced.
- **Deterministic `mulberry32(0x5eed)`** seed for all "random" placement →
  hydration-safe, identical every load, HMR-stable (no `Math.random`/`Date.now`).
- **2D field is the floor**, never unmounted; its pills hide only while WebGL is
  live to avoid double-imagery; it is also the full reduced-motion / low-GPU /
  error fallback (never a blank screen, no CLS).
- Added a **`?forcewebgl=1`** dev/demo override to preview the scene on
  software-renderer / headless browsers (skips the SwiftShader blocklist only).

### Known follow-ups / open risks

- Mobile tier is exercised through the same code path but was **not** GPU-profiled
  on a real low-end device (QA browser reported a desktop-class GPU).
- The runtime auto-downgrade threshold is intentionally conservative.
- Atlas crispness depends on `document.fonts.ready` (raced with an 800ms timeout →
  brief system-mono fallback possible on a cold load; decorative, acceptable).
- `drei` / `postprocessing` installed but unused (see honesty note).
- OneDrive `.next` `EPERM` on rebuild appeared once earlier in the session; cleared
  with `rm -rf .next` (documented, not "fixed" by disabling features).

---

## Follow-up — Full-page "wild 3D" scroll choreography (worker: Opus 4.8)

**Date:** 2026-06-24 · **Result:** ✅ Done · typecheck + lint + build green

User asked for the animation to be more ambitious: not just a hero backdrop but a
full-page, scroll-interactive 3D scene where the code organizes/aligns as you
scroll the whole page, with "animations 3d de fou".

**Delivered (from a 2nd design panel — VORTEX helix synthesis):**
- The canvas is now a **full-page fixed backdrop** (`fixed inset-0 -z-10`) owned by
  the marketing layout, driven by **whole-page scroll** (`useScroll()` window 0→1).
  App routes never mount it → dashboard stays sober.
- **Multi-act choreography**: Act1 chaos cloud with **full 3-axis quaternion tumble**
  → Act2 sucked into a slowly rotating **double-helix spindle** the camera **dollies
  into** (z 6.2→2.0, fov breathe) → Act3 the helix **unwinds and flattens** onto the
  clean grid as the camera pulls back → Act4 calm green constellation. Colors
  red/amber → electric ignition → cyan/signal across the acts.
- **Scroll-driven cinematic camera** (dolly + fov + decaying orbit + roll) computed
  in `useFrame` from the damped scroll value — dirty-checked projection, **zero
  per-frame React state**.
- Tuned for drama after a screenshot pass: acts shifted earlier (helix peaks ~30%
  scroll in the roomier sections), spindle enlarged, dolly deepened, 40→**60
  instances** desktop (24 mobile), field brightness kept high through the helix then
  receding (`uFade` density step) behind dense copy.

**Files changed:** `glyph-field.shaders.ts` (helix + 3-axis Rodrigues tumble +
in-shader acts + retimed ignition, body+halo), `glyph-field.tsx` (count 60,
aSpinAxis/aHelixT/aStrand, uHelixOn/uTurns/uScale, camera rig, uFade step),
`glyph-field-canvas.tsx` (camera z 6.2), `chaos-field-3d.tsx` (window `useScroll()`,
visibilitychange pause, drop heroRef), **new** `scene-backdrop.tsx` (fixed full-page
+ readability scrim), `(marketing)/layout.tsx` (mount backdrop), `hero.tsx` (drop the
hero-local field). `src/lib/*` untouched.

**Guardrails held:** still 2 draw calls + 1 extra vec3 attribute; landing stays
statically prerendered with three.js in its own chunk (LCP-safe); reduced-motion /
no-WebGL2 / software-renderer / weak-GPU → 2D floor; runtime self-downgrade + tab
visibility pause now protect the whole-page canvas; readability verified by
screenshot pass over hero → helix → grid → pricing (content stays AA-legible).

**Verification:** `npm run typecheck`, `npm run lint`, `npm run build` all green;
`/` + `/pricing` static. Playwright QA (real GPU) across full-page scroll: chaos →
helix dolly-in → unwind-to-grid → calm, 0 console errors (1 benign upstream
`THREE.Clock` deprecation from R3F). Preview on software GPUs with `?forcewebgl=1`.

---

## Follow-up — Idle auto-dim feature + big optimization pass (worker: Opus 4.8)

**Date:** 2026-06-24 · **Result:** ✅ Done · typecheck + lint + build green

### Feature: idle auto-dim
After **2s without scrolling** the WebGL field fades to a faint residual (uniform
`uIdle` → 0.12) **plus a slight CSS blur** (`blur(2.5px)`) so copy is easy to read;
the next scroll ramps it **back over ~2s**. All in `useFrame` (zero per-frame React
state). New `uIdle` uniform multiplied into body + halo alpha; `dimmed` React state
toggles the blur (flips rarely). Verified with a runtime probe: `idle` ramps
0.12↔~1 with scroll/idle; blur clears at the peak and returns after 2s.

### Optimization pass (driven by a 6-agent audit → prioritized plan)
Measured **before/after on a production build** (Chrome perf trace):
- **LCP 1015 ms → 127 ms (~8×).** Root cause: the hero `<h1>` (LCP element) was a
  `motion.h1` animating from `opacity:0`, so the SSR'd headline stayed invisible
  until hydration. Fix: `initial={false}` on the H1 (keeps the rest of the
  entrance). CLS stayed **0.00**.
- **GPU pauses when idle.** The full-page canvas was `frameloop='always'` (~60fps
  forever). Switched to **`frameloop="demand"`** with a self-sustaining
  `invalidate()` that runs only while animating (helix act / scroll-settle /
  idle-dim ramp) and **coasts to 0fps when idle** — verified the render clock
  freezes at the top when idle and **resumes instantly on scroll**. (The helix act
  intentionally keeps spinning while it's on-screen.)
- **Pause when scrolled past:** the old `inView` gate observed a `position:fixed`
  element (always intersecting). Replaced with a real `scrollYProgress < 0.985`
  range gate.
- **DPR capped 2 → 1.5** (−30–45% fragment cost on hi-DPI; imperceptible behind the
  scrim) and the **additive halo pass is skipped** during the chaos act
  (`haloMat.visible = uProgress > 0.3`).
- **Removed a per-scroll-frame React re-render**: the chaos-to-clarity score counter
  used `useState`+`useMotionValueEvent` (re-rendered the whole section every frame);
  now a `useTransform` MotionValue rendered via `<motion.span>` (reduced-motion still
  shows a static 92).
- **Bundle/dead-code hygiene:** removed unused `@react-three/drei` +
  `@react-three/postprocessing` (~6.9MB node_modules; they were never imported —
  the bloom is a hand-written additive pass), pinned `@types/three` so typecheck is
  self-contained, added `experimental.optimizePackageImports: ['motion']`, dropped
  the unused `images.unsplash.com` remote pattern, deleted the unused
  `count-up.tsx` component and `plural()` helper.

Deferred (documented in the plan): LazyMotion `m`-factory migration, atlas
downscale, dependency-version pinning — all real-but-medium-risk, scheduled as
separate measured follow-ups.

### Files touched
`glyph-field.tsx` (uIdle, on-demand invalidate loop, halo gate), `glyph-field.shaders.ts`
(uIdle), `glyph-field-canvas.tsx` (frameloop=demand, dpr 1.5), `chaos-field-3d.tsx`
(scroll-range gate, dimmed/blur), `hero.tsx` (LCP `initial={false}`),
`chaos-to-clarity.tsx` (MotionValue score), `next.config.mjs`, `package.json`/lock,
`src/lib/utils.ts`, deleted `animations/count-up.tsx`. `src/lib/*` business logic untouched.

### Verification
`npm run typecheck`, `npm run lint`, `npm run build` all **green**; `/` still static
(three.js in its own lazy chunk). Playwright runtime probe confirmed idle-dim,
on-demand pause + resume, and reduced-motion/2D fallback intact. 0 console errors
(1 benign upstream `THREE.Clock` deprecation from R3F). Preview the scene on
software GPUs with `?forcewebgl=1`.

---

## Re-verification — mission intact after the SEO + Supabase work (worker: Opus 4.8)

**Date:** 2026-06-27 · **Result:** ✅ DoD still holds, no regressions. All 7 boxes checked.

After the WebGL mission shipped, later sessions added SEO infra (JSON-LD, OG image,
sitemap/robots/manifest, per-page canonical) and a Supabase auth + data layer. Some of
those edits touched files the mission also owns, so the mission was re-verified against
the **current** code rather than re-built.

**Edits that overlapped the mission (confirmed non-breaking):**
- `hero.tsx` — `initial={false}` was extended from the H1 to the badge/paragraph/CTA/
  chips so all above-the-fold hero copy paints at SSR. The H1 (LCP element) is still
  SSR-painted; the scene lives in `scene-backdrop.tsx`, untouched by this.
- `src/app/(marketing)/layout.tsx` — a `<JsonLd data={siteGraph}/>` `<script>` was added
  as the first child, before `<SceneBackdrop/>`. The backdrop still mounts and the
  whole-page `useScroll()` still drives `uProgress`.
- New routes `opengraph-image.tsx` / `sitemap.ts` / `robots.ts` / `manifest.ts` — separate
  routes, no effect on the scene.

**How it was re-verified (this session):**
- **4-agent re-verify swarm** over the DoD dimensions (hydration + reduced-motion/mobile
  fallback · perf/LCP incl. the new `initial={false}` · scope/palette/a11y). **Zero
  confirmed regressions.** (The choreography dimension hit a schema-retry cap; verified
  visually instead — see below.)
- **Playwright visual QA** (`/?forcewebgl=1`): canvas mounts inside an `aria-hidden`
  container; **top = chaos** (red/amber, hero copy paints immediately) → **~30% = ordering
  / helix** (cyan/green tokens emerging, content AA-legible over the scrim) → **bottom =
  calm resolved green constellation**. **0 console errors** at every scroll position
  (1 benign upstream `THREE.Clock` warning).
- `npm run typecheck` + `npm run build` **green**; `/` + `/pricing` stay `○ (Static)` →
  three.js remains in its own `ssr:false` lazy chunk (LCP-safe). `src/lib/*` untouched.

No code changes were needed — the mission holds as shipped. DoD checkboxes in `task` ticked.

---

## 3D/2D fallback calibration — perf-aware gating tuned (worker: Opus 4.8)

**Date:** 2026-06-27 · **Result:** ✅ typecheck green. 2 files changed. No QA run yet (needs real throttling).

User directive: keep **full 3D by default**; only drop to the 2D floor for genuinely
limited hardware **or poor network** — and crucially *do not* over-downgrade machines
that are "capable but just barely." The old gating was too eager. Two adjustments:

**1. Network gate added (was missing entirely) — `src/hooks/use-can-launch-webgl.ts`**
- Now reads the **Network Information API** (`navigator.connection`):
  - `saveData === true` **or** `effectiveType` in {`2g`,`slow-2g`} → stay on the 2D
    floor **and the three.js chunk is never fetched** (the `dynamic import` stays gated
    behind `ready=false`, so no wasted bytes on a bad link).
  - `3g` and above → **real 3D**. We deliberately do **not** downgrade a decent 3g.
  - API absent (Firefox/Safari) → assume the link is fine → **3D**. Never blind-degrade.
  - `?forcewebgl=1` still short-circuits this gate (preview on any connection).

**2. Runtime degrade threshold relaxed — `src/components/marketing/glyph-field.tsx`**
- The hot-swap-to-2D trigger was firing under **~36 fps** (`delta > 0.028`) — exactly the
  "capable but barely" case the user wanted protected. New floor: **~24 fps**
  (`delta > 0.042`). Between 24–36 fps the scene **stays 3D** (a background scene is
  perfectly smooth there).
- Existing hysteresis (`frames>45 && slow>30`) kept, so a one-off GC stutter never trips it.

**Deliberately NOT changed:** the `mobile` instance tier (24 vs 60 instances) is an
*allocation* downgrade, not a 2D fallback — a modest phone keeps real 3D, just lighter.
That matches the directive, so it was left alone.

**Verification:** `npm run typecheck` ✅. **No Playwright QA run** — the network/fps gate
is only meaningful under real throttling (DevTools → Network 2g, or CPU 6× to provoke the
fps degrade); a normal headless run wouldn't exercise either branch. Recommend a throttled
QA pass next: confirm the degrade no longer fires at ~30 fps and still fires below ~24.
