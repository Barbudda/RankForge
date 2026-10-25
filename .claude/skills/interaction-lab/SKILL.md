---
name: interaction-lab
description: Créer des interactions avancées — hover magnétique, curseur custom, menus animés, transitions de page, cards interactives, drag, carousel inertiel, boutons premium.
---

# Skill — interaction-lab

## Objectif
Des micro-interactions et interactions signature qui rendent le site vivant et premium.

## Cas d'usage
Donner du caractère : navigation, boutons, galeries, transitions entre pages.

## Stack recommandée
Framer Motion (gestures, layout, AnimatePresence) · GSAP (timelines précises) · Lenis ·
pointer events. Pour le drag/inertie : Framer `drag` ou GSAP Draggable/Inertia.

## Entrées attendues
- Interaction visée + contexte (desktop surtout ? tactile ?).

## Sortie attendue
- Composant réutilisable (curseur custom, bouton magnétique, carousel inertiel, transition de page…).
- Comportement tactile pensé (pas de hover-only) + fallback.
- `prefers-reduced-motion` respecté.

## Prompt d'utilisation
> « Crée [interaction : curseur custom / bouton magnétique / carousel inertiel / transition de
> page]. Composant réutilisable, fluide, accessible (clavier + tactile), reduced-motion géré.
> Framer Motion ou GSAP selon le besoin. »

## Checklist qualité
60fps · effet lissé (lerp) · pas hover-only (tactile OK) · clavier accessible · reduced-motion ·
ne gêne pas le clic/scroll · cohérent avec la DA.

## Exemple (bouton magnétique)
```tsx
function Magnetic({children}:{children:React.ReactNode}){
  const ref=useRef<HTMLDivElement>(null); const [p,setP]=useState({x:0,y:0});
  return <motion.div ref={ref} animate={p} transition={{type:"spring",stiffness:150,damping:15}}
    onPointerMove={e=>{const r=ref.current!.getBoundingClientRect();
      setP({x:(e.clientX-r.left-r.width/2)*.3, y:(e.clientY-r.top-r.height/2)*.3});}}
    onPointerLeave={()=>setP({x:0,y:0})}>{children}</motion.div>;
}
```
