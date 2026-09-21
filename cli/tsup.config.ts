import { defineConfig } from "tsup";

/**
 * Bundles the CLI into a single self-contained ESM file. The entry imports the
 * audit engine straight from the app's `src/` (via the `@/*` alias resolved by
 * cli/tsconfig.json), so there is exactly one source of truth for the rules —
 * the CLI and the hosted app can never drift apart.
 *
 * Run from the repo root: `npm run cli:build`.
 */
export default defineConfig({
  entry: { index: "cli/src/index.ts" },
  outDir: "cli/dist",
  tsconfig: "cli/tsconfig.json",
  format: ["esm"],
  platform: "node",
  target: "node18",
  bundle: true,
  // Bundle everything (the engine's tiny transitive deps included) so the
  // published package has zero runtime dependencies.
  noExternal: [/.*/],
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  banner: { js: "#!/usr/bin/env node" },
  // cli/package.json is "type": "module", so plain .js is ESM — and it's
  // what the `bin` entry points at.
  outExtension: () => ({ js: ".js" }),
});
