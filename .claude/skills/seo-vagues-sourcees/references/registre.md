# Registre des pages et ses tests

Une page n'existe pour le SEO que si elle est dans le registre. Le registre alimente métadonnées,
hreflang, fil d'Ariane, hubs, pied de page, pages liées, sitemap, RSS, llms.txt et images de
partage. Chaque `page.tsx` appelle `page(PATH)` : un chemin absent fait échouer le build (lien mort
évité). Les agents de rédaction n'écrivent **jamais** dans le registre : ils rendent leurs entrées
dans leur rapport et c'est la session principale qui les colle, pour éviter les conflits.

## Type d'une entrée (extrait de RushPilot `content/pages.ts`)

```ts
export type PageEntry = {
  path: string;
  section: Section;
  kind: PageKind;
  /** Balise <title>, 60 caractères environ. */
  title: string;
  h1: string;
  /** Meta description, 140 à 160 caractères. */
  description: string;
  /** Libellé court pour les menus, les cartes et le fil d'Ariane. */
  label: string;
  /** Une phrase pour les cartes des hubs. */
  summary: string;
  /** Requête principale visée. */
  query: string;
  published: string;
  updated: string;
  /** Chemins des pages à proposer en fin de page, dans l'ordre. */
  related: string[];
  /** Page parente dans le fil d'Ariane, quand ce n'est pas le hub de la rubrique (ex. /rejections). */
  parent?: string;
  topic?: Topic;
  /** Langue de la page (anglais par défaut). */
  locale?: Locale;
  /** Page équivalente dans l'autre langue (hreflang). */
  alternate?: string;
};
```

## Fonctions d'accès

```ts
const BY_PATH = new Map([...PAGES, ...PAGES_FR].map((p) => [p.path, p]));

/** Équivalent d'une page dans l'autre langue, dans les deux sens. */
export function alternateOf(path: string): string | undefined {
  const own = BY_PATH.get(path)?.alternate;
  if (own) return own;
  return PAGES_FR.find((p) => p.alternate === path)?.path;
}

/** Page du registre ; lève une erreur au build si le chemin est inconnu (lien mort évité). */
export function page(path: string): PageEntry {
  const entry = BY_PATH.get(path);
  if (!entry) throw new Error(`Page absente du registre : ${path}`);
  return entry;
}

export function pagesIn(section: Section, kind?: PageKind): PageEntry[] {
  return PAGES.filter((p) => p.section === section && (!kind || p.kind === kind));
}

/** Pages éditoriales (référence et guides) pour le flux RSS et llms.txt. */
export const ARTICLES = PAGES.filter((p) => p.kind === "reference" || (p.kind === "guide" && p.section !== "company"));
```

## Tests du registre (`tests/registry.test.ts`, `node --test`)

Ils ont attrapé en vrai : des titres de plus de 50 caractères (le gabarit ajoute « · Marque »),
un hreflang à sens unique, des pages liées dans l'autre langue, des entrées oubliées.

```ts
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PAGES, PAGES_FR, alternateOf } from "../content/pages";

// Garde-fous SEO du registre : une erreur ici produirait un lien mort, un hreflang cassé ou un
// titre tronqué dans les résultats de recherche.

const ALL = [...PAGES, ...PAGES_FR];
const paths = new Set(ALL.map((p) => p.path));

/** Fichier de la page dans le groupe de routes de sa langue. */
const pageFile = (path: string, fr: boolean) => join(process.cwd(), "app", fr ? "(fr)" : "(site)", path, "page.tsx");

describe("registre des pages", () => {
  it("n'a pas deux entrées pour le même chemin", () => {
    assert.equal(paths.size, ALL.length);
  });

  it("a un fichier page.tsx pour chaque entrée", () => {
    const missing = ALL.filter((p) => !existsSync(pageFile(p.path, p.locale === "fr"))).map((p) => p.path);
    assert.deepEqual(missing, []);
  });

  it("ne propose que des pages liées qui existent, dans la même langue", () => {
    for (const p of ALL) {
      for (const r of p.related) {
        assert.ok(paths.has(r), `${p.path} : page liée inconnue ${r}`);
        assert.equal(r.startsWith("/fr"), p.locale === "fr", `${p.path} : page liée dans l'autre langue ${r}`);
      }
      if (p.parent) assert.ok(paths.has(p.parent), `${p.path} : parent inconnu ${p.parent}`);
    }
  });

  it("relie chaque page française à une page anglaise existante, et réciproquement", () => {
    for (const p of PAGES_FR) {
      assert.equal(p.locale, "fr", `${p.path} : locale manquante`);
      assert.ok(p.path.startsWith("/fr/"), `${p.path} : chemin hors de /fr`);
      if (!p.alternate) continue;
      assert.ok(PAGES.some((e) => e.path === p.alternate), `${p.path} : alternate inconnu ${p.alternate}`);
      assert.equal(alternateOf(p.alternate), p.path, `${p.alternate} ne renvoie pas vers ${p.path}`);
    }
  });

  it("garde des titres et des descriptions à la bonne longueur", () => {
    for (const p of ALL) {
      // Titre sans la marque : le gabarit ajoute « · RushPilot » (12 caractères).
      assert.ok(p.title.length <= 50, `${p.path} : titre de ${p.title.length} caractères`);
      assert.ok(
        p.description.length >= 120 && p.description.length <= 160,
        `${p.path} : description de ${p.description.length} caractères`,
      );
    }
  });

  it("n'utilise pas de tiret cadratin dans les textes affichés", () => {
    for (const p of ALL) {
      for (const text of [p.title, p.h1, p.description, p.label, p.summary]) {
        assert.ok(!text.includes("—"), `${p.path} : tiret cadratin dans « ${text} »`);
      }
    }
  });
});
```
