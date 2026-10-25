---
name: motion-audit
description: Auditer les animations d'un site — fluidité, durée, easing, cohérence, lisibilité, utilité, performance, accessibilité, reduced-motion.
---

# Skill — motion-audit

## Objectif
Évaluer et corriger le motion design : qu'il serve l'expérience, reste fluide et accessible.

## Cas d'usage
Avant livraison, ou quand « ça bouge mais ça fait cheap / ça rame / ça gêne ».

## Stack / outils
Playwright (capturer/observer), DevTools Performance, lecture du code GSAP/Framer/CSS.

## Entrées attendues
- URL/section à auditer + intention (calme/énergique).

## Sortie attendue
- Tableau des animations : durée, easing, trigger, **verdict** (garder/ajuster/supprimer) + raison.
- Corrections concrètes (valeurs d'easing/durée, stagger, suppression du gratuit).
- Vérif `prefers-reduced-motion` + perf (jank, layout thrash).

## Prompt d'utilisation
> « Audite le motion de [page/section]. Liste chaque animation (durée, easing, déclencheur),
> juge son utilité et sa fluidité, propose des corrections précises. Vérifie reduced-motion
> et la perf (pas de reflow par frame). »

## Checklist qualité
Easing naturel (pas linear) · durées cohérentes · 0 animation gratuite gênante · 60fps ·
reduced-motion · pas d'anim sur propriétés coûteuses (préférer transform/opacity).

## Exemple de finding
> `hero__title` : 1200ms `ease-in-out` → trop lent + easing mou. → **Ajuster** à 700ms
> `cubic-bezier(.22,1,.36,1)`, ajouter `will-change:transform`, désactiver si reduced-motion.
