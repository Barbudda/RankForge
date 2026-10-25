---
name: scroll-cinema
description: Construire un site scroll-cinéma premium (façon EMBER/OSCILLA/VANTA/RIFT/MERIDIAN de Jonah) — un seul objet/scène héros verrouillé image-par-image au scroll. Clip rendu une fois, décodé en séquence d'images, peint par un canvas en lock-step avec la scrollbar. PAS une vidéo sur minuteur, PAS du CSS qui bouge des PNG.
---

# Skill — scroll-cinema

> Implémentation de la **Web Strategy de Jonah (Edition 1.0)** : les single-clip,
> scroll-scrubbed product films. Le moteur est fourni (`engine/`), prêt à copier.
> La stratégie en une ligne : **choisir un objet héros, rendre un clip de lui faisant
> une seule belle chose, et laisser le scroll le piloter.**

## Objectif
Un seul produit / une seule scène qui ne quitte jamais l'écran. En scrollant, il bouge —
se déconstruit, se réassemble, orbite, zoome, décolle, atterrit — verrouillé frame-for-frame
à la scrollbar. Scroll vers le bas → il avance ; scroll vers le haut → il rembobine. Le copy
éditorial flotte par-dessus. **La page EST la caméra.** Ça se lit comme cher, et ça vend
parce que *le scroll DEVIENT le contenu* : le mouvement est la révélation produit.

## Cas d'usage
Lancement produit, marque de luxe, hypercar, montre, sneaker hype, charter de jet, boisson —
tout objet dont une seule belle action filmée raconte le désir.

## Le modèle mental (à comprendre, sinon les prompts d'assets se battent contre le moteur)
1. Un clip court est **joué une fois, invisible**. Chaque frame est capturée
   (`requestVideoFrameCallback` → blob WebP → `Image`) et stockée. Le scroll peint ensuite
   la bonne frame sur un canvas plein écran. **Sans décodage à l'exécution, fluide au refresh-rate.**
2. Les frames **persistent** dans le navigateur (IndexedDB) → 2ᵉ visite instantanée.
3. La **timeline = liste de segments** `{ url, url4K, reverse, span }`. La progression scroll
   0→1 est répartie sur les segments selon le **poids `span`** de chacun.
4. Un clip **inversé est GRATUIT** : il rejoue les frames d'un clip existant à l'envers.
   À utiliser pour les réassemblages et les dézooms, sans rien générer.
5. **Desktop scrube un master 4K** ; le **mobile scrube une source 1080p** (sinon il manque
   de mémoire à décoder du 4K).

### La règle unique qui rend tout fluide
**Ne JAMAIS scruber avec `video.currentTime`** — c'est decode-bound, ça vire au diaporama.
**Toujours capturer les frames d'abord, puis peindre.** Si un build ressemble à un diaporama,
cette règle a été violée.

## Le moteur (déjà écrit — `engine/`)
Tu ne dois PAS réécrire le moteur, juste le copier et le câbler.
- `engine/frame-stage.tsx` — le moteur de capture/peinture (canvas plein écran, IndexedDB,
  4K desktop / 1080p mobile, capture rVFC, segments + reverse). **Générique, renomme par site.**
- `engine/assets.ts` — la timeline : slots d'URL **VIDES** au départ (un slot vide est sauté →
  build vert à chaque étape). On remplit clip par clip.
- `engine/recipes.md` — les recettes Higgsfield exactes (Nano Banana / Kling 3.0 / Topaz),
  les prompts de clips réutilisables, le prompt de kickoff, et les fixes durement gagnés.

### Le pattern « ajouter un site » (3 fichiers bougent, rien d'autre)
Sur un repo type Next.js multi-sites (app router + middleware) :
- `app/<name>/page.tsx` — la page (moteur + sections).
- `middleware.ts` — **une ligne** dans `SUBDOMAIN_ROUTES` : `'<sub>': '/<name>'`.
- `components/app-wrapper.tsx` — **une ligne** dans l'allowlist pour qu'il tourne nu
  (sans navbar/loader marketing).
Chaque site a **sa propre copie** du moteur (`components/<name>/frame-stage.tsx` +
`lib/<name>-assets.ts`) pour que les sites n'interfèrent jamais. Copie **RIFT** (le plus complet)
si le repo de référence existe ; sinon copie `engine/` de ce skill.

