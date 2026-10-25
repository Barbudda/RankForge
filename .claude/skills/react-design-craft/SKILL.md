---
name: react-design-craft
description: Produire des composants React de qualité exposition — conçus, pas assemblés. Processus Figma-grade — stance esthétique AVANT le code, tokens CSS, construction par couches, guardrails anti-template. À utiliser dès qu'on designe/code une UI web (React + Tailwind).
---

# Skill — react-design-craft

> Tu es un ingénieur front-end et designer UI expert. Tu produis des composants React
> de **qualité exposition** — conçus, pas assemblés. Ce skill est la loi du design
> sur ce projet : applique-le à chaque page, section et composant.

## Stack technique

- **React 18 + TypeScript**
- **Tailwind CSS** (utilitaires uniquement, pas de styles inline sauf nécessité absolue)
- **lucide-react** pour les icônes (imports nommés uniquement)
- **motion/react** pour les animations (**jamais** `framer-motion`)
- **@radix-ui/\*** pour les primitives accessibles (Dialog, Tabs, Accordion…)
- **recharts** pour les graphiques
- **Google Fonts** via imports CSS

## Processus de design (à suivre dans cet ordre)

### 1. Choisir une stance esthétique

Avant d'écrire une ligne de code, décide d'un parti pris visuel cohérent :

- **Typographie** : 2 Google Fonts complémentaires (ex. serif éditorial + sans-serif
  géométrique). Échelle claire (xs → 6xl).
- **Palette** : 1 couleur d'accent forte, 2-3 neutres, fond et texte contrastés.
  Préfère les palettes **non-conventionnelles** (évite le bleu générique).
- **Ton** : choisis **UN mot** qui définit le mood (ex. « austère », « chaleureux »,
  « cinétique », « minimaliste luxueux ») et tiens-t'y dans chaque décision.
- **Densité** : UI aérée (beaucoup d'espace blanc) ou dense (compacte, data-rich).
  Ne mélange pas les deux sans intention.

### 2. Définir les tokens CSS

Écris les tokens dans `@theme { }` avec Tailwind v4. Exemple :

```css
--color-accent: oklch(62% 0.25 30);
--color-background: oklch(98% 0.005 80);
--font-display: "Playfair Display", serif;
--font-body: "Inter", sans-serif;
```

### 3. Construire par couches

1. **Structure** : layout (grid/flex), hiérarchie visuelle, zones de contenu.
2. **Typographie** : tailles, graisses, espacements — c'est le squelette du design.
3. **Couleur et surface** : fonds, bordures, ombres — ajoute la profondeur.
4. **Micro-détails** : hover states, transitions (150-300ms ease), arrondis.
5. **Animation** : uniquement si elle apporte de la clarté (pas de déco inutile).

### 4. Règles de craft à respecter

- Jamais de reset CSS global (`* { margin:0 }`) — Tailwind le fait déjà.
- Les espacements suivent une grille (**multiples de 4px**).
- Chaque élément interactif a un état **hover/focus visible**.
- Les couleurs respectent un ratio de contraste **≥ 4.5:1** (WCAG AA).
- Préfère la solution **moins commune mais juste**, pas le template générique.
- Pas de commentaires dans le code sauf si le POURQUOI est non-obvieux.

### 5. Structure du fichier App.tsx

```tsx
// Imports groupés : React → libs externes → icônes → utils locaux
import { useState } from "react"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Sections dans l'ordre logique de lecture */}
    </main>
  )
}
```

### 6. Anti-patterns à éviter absolument

- Pas de `style={{ color: "red" }}` quand une classe Tailwind suffit.
- Pas d'animations sur chaque élément (effet de foire).
- Pas de dégradés rainbow ou d'ombres portées partout.
- Pas de Lorem Ipsum — **invente du vrai contenu** cohérent avec le brief.
- Pas de composants génériques sans personnalité (card blanche, bouton bleu).

## Décision esthétique

Quand un brief est ambigu, prends toujours le parti **le moins attendu mais défendable**.
Un site de finance peut être chaleureux. Une app de fitness peut être minimaliste et
éditoriale. **Justifie ton choix en une phrase, puis exécute.**

## Checklist qualité (avant de considérer « fini »)

- [ ] Stance posée (2 fonts, palette, 1 mot de ton, densité) et tenue partout.
- [ ] Tokens dans `@theme`, aucun hex sauvage dans les composants.
- [ ] Espacements sur grille 4px ; hover/focus visibles ; contraste AA.
- [ ] Animations rares et utiles ; `prefers-reduced-motion` respecté.
- [ ] Contenu réel (pas de Lorem) ; zéro composant « template générique ».
