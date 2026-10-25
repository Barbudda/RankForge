---
name: luxury-design-system
description: Créer un design system premium — palette haut de gamme, typographies fortes, spacing cohérent, boutons/cards/modales/nav, états hover/focus, composants animés.
---

# Skill — luxury-design-system

## Objectif
Poser les fondations visuelles d'un site luxe : tokens cohérents et composants réutilisables
d'un niveau « maison de luxe ».

## Cas d'usage
Tout projet sérieux : on commence par le DS avant les pages.

## Stack recommandée
Tailwind (config tokens) · shadcn/ui (base à customiser) · Framer Motion (composants animés) ·
CSS variables pour le theming.

## Entrées attendues
- Univers de marque (mots-clés, références), contraintes (couleurs imposées ?).
- Cibles : light/dark ? densité ?

## Sortie attendue
- **Tokens** : couleurs (neutres riches + 1 accent), type scale modulaire, spacing, radius,
  ombres, durées/easings d'animation.
- **Composants** : Button (variants/états), Card, Modal, Nav/Menu, Input, Badge — avec
  hover/focus/active soignés et micro-animations.
- Doc d'usage courte + exemples.

## Prompt d'utilisation
> « Crée un design system premium pour [marque/univers]. Définis d'abord les tokens (palette
> luxe, type scale, spacing, radius, ombres, motion), configure Tailwind, puis génère
> Button/Card/Modal/Nav avec états et micro-animations Framer Motion. Dark mode inclus. »

## Checklist qualité
Palette limitée + accent fort · type scale cohérente · spacing scale (pas de px au hasard) ·
focus visible · contraste AA · motion tokens partagés · composants accessibles (clavier, ARIA).

## Exemple (tokens Tailwind)
```js
theme: { extend: {
  colors: { ink:"#0b0c10", paper:"#f6f5f1", accent:"#c8a96a" },
  borderRadius: { xl:"1rem", "2xl":"1.5rem" },
  transitionTimingFunction: { premium:"cubic-bezier(.22,1,.36,1)" },
}}
```
