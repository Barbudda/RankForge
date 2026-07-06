# RankForge — offline AI asset factory (Volet D)

> **Status: prepared, awaiting API keys. Nothing here runs at build or runtime.**

This folder is an **isolated, offline** pipeline for generating *decorative* hero
assets with external AI image/video tools. It is intentionally kept **out of
`src/`** and adds **zero dependencies** to the Next.js app. The web app never
imports anything from here, never ships a Python/Electron runtime, and never
needs an API key in its bundle.

## Why it's offline-only

The two tools requested are **not importable into a Next/TS frontend**:

- [`anil-matcha/open-generative-ai`](https://github.com/anil-matcha/open-generative-ai)
  — a full Next/Electron **application** for generating images/videos across 200+
  models. It's an app to *run*, not a library to `import`.
- [`higgsfield-ai/higgsfield-client`](https://github.com/higgsfield-ai/higgsfield-client)
  — a **Python SDK** (text→image/video) requiring paid `HF_API_KEY` /
  `HF_API_SECRET`. Python + secrets have no place in a front-end runtime.

The correct pattern is therefore an **offline asset factory**: generate a few
visuals **once**, then commit only the produced files into `public/` (e.g.
`public/hero/ambient-texture.webp`, particle/glyph sprites, an optional ambient
hero loop, an OG image). Zero runtime deps, zero keys in the bundle.

## Current state — procedural assets, no keys needed

The signature hero (`code chaos → SEO clarity`) currently uses **100% procedural,
in-shader assets** (an instanced glyph atlas built at runtime on a canvas + GLSL
tint/displacement). It needs **no** generated images to look premium, so the
build is unblocked and this volet is optional polish.

## When you provide keys — exact commands

The user has **not** provided `HF_API_KEY` / `HF_API_SECRET`, so **nothing was
executed**. When keys are available, run the pipeline in an **isolated Python
venv** (never added to the web project):

```bash
# 1. Isolated env — NOT part of the Next app
cd tools/asset-gen
python -m venv .venv
. .venv/Scripts/activate        # Windows (Git Bash);  ".venv/bin/activate" on macOS/Linux
pip install higgsfield-client pillow

# 2. Provide credentials for THIS shell only (never commit them)
export HF_API_KEY=...           # from https://higgsfield.ai
export HF_API_SECRET=...

# 3. Generate the decorative assets (see prompts/ below) and write to ../../public/hero/
python generate.py
```

`generate.py` (to be authored when keys exist) should:

1. Read prompts from `prompts.json` (art direction below).
2. Call the Higgsfield client for each prompt.
3. Downscale + convert to `.webp` with Pillow.
4. Write **only** the final files into `../../public/hero/` and print a manifest.

> For the **open-generative-ai** app, run it separately (its own repo / Electron
> build), export the chosen frames, and drop them into `public/hero/` the same way.

## Art direction for any generated asset (must match the @theme palette)

- Deep near-black background `#05060b`; accents **electric blue `#4f7bff`**,
  **cyan `#22d3ee`**, **signal green `#34e0a1`**; warnings red `#ff6b81` / amber `#ffb454`.
- Mood: sober, technical, futuristic — *not* glossy or gimmicky. Subtle grain,
  faint vector/graph lines, fragments of code resolving into order.
- Decorative only. **Never** generate factual content, copy, or anything that
  lands in `src/lib/*`. Assets are ambiance behind the real, accessible DOM.

## Guardrails honored

- No Python/Electron dependency added to the web project.
- No keys executed (none provided) → no network calls, no spend.
- Outputs (if ever generated) are decorative `public/` files only.
