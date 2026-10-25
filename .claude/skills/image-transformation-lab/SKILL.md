---
name: image-transformation-lab
description: Effets avancés sur images — morphing, distortion, displacement maps, hover reveal, avant/après, carousel immersif, masque animé, transitions cinématiques.
---

# Skill — image-transformation-lab

## Objectif
Donner vie aux images : effets premium qui subliment sans alourdir.

## Cas d'usage
Galeries, portfolios, pages produit, sections éditoriales, transitions entre visuels.

## Stack recommandée
WebGL (Three/OGL) pour distortion/displacement · CSS/Canvas pour le léger · Framer Motion
pour reveals/masques · GSAP pour les séquences. clip-path pour avant/après & masques.

## Entrées attendues
- Effet visé + images source (haute qualité, déjà optimisées).
- Contexte (grille, slider, hover, scroll).

## Sortie attendue
- Composant réutilisable de l'effet (props : image(s), intensité, trigger).
- Versions : hover-reveal, avant/après (slider clip-path), displacement WebGL, masque animé.
- Dégradation propre (image simple si WebGL indispo / reduced-motion).

## Prompt d'utilisation
> « Crée un composant [effet : avant-après / displacement au hover / masque révélé au scroll]
> réutilisable. Images optimisées (AVIF/WebP). Fallback statique + reduced-motion. Si WebGL,
> 1 shader simple et propre. »

## Checklist qualité
Images optimisées (poids, dimensions) · effet cohérent avec la DA · fallback statique ·
pas de CLS · perf mobile · accessibilité (alt, pas d'info portée uniquement par l'effet).

## Exemple (avant/après en clip-path)
```tsx
<div className="relative" onPointerMove={e=>setX(pct(e))}>
  <img src={after} className="block w-full" alt="après" />
  <img src={before} alt="avant" className="absolute inset-0 w-full"
       style={{ clipPath:`inset(0 ${100-x}% 0 0)` }} />
  <span className="absolute top-0 bottom-0" style={{ left:`${x}%` }} />
</div>
```
