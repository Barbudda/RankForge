#!/usr/bin/env node
/**
 * Parcourt un site en ligne et vérifie ses invariants de référencement.
 *
 * Il interroge le site **tel qu'il est servi**, pas tel qu'il est écrit : une
 * configuration correcte et une page correcte sont deux choses, et c'est la
 * seconde que les moteurs lisent.
 *
 * Usage : node parcourir.mjs https://exemple.com
 *
 * Sort en code 1 si un défaut est trouvé, pour servir de garde-fou en CI.
 */

const BASE = (process.argv[2] || "").replace(/\/$/, "");
if (!BASE) {
  console.error("Usage : node parcourir.mjs https://exemple.com");
  process.exit(2);
}

/** Ordres de grandeur observés dans les résultats, pas une règle officielle. */
const TITRE_MAX = 70;
const DESC_MIN = 70;
const DESC_MAX = 165;

const vus = new Set();
const aVoir = ["/"];
const problemes = [];
const pages = [];

const versChemin = (href, depuis) => {
  try {
    const u = new URL(href, BASE + depuis);
    return u.origin === BASE ? u.pathname + u.search : null;
  } catch {
    return null;
  }
};

while (aVoir.length) {
  const chemin = aVoir.shift();
  if (vus.has(chemin)) continue;
  vus.add(chemin);

  let r;
  try {
    r = await fetch(BASE + chemin, { redirect: "manual" });
  } catch (e) {
    problemes.push(`${chemin} → injoignable (${e.message})`);
    continue;
  }

  pages.push({ chemin, code: r.status });
  if (r.status >= 400) {
    problemes.push(`${chemin} → HTTP ${r.status}`);
    continue;
  }
  if (!r.headers.get("content-type")?.includes("text/html")) continue;

  const html = await r.text();
  const titre = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = html.match(/name="description" content="([^"]*)"/)?.[1];
  const canon = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  const h1 = [...html.matchAll(/<h1[\s>]/g)].length;
  const noindex = /name="robots" content="[^"]*noindex/.test(html);

  if (!noindex) {
    if (!titre) problemes.push(`${chemin} → pas de <title>`);
    else if (titre.length > TITRE_MAX)
      problemes.push(`${chemin} → titre de ${titre.length} signes (> ${TITRE_MAX}) : « ${titre} »`);

    if (!desc) problemes.push(`${chemin} → pas de meta description`);
    else if (desc.length > DESC_MAX)
      problemes.push(`${chemin} → description de ${desc.length} signes (> ${DESC_MAX})`);
    else if (desc.length < DESC_MIN)
      problemes.push(`${chemin} → description de ${desc.length} signes (< ${DESC_MIN})`);

    // Hors domaine seulement : comparer au chemin exact produit des faux
    // positifs dès qu'on parcourt une adresse locale alors que le site calcule
    // ses canoniques depuis la variable de production.
    if (!canon) problemes.push(`${chemin} → pas de canonique`);
    else if (!canon.startsWith(BASE))
      problemes.push(`${chemin} → canonique hors domaine : ${canon}`);

    if (h1 !== 1) problemes.push(`${chemin} → ${h1} balise(s) h1`);
  }

  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(img[0])) problemes.push(`${chemin} → <img> sans alt`);
  }

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const c = versChemin(m[1], chemin);
    if (c && !c.startsWith("/_next/") && !vus.has(c)) aVoir.push(c.split("#")[0]);
  }
}

console.log(`${pages.length} pages parcourues`);
for (const p of pages.sort((a, b) => a.chemin.localeCompare(b.chemin))) {
  console.log(`  ${p.code}  ${p.chemin}`);
}

if (problemes.length === 0) {
  console.log("\nAucun problème.");
  process.exit(0);
}
console.log(`\n${problemes.length} problème(s) :`);
for (const p of problemes) console.log("  • " + p);
process.exit(1);
