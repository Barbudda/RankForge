#!/usr/bin/env node
/**
 * Export the PUBLIC repo (github.com/Barbudda/rankforge-cli) from this
 * private monorepo: only the audit engine + CLI + tests + docs — no app, no
 * tooling config, no secrets.
 *
 *   node scripts/export-public.mjs <targetDir>
 *
 * The file set is computed, not hand-listed: starting from the CLI entry, it
 * follows every import (value AND type-only) through the `@/` alias and
 * relative paths. Anything the CLI doesn't need never leaves this repo.
 * Templates for the public repo's own files live in scripts/public/.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(process.argv[2] ?? join(ROOT, "..", "rankforge-cli-public"));
const TEMPLATES = join(ROOT, "scripts", "public");

// ── 1. dependency closure ────────────────────────────────────────────
// Real import/export statements only: anchored at line start, and the clause
// before `from` may not contain `;`, `=` or a backtick — so code inside
// template literals (e.g. the generated `import type { Metadata } from "next"`
// patch text) and `export const x = …` declarations are never mistaken for
// dependencies.
const IMPORT_RE = /^\s*(?:import|export)\s+(?:type\s+)?(?:[^;`=]*?\sfrom\s+)?["']([^"']+)["']/gm;

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // node: builtins / packages
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  throw new Error(`Cannot resolve "${spec}" from ${relative(ROOT, fromFile)}`);
}

const files = new Set();
const externals = new Set();
const queue = [join(ROOT, "cli", "src", "index.ts")];
while (queue.length) {
  const f = queue.pop();
  if (files.has(f)) continue;
  files.add(f);
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];
    const hit = resolveSpec(spec, f);
    if (hit) queue.push(hit);
    else if (!spec.startsWith("node:")) externals.add(spec.split("/")[0]);
  }
}
if (externals.size) {
  throw new Error(`The CLI must stay dependency-free, but imports: ${[...externals].join(", ")}`);
}

// ── 2. write the export ──────────────────────────────────────────────
// Keep the target's .git so re-exports become normal commits.
if (existsSync(target)) {
  for (const entry of readdirSync(target)) if (entry !== ".git") rmSync(join(target, entry), { recursive: true, force: true });
} else {
  mkdirSync(target, { recursive: true });
}

const put = (rel, content) => {
  const out = join(target, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
};

for (const f of [...files].sort()) {
  const rel = relative(ROOT, f).split("\\").join(posix.sep);
  mkdirSync(dirname(join(target, rel)), { recursive: true });
  copyFileSync(f, join(target, rel));
}

// Tests: same file, it locates dist/ relative to itself.
put("test/cli.test.mjs", readFileSync(join(ROOT, "cli", "test", "cli.test.mjs"), "utf8"));

// The public repo IS the npm package: its package.json derives from cli/'s.
const cliPkg = JSON.parse(readFileSync(join(ROOT, "cli", "package.json"), "utf8"));
const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
// Pin dev tooling to the versions actually installed (and tested) here.
const devVersion = (name) => {
  try {
    return "^" + JSON.parse(readFileSync(join(ROOT, "node_modules", name, "package.json"), "utf8")).version;
  } catch {
    return rootPkg.devDependencies?.[name] ?? "latest";
  }
};
const pkg = {
  ...cliPkg,
  files: ["dist", "README.md", "LICENSE"],
  repository: { type: "git", url: "git+https://github.com/Barbudda/rankforge-cli.git" },
  homepage: "https://github.com/Barbudda/rankforge-cli#readme",
  bugs: { url: "https://github.com/Barbudda/rankforge-cli/issues" },
  scripts: {
    build: "tsup",
    typecheck: "tsc --noEmit",
    test: "npm run build && node --test test/cli.test.mjs",
    prepublishOnly: "npm test",
  },
  devDependencies: {
    "@types/node": devVersion("@types/node"),
    tsup: devVersion("tsup"),
    typescript: devVersion("typescript"),
  },
};
put("package.json", JSON.stringify(pkg, null, 2) + "\n");

// Templates (README, guides, action, configs…) — copied verbatim, with the
// version substituted so docs never lag the package.
function copyTemplates(dir, relBase = "") {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = relBase ? `${relBase}/${entry}` : entry;
    if (statSync(abs).isDirectory()) copyTemplates(abs, rel);
    else put(rel.replace(/^_/, "."), readFileSync(abs, "utf8").replaceAll("{{VERSION}}", pkg.version));
  }
}
copyTemplates(TEMPLATES);
put("LICENSE", readFileSync(join(ROOT, "LICENSE"), "utf8"));

console.log(`Exported ${files.size} source files + templates to ${target}`);
for (const f of [...files].sort()) console.log("  " + relative(ROOT, f).split("\\").join("/"));
