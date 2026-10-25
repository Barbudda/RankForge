---
name: immersive-landing-page
description: Créer une landing page premium niveau Awwwards — hero mémorable, storytelling, sections cinématiques, animations au scroll, micro-interactions, responsive et performante.
---

# Skill — immersive-landing-page

## Objectif
Construire une landing page premium : impact immédiat (hero), narration qui déroule, sections
rythmées, motion soigné, parfaitement responsive et rapide.

## Cas d'usage
Lancement de produit, site de marque/luxe, portfolio, page d'agence, teaser.

## Stack recommandée
Next.js · React · TypeScript · Tailwind · GSAP + ScrollTrigger · Framer Motion · Lenis.
(next/image + sharp pour les médias.)

## Entrées attendues
- Intention/positionnement (1 phrase), public, ton (luxe, tech, brut…).
- Contenu : titres, sections, visuels/3D dispo.
- Contraintes : marque, perf cible, accessibilité.

## Sortie attendue
- Structure de page (sections ordonnées) + composants React/Tailwind.
- Plan de motion (ce qui s'anime, quand, quel easing).
- Hero distinctif + au moins 3 sections cinématiques + footer soigné.
- Responsive desktop/tablette/mobile + respect `prefers-reduced-motion`.

## Prompt d'utilisation
> « Crée une landing page premium pour [produit/marque]. Ton : [ton]. Propose d'abord la
> structure des sections et le concept du hero, puis implémente en Next.js + Tailwind avec
> Lenis + GSAP ScrollTrigger pour les reveals et Framer Motion pour les micro-interactions.
> Vise un niveau Awwwards, respecte la perf (LCP<2.5s) et reduced-motion. »

## Checklist qualité
Voir `docs/CREATIVE_WEB_CHECKLIST.md` — surtout : hiérarchie hero, rythme des sections,
easing naturel, LCP/CLS, fallback reduced-motion.

## Exemple (squelette)
```tsx
// Lenis smooth scroll + reveal GSAP
useEffect(() => {
  const lenis = new Lenis({ lerp: 0.1 });
  const raf = (t:number)=>{ lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el =>
    gsap.from(el, { y: 40, opacity: 0, duration: .8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 80%" } }));
  return () => lenis.destroy();
}, []);
```
