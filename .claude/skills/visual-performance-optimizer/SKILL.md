---
name: visual-performance-optimizer
description: Optimiser LCP/CLS/INP, images, lazy loading, vidéos, textures, GLTF, shaders, bundle size et fluidité mobile — sans sacrifier la beauté.
---

# Skill — visual-performance-optimizer

## Objectif
Rendre un site beau **et** rapide. Atteindre les Core Web Vitals tout en gardant l'effet wow.

## Cas d'usage
Site lourd (3D/vidéo/anim), mauvais Lighthouse, mobile qui rame.

## Stack / outils
Lighthouse, Playwright (throttling), bundle analyzer, sharp/ffmpeg, Draco/meshopt/KTX2.

## Entrées attendues
- URL + budget perf (LCP/CLS/INP cibles), device cible.

## Sortie attendue
- Diagnostic chiffré (avant) → actions priorisées → résultat (après).
- Images en AVIF/WebP + dimensions/`sizes` ; lazy ; `next/image`.
- 3D : GLB compressé, textures KTX2, scène allégée mobile.
- JS : code-split, dynamic import des libs lourdes (Three, GSAP), supprimer le mort.

## Prompt d'utilisation
> « Optimise la perf de [page] sans casser le visuel. Mesure LCP/CLS/INP, puis applique :
> images AVIF + sizes + lazy, compression GLB/textures, code-split des libs 3D/anim,
> réservation d'espace (anti-CLS). Donne l'avant/après chiffré. »

## Checklist qualité
LCP<2.5s · CLS<0.1 · INP<200ms · images optimisées · libs lourdes en lazy · scène 3D mobile OK ·
pas de régression visuelle (comparer screenshots).

## Exemple
```tsx
const Scene = dynamic(() => import("./Scene"), { ssr:false, loading:()=> <HeroPoster /> });
<Image src={hero} alt="" priority sizes="100vw" /> // LCP maîtrisé
```
