---
name: awwwards-redesign
description: Transformer une page existante en version beaucoup plus premium — hiérarchie, contrastes, typographie, motion, layout, images, 3D, transitions.
---

# Skill — awwwards-redesign

## Objectif
Élever une page « correcte » au niveau primé : impact, raffinement, mémorabilité.

## Cas d'usage
Page fade, SaaS générique, ancien site à moderniser.

## Stack / outils
Playwright (capturer l'existant), puis Next/Tailwind/GSAP/Framer/Three selon ambition.

## Entrées attendues
- URL/section actuelle + objectif (impressionner ? convertir ? les deux ?).

## Sortie attendue
- **Audit** : 5–8 faiblesses précises (hiérarchie, type, espace, motion, profondeur…).
- **3 directions** créatives distinctes (1 phrase + parti-pris chacune).
- Refonte de la direction choisie : layout, type, motion, profondeur (3D/images), transitions.
- Avant/après en captures.

## Prompt d'utilisation
> « Audite [page] et propose un redesign niveau Awwwards. D'abord 5–8 faiblesses, puis 3
> directions créatives, puis implémente la meilleure : hiérarchie forte, type expressive,
> motion premium, profondeur. Montre avant/après (Playwright). »

## Checklist qualité
Voir `docs/CREATIVE_WEB_CHECKLIST.md`. Surtout : un point focal par écran, contraste/rythme,
motion utile, perf maintenue, mobile soigné.

## Garde-fou
Ambition **oui**, mais ne pas casser la conversion/lisibilité : le beau sert le message.
