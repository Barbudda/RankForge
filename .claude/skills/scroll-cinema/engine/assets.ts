/**
 * <name>-assets.ts — La timeline du site scroll-cinéma.
 * ----------------------------------------------------
 * Renomme ce fichier en lib/<name>-assets.ts et remplis les slots au fur et à
 * mesure que tu génères les clips (recettes dans recipes.md).
 *
 * RÈGLE DU BUILD VERT : tout segment dont l'url résolue est vide ("") est IGNORÉ
 * par le moteur. On peut donc compiler et déployer dès maintenant, avant le
 * moindre asset — la scène retombe sur le `poster`. On remplit clip par clip.
 *
 * Un clip INVERSÉ (reverse:true) est GRATUIT : il rejoue les frames d'un clip
 * déjà capturé à l'envers. Idéal pour réassemblage et dézoom — ne génère rien.
 */

import type { Segment } from "@/components/<name>/frame-stage";

/** Still de secours (poster) — affiché tant qu'aucune frame n'est prête. */
export const POSTER = ""; // ex: "/assets/<name>/hero.webp"

/**
 * La timeline. L'ordre = l'ordre de scroll. `span` pondère la part de scroll
 * allouée à chaque segment (défaut 1). Desktop prend url4K, mobile prend url.
 */
export const TIMELINE: Segment[] = [
  // 1) Transformation — héros → état final (déconstruction / ouverture / arrivée).
  { url: "", url4K: "", span: 2 },

  // 2) Mouvement caméra — orbite ou push-in autour du produit (frame de départ seule).
  { url: "", url4K: "", span: 2 },

  // 3) Macro / détail — push dans un détail.
  { url: "", url4K: "", span: 1 },

  // 4) Dézoom GRATUIT — rejoue le clip macro à l'envers (réutilise la même url).
  { url: "", url4K: "", reverse: true, span: 1 },

  // 5) Réassemblage GRATUIT — rejoue la transformation à l'envers (même url que 1).
  { url: "", url4K: "", reverse: true, span: 2 },
];
