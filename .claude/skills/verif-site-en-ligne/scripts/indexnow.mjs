#!/usr/bin/env node
/**
 * Prévient les moteurs qu'une page a changé, via IndexNow.
 *
 * IndexNow est un protocole ouvert accepté par Bing, Yandex, Seznam et Naver.
 * **Google n'y participe pas** : pour Google, il faut la Search Console. Le gain
 * est donc partiel, mais il est gratuit, immédiat, et évite d'attendre le
 * prochain passage du robot sur les pages qu'on vient de publier.
 *
 * Usage :
 *   node indexnow.mjs https://exemple.com                  → tout le plan du site
 *   node indexnow.mjs https://exemple.com /guides /outils  → ces pages seulement
 *
 * L'adresse peut aussi venir de NEXT_PUBLIC_SITE_URL.
 *
 * Mise en place, une fois : déposer un fichier « <clé>.txt » à la racine
 * publique du site, contenant la clé elle-même (32 caractères hexadécimaux).
 *   node -e "const c=require('crypto').randomBytes(16).toString('hex');require('fs').writeFileSync('public/'+c+'.txt',c);console.log(c)"
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const SITE = (args.find((a) => a.startsWith("http")) ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
  .replace(/\/$/, "");

if (!SITE) {
  console.error("Adresse du site manquante : node indexnow.mjs https://exemple.com");
  process.exit(2);
}
const HOTE = new URL(SITE).host;

/**
 * La clé est le nom du fichier déposé à la racine publique. On balaye les
 * emplacements habituels depuis le dossier courant, pour ne pas dépendre de la
 * forme du projet.
 */
function cle() {
  const dossiers = ["public", "static", "dist", "apps/web/public", "site/public", "."];
  for (const d of dossiers) {
    const chemin = join(process.cwd(), d);
    if (!existsSync(chemin)) continue;
    const f = readdirSync(chemin).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
    if (f) return f.replace(".txt", "");
  }
  throw new Error(
    `Clé IndexNow introuvable. Cherchée dans : ${dossiers.join(", ")} (depuis ${process.cwd()}).`,
  );
}

async function adressesDuPlan() {
  const reponse = await fetch(`${SITE}/sitemap.xml`);
  if (!reponse.ok) throw new Error(`Plan du site illisible : HTTP ${reponse.status}`);
  const xml = await reponse.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// On accepte les chemins (« /guides ») comme les adresses complètes : certains
// shells, Git Bash notamment, transforment un argument commençant par « / » en
// chemin Windows avant que Node ne le voie.
const premierHttp = args.findIndex((a) => a.startsWith("http"));
const pages = args.filter(
  (a, i) => (a.startsWith("/") || a.startsWith("http")) && i !== premierHttp,
);
const urlList = pages.length
  ? pages.map((p) => (p.startsWith("http") ? p : SITE + p))
  : await adressesDuPlan();

if (urlList.length === 0) {
  console.error("Aucune adresse à soumettre.");
  process.exit(1);
}

const k = cle();
const reponse = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOTE, key: k, keyLocation: `${SITE}/${k}.txt`, urlList }),
});

// 200 et 202 valent tous deux acceptation ; 403 signale une clé non trouvée.
if (reponse.ok) {
  console.log(`✓ ${urlList.length} adresse(s) soumise(s) à IndexNow (HTTP ${reponse.status}).`);
  for (const u of urlList) console.log("  " + u);
} else {
  console.error(`✗ IndexNow a répondu HTTP ${reponse.status} : ${await reponse.text()}`);
  process.exit(1);
}
