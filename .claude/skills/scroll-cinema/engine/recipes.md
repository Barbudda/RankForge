# Recettes — scroll-cinema (Web Strategy de Jonah, Edition 1.0)

Tout ce qui se prompte : le kickoff, le pipeline d'assets, les prompts de clips
réutilisables, et les fixes durement gagnés. Les prompts d'assets sont **en anglais**
(les modèles Higgsfield/Kling y répondent mieux) ; le reste est expliqué en français.

---

## KICKOFF (copier dans Claude Code, remplir les 3 blancs)

```
I want to build another scroll-cinema site like the ones in this repo. First read CLAUDE.md.
Branch: work on <your-branch>. Do NOT create new branches; commit and push directly.
Do NOT touch or restructure existing routes.
Concept: <one hero object or scene, e.g. 'a private-jet charter, a night-to-day flight scrubbed by scroll'>.
Copy the closest finished site (RIFT is the most complete) — or copy engine/ from the scroll-cinema skill.
Propose a brand name, /route, subdomain key, accent color and font — let me veto.
Then scaffold: components/<name>/, lib/<name>-assets.ts with EMPTY url slots, app/<name>/page.tsx,
one line in middleware SUBDOMAIN_ROUTES, one line in the app-wrapper allowlist.
Build must stay green; commit + push after each step.
Then give me the exact Higgsfield recipes for the source assets.
I'll generate them; you pull, upscale to 4K, and wire them in.
```

Pourquoi chaque ligne :
- « Read CLAUDE.md » charge tout le playbook dans la tête de Claude.
- « Don't touch existing routes » protège les sites live.
- « EMPTY url slots » → ça compile avant le moindre asset.
- « You pull, upscale, wire » répartit le travail : **toi tu génères, Claude intègre.**

---

## PIPELINE — 5 assets source (le reste est dérivé ou gratuit)

| Asset | Modèle + réglages |
|---|---|
| Still héros | Nano Banana · 16:9 · Count 4 · **Enhance OFF** · produit petit, centré, gros négatif, studio sombre |
| 2ᵉ still | Nano Banana · ref = héros · l'état final (explosé/arrivé) · même caméra + lumière |
| Clip transformation | Kling 3.0 · start = héros, end = 2ᵉ still · 5s · Enhance OFF · Audio OFF · 1080p |
| Clip mouvement caméra | Kling 3.0 · frame de départ SEULE (pas de end) · orbite/push-in · un seul mouvement |
| Clip macro/détail | Kling 3.0 · start unique = héros · push dans un détail · **inverse-le gratuitement** pour le dézoom |

Génère en **1080p d'abord** (pas cher). Upscale seulement les **keepers en 4K** (Topaz).
Les **reverse coûtent 0**.

---

## PROMPTS DE CLIPS RÉUTILISABLES

### Transformation (deux frames)
```
Kling 3.0 — start = hero still, end = second still — 5s — Enhance OFF, Audio OFF, 1080p.
Prompt: The <product> smoothly <deconstructs / opens / takes apart> into its components
and they drift apart. Zero camera movement, lighting stays exactly the same.
Rigid, undistorted, holds its exact shape, no warping.
Negatives: no text, no logos, no people, no warping, no new lights.
```

### Mouvement caméra (une frame)
```
Kling 3.0 — single start = hero (NO end frame) — 5-10s — Enhance OFF, Audio OFF, 1080p.
Prompt: Smooth cinematic <360 orbit / slow push-in> around the <product>.
Slow, steady, locked radius. The object holds its exact rigid shape,
lighting stays consistent, no warping.
Negatives: no text, no logos, no people, no warping, no shake.
```

### Bridge (faire se rejoindre deux clips)
Si le clip A finit pivoté et le clip B démarre de face : screenshote la dernière frame de A,
uploade-la comme start de B, et mets le end de B = l'image de start du clip suivant. Les deux
frontières deviennent seamless.
```
Kling 3.0 — start = screenshot of previous clip's LAST frame, end = next clip's start image — 5s — Enhance OFF, Audio OFF.
Prompt: continue the motion from the start frame smoothly into the end frame,
one continuous camera move, rigid and undistorted.
```

### Principes non-négociables
- **Enhance OFF, toujours.** C'est la cause n°1 des dérives (zoom, drift, nouvelles lumières).
- Négatif généreux dans les stills (le mouvement ne clippe jamais le cadre).
- Verrouiller caméra + lumière **en mots**.
- DEUX frames pour une transformation, UNE frame pour un mouvement caméra.
- Un seul mouvement par clip. Produits : « rigid, undistorted, holds its exact shape, no warping ».
- Chaîner : start de chaque clip = dernière frame du précédent.
- Négatifs à chaque fois : no text, no logos, no people, no hands, no warping.

---

## FIXES (nommer le problème à Claude → il connaît la réponse)

| Symptôme | Cause | Fix |
|---|---|---|
| « C'est flou » | Canvas resté en 300×150 par défaut | Dimensionner depuis `video.videoWidth` à la 1re frame (le moteur le fait déjà) |
| « Ça joue comme un diaporama » | Quelque chose scrube `video.currentTime` | Capturer les frames d'abord, peindre depuis la séquence. **Jamais décoder au scroll.** |
| « Ça crashe/lag sur mobile » | Trop de clips 4K décodés à la fois | Mobile = source 1080p à la largeur device ; seul le desktop charge le master 4K |
| « L'objet apparaît/pop de nulle part » | Clip 2-frames avec objet absent au start, présent au end → le modèle le fade-in | Lui donner un point de départ : entrée par un bord du cadre, ou cacher le changement derrière un nuage / whip-pan. Négatifs : `no fading in, no materializing, no teleporting, no ghosting` |
| « Il y a un trou entre deux clips » | Frontières non raccord | Inverser un clip existant (gratuit) pour combler, ou générer un clip bridge chaîné start→end |
| « Enhance change mon plan » | Enhance ON réécrit le prompt | **Enhance OFF.** |

---

## THÈME, MOBILE & SHIPPING

**Thème** — échantillonne l'accent sur la lumière clé du footage. Garde le centre de
l'animation lumineux ; assombris seulement les bords pour nav/texte. Ajoute un boost
brightness/contrast/saturate pour faire ressortir le produit. Scrim léger sur les beats
de texte pour laisser voir le mouvement derrière le copy.

**Mobile** — `overflow-x-hidden` sur `main` ; titres `text-5xl` → `md:text-8xl` ;
kickers rétrécissent et cachent leurs filets latéraux ; nav collapse en wordmark + drawer.

**Shipping** — `npm run build` doit passer, puis commit + push. Les sous-domaines mappent
dans le middleware (`watch → /oscilla`, etc.). **Les preview deployments n'ont PAS de
sous-domaine** : on voit un nouveau site à `<preview-url>/<name>` (ex. `/meridian`), pas à la racine.

---

## LA BOUCLE, DISTILLÉE
```
concept → kickoff → scaffold (slots vides, build vert)
→ tu génères un asset → Claude pull + upscale + câble
→ build + push → répéter par clip → pass mobile → ship
```
