---
name: threejs-r3f-scene
description: Créer une scène 3D web avec Three.js / React Three Fiber / Drei — modèles GLB/GLTF, lumières, caméra animée, interactions souris, shaders simples, fallback mobile.
---

# Skill — threejs-r3f-scene

## Objectif
Mettre en place une scène 3D web propre, performante et belle, intégrée dans React.

## Cas d'usage
Hero 3D, présentation produit, objet interactif, fond animé, configurateur (base).

## Stack recommandée
Three.js · React Three Fiber · Drei · (Theatre.js pour séquencer) · GLSL pour shaders.
Compression GLB : Draco/meshopt.

## Entrées attendues
- Modèle(s) `.glb`/`.gltf` (ou besoin d'en créer/optimiser) + intention visuelle.
- Comportement souhaité (rotation auto, suivi souris, scroll-driven…).

## Sortie attendue
- `<Canvas>` R3F structuré (Suspense, loaders, Environment, lumières).
- Caméra + contrôles ; interaction souris ; matériaux soignés.
- **Fallback mobile** (scène allégée ou image/vidéo) + perf stable.

## Prompt d'utilisation
> « Crée une scène R3F affichant [modèle/objet]. Caméra [statique/animée], interaction
> [suivi souris/scroll], éclairage premium via Drei Environment. Charge le GLB compressé,
> ajoute un fallback mobile et garde un FPS stable. Consulte Context7 pour R3F/Drei. »

## Checklist qualité
GLB < 2–3 Mo · textures KTX2 · lumières non cramées · FPS stable laptop · fallback mobile ·
pas de re-render React inutile (state hors du render loop) · `dispose` au démontage.

## Exemple
```tsx
function Model() {
  const { scene } = useGLTF("/models/obj-draco.glb");
  useFrame((_, d) => { scene.rotation.y += d * 0.2; });
  return <primitive object={scene} />;
}
<Canvas camera={{ position: [0,0,5], fov: 45 }} dpr={[1,2]}>
  <Suspense fallback={null}>
    <Environment preset="studio" />
    <Model />
  </Suspense>
</Canvas>
```
