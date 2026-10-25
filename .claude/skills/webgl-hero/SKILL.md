---
name: webgl-hero
description: Créer un hero WebGL spectaculaire — particules, displacement, image distortion, shaders, fluid motion, hover effects, transitions premium.
---

# Skill — webgl-hero

## Objectif
Un hero WebGL qui fait « wow » dès la première seconde, sans sacrifier la perf ni la lisibilité.

## Cas d'usage
Hero de marque/luxe, page d'agence créative, intro de portfolio, teaser produit.

## Stack recommandée
Three.js (ou OGL pour léger) · shaders GLSL · R3F si intégré React · Lenis pour coupler au scroll.

## Entrées attendues
- Effet visé (particules, distortion d'image, displacement, fluide, noise) + visuel source.
- Texte/CTA du hero (doit rester lisible **au-dessus** de l'effet).

## Sortie attendue
- Plan WebGL (mesh plein écran + shader) + uniforms (temps, souris, progress).
- Texte/CTA en surcouche DOM lisible, accessible.
- Hover/mouse réactif ; transition d'entrée premium ; **fallback** (image/gradient animé CSS).

## Prompt d'utilisation
> « Crée un hero WebGL avec [effet : distortion d'image au hover / particules / displacement].
> Texte et CTA en surcouche DOM lisibles. Uniforms : uTime, uMouse. Ajoute une transition
> d'entrée et un fallback non-WebGL. Optimise (1 draw call si possible). Context7 pour les shaders. »

## Checklist qualité
Lisibilité du texte garantie · 60fps · `uMouse` lissé (lerp) · fallback sans WebGL ·
`prefers-reduced-motion` → version calme · pas de layout shift au montage du canvas.

## Exemple (fragment GLSL — distortion au hover)
```glsl
uniform sampler2D uTex; uniform vec2 uMouse; uniform float uHover; varying vec2 vUv;
void main(){
  float d = distance(vUv, uMouse);
  vec2 uv = vUv + normalize(vUv - uMouse) * (uHover * 0.05 / (d + 0.1));
  gl_FragColor = texture2D(uTex, uv);
}
```