## Ce qu'il faut AVANT de prompter
- Claude Code sur le repo (il lit `CLAUDE.md` et copie le site fini le plus proche).
- Un compte de génération (Higgsfield : Nano Banana, Kling 3.0, Topaz) — **c'est TOI qui génères**
  les images/vidéos (le widget d'approbation des outils de génération, Claude ne peut pas le déclencher).
- Une branche de travail (Claude commit + push dessus, ne crée PAS de nouvelle branche).
- Un concept + un nom (un seul objet/scène héros). Claude propose nom/route/couleur ; tu veto.

## La boucle (exactement celle qui a construit MERIDIAN)
1. **Kickoff** : colle le prompt de kickoff (`engine/recipes.md` → section KICKOFF).
2. **Verrouille le brief** : Claude propose nom de marque, `/route`, clé de sous-domaine,
   couleur d'accent, police → tu approuves/veto.
3. **Scaffold avec slots vides** : `components/<name>/`, `lib/<name>-assets.ts` (URLs `""`),
   la page, les 2 éditions d'une ligne. Slots vides = sautés → build vert à chaque étape.
4. **Génère les assets depuis les recettes de Claude** : Claude donne les recettes Higgsfield
   exactes. Tu génères. Claude **récupère tes keepers, upscale (Topaz 4K), et câble**.
5. **Clip par clip, chaîné** : chaque clip démarre sur la **dernière frame du précédent** →
   pas de coupe. Tu envoies chaque keeper ; Claude upscale + câble + donne la recette suivante.
   Quand un truc cloche (« l'avion apparaît de nulle part »), dis-le ; Claude réécrit le prompt.
6. **Build + push après chaque changement** : `npm run build` doit passer, puis commit + push.
   Le site est présentable à chaque étape (les assets manquants retombent sur des stills).
7. **Pass mobile, puis polish** : sources 1080p, type responsive, drawer nav ; puis copy,
   couleurs, fonds de sections.

## Les 5 assets source par site (le reste est dérivé ou gratuit)
| Asset | Modèle + réglages clés |
|---|---|
| **Still héros** | Nano Banana, 16:9, Count 4, Enhance **OFF**. Produit petit, centré, gros négatif, studio sombre. |
| **2ᵉ still** | Nano Banana, ref = héros. L'**état final** (explosé / arrivé). Même caméra + lumière. |
| **Clip transformation** | Kling 3.0, start = héros, end = 2ᵉ still, 5s, Enhance OFF, Audio OFF, 1080p. |
| **Clip mouvement caméra** | Kling 3.0, **frame de départ SEULE** (pas de end). Orbite ou push-in. Un seul mouvement. |
| **Clip macro / détail** | Kling 3.0, start unique = héros, push dans un détail. **Inverse-le gratuitement** pour le dézoom. |
Générer en 1080p d'abord (pas cher). Upscaler seulement les keepers en 4K (Topaz). Les reverse coûtent 0.

### Principes de prompt non-négociables (assets)
- **Enhance OFF, toujours** — ça ajoute drift, zoom et nouvelles lumières (la cause n°1 des « pourquoi ça a fait ça »).
- **Négatif généreux** dans les stills → le mouvement ne sort jamais du cadre.
- **Verrouiller caméra + lumière en mots** : « zero camera movement », « lighting stays exactly the same, no new lights ».
- **DEUX frames** pour une transformation ; **UNE frame** pour un mouvement caméra (même image en start ET end fait caler Kling).
- **Un seul mouvement par clip.** Pour les produits : « rigid, undistorted, holds its exact shape, no warping ».
- **Chaîner** : start de chaque clip = dernière frame du clip précédent.
- **Négatifs à chaque fois** : no text, no logos, no people, no hands, no warping.

## Prompt d'utilisation (pour lancer ce skill)
> « Construis un site scroll-cinéma pour [objet/scène héros]. Lis `engine/recipes.md`, pars de
> `engine/sequence.ts` (moteur éprouvé en production, à préférer à `frame-stage.tsx`) en le
> renommant pour ce site, scaffold la page avec des slots
> d'assets VIDES (build vert), propose nom/route/couleur d'accent/police (je veto), puis donne-moi
> les recettes Higgsfield exactes. Je génère, tu upscales et câbles, clip par clip chaîné. Mobile
> 1080p + reduced-motion. Respecte LA règle : capturer les frames, jamais scruber `currentTime`. »

## Deux moteurs dans `engine/`
`sequence.ts` est le moteur à utiliser : capture, encodage JPEG en file séquentielle, cache
IndexedDB, décodage paresseux à fenêtre glissante, aucun rendu React par image. Il a tourné en
production sur un vrai site (Portfolio Hugo, octobre 2026) et son en-tête cite les mesures.
`frame-stage.tsx` est le composant de référence d'origine : il montre le câblage au scroll, mais
il encode en WebP et décode toutes les images d'un coup, deux défauts corrigés dans `sequence.ts`.

## Checklist qualité
Frames capturées (jamais de scrub `currentTime`) · canvas dimensionné depuis `videoWidth`
(sinon flou en 300×150) · desktop 4K / mobile 1080p · pas d'objet qui « pop » (lui donner un
hors-champ d'où venir + négatifs `no fading in, no materializing, no teleporting`) · pas de trou
entre clips (reverse gratuit ou 1 clip bridge) · accent échantillonné sur la lumière clé du
footage · centre lumineux, bords assombris pour nav/texte · `prefers-reduced-motion` → version
séquentielle/still · encodage JPEG et non WebP · images décodées à la demande, jamais toutes ·
affiche prise sur l'image zéro · aucune image interpolée par `minterpolate` ·
`npm run build` vert avant chaque push.

## Fixes durement gagnés → voir `engine/recipes.md` (section FIXES)
« blurry » (canvas non dimensionné), « diaporama » (scrub currentTime), « crash mobile » (4K sur
mobile), « l'objet pop » (clip 2-frames sans point de départ), « trou entre 2 clips » (reverse ou
bridge), « Enhance change mon plan » (Enhance OFF).

Ajouts mesurés sur Portfolio Hugo, octobre 2026. Le détail est dans `docs/RETOURS.md` de BONDS.

| Symptôme | Cause | Correction |
|---|---|---|
| Préparation interminable au chargement | encodage WebP, 108 ms par image en 1440x810 | encoder en JPEG, 18 ms par image (R7) |
| Onglet qui sature ou se fait tuer | toutes les images gardées en `ImageBitmap`, plus de 400 Mo pour 263 images | garder les blobs, décoder une fenêtre glissante, 5 Mo (R8) |
| Séquence qui se mélange | `convertToBlob` empilés sans ordonnancement | file d'encodage séquentielle, chaque image posée à son index |
| Image floue et dédoublée à l'ouverture | affiche prise ailleurs qu'à l'image zéro | affiche = image zéro (R10) |
| Sujet fantôme au début du plan | `minterpolate` de ffmpeg sur un plan à forte parallaxe | garder les images réelles, adapter la course (R11) |
| Capture deux fois trop longue | clip lu en temps réel alors qu'il est hors écran | `video.playbackRate = 2` ou `3` (R9) |
