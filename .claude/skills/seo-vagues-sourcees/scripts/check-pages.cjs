// Contrôles d'une liste de page.tsx : tiret cadratin, mots interdits, toc = sections, liens internes valides.
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const files = process.argv.slice(3);
const reg = fs.readFileSync(path.join(root, "content/pages.ts"), "utf8");
const known = new Set([...reg.matchAll(/path: "([^"]+)"/g)].map((m) => m[1]));
["/", "/fr", "/pricing", "/fr/tarifs", "/about", "/tools", "/legal", "/privacy", "/terms"].forEach((p) => known.add(p));
const BANNED = /\b(delve|landscape|navigate|unlock|elevate|seamless(ly)?|robust|crucial|game-changer|leverage|empower|streamline|comprehensive|ultimate|cutting-edge|in conclusion|it's worth noting|whether you're|let's dive)\b/i;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const issues = [];
  if (s.includes("—")) issues.push("tiret cadratin");
  const text = s.replace(/url:\s*"[^"]*"/g, "").replace(/href=\{?"[^"]*"/g, "");
  const b = text.match(BANNED);
  if (b) issues.push("mot interdit: " + b[0]);
  if (/it(’|')s not [^.]{1,60}, it(’|')s/i.test(text)) issues.push("tournure it's not X, it's Y");
  const tocIds = [...s.matchAll(/\{ id: "([^"]+)", label:/g)].map((m) => m[1]);
  const secIds = [...s.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
  const missing = tocIds.filter((i) => !secIds.includes(i));
  const extra = secIds.filter((i) => !tocIds.includes(i));
  if (missing.length || extra.length) issues.push(`toc/sections: manque ${missing} en trop ${extra}`);
  const links = [...s.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1].replace(/\/$/, "") || "/");
  const dead = [...new Set(links.filter((l) => !known.has(l)))];
  if (dead.length) issues.push("liens inconnus: " + dead.join(", "));
  const words = s.replace(/<[^>]+>/g, " ").split(/\s+/).length;
  console.log(`${issues.length ? "!!" : "ok"} ${path.basename(path.dirname(f))} (${words} mots bruts)${issues.length ? " : " + issues.join(" | ") : ""}`);
}
