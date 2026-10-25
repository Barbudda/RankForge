---
name: scroll-storytelling
description: Créer une expérience scroll-telling premium — GSAP ScrollTrigger, Lenis, parallaxe, timeline, textes animés, images synchronisées, scènes progressives.
---

# Skill — scroll-storytelling

## Objectif
Raconter une histoire au défilement : chaque scroll révèle/transforme, de façon fluide et pilotée.

## Cas d'usage
Présentation produit étape par étape, récit de marque, étude de cas, page « process ».

## Stack recommandée
GSAP + ScrollTrigger · Lenis (smooth scroll) · Framer Motion (compléments) · éventuellement
pin de scènes 3D (Theatre.js / R3F).

## Entrées attendues
- Trame narrative (chapitres/étapes) + médias (images/vidéo/3D) par étape.
- Niveau d'agressivité scroll (pin fort vs léger).

## Sortie attendue
- Timeline ScrollTrigger par scène (pin, scrub, snap si utile).
- Parallaxe multi-couches ; textes animés synchronisés aux visuels.
- Progression lisible (indicateur) ; **reduced-motion** → version séquentielle simple.

## Prompt d'utilisation
> « Crée un scroll-telling en [N] chapitres pour [sujet]. Lenis + GSAP ScrollTrigger,
> pin des scènes avec scrub, parallaxe sur les visuels, textes qui apparaissent en stagger.
> Ajoute un indicateur de progression et un fallback reduced-motion. »

## Checklist qualité
Scrub fluide (pas saccadé) · pin sans saut de layout · scroll non frustrant (sortie possible) ·
mobile : alléger les pins · reduced-motion respecté · perf (pas de reflow par frame).

## Exemple
```ts
const tl = gsap.timeline({ scrollTrigger:{ trigger:".scene", start:"top top",
  end:"+=1500", scrub:1, pin:true }});
tl.from(".scene__title",{ y:60, opacity:0, ease:"power3.out" })
  .from(".scene__img",{ scale:1.15, ease:"none" }, 0);
```
