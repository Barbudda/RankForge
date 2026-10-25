---
name: signaux-vibecodes
description: Les 34 signaux qui font dire « site vibecodé » (30 du reel aj.on.ai 2026, 4 relevés sur les projets), chacun avec sa sévérité, la raison pour laquelle il sent l'IA et l'alternative concrète. À utiliser avant de designer une page (choisir palette, typographie et icônes hors défauts), pendant la revue d'une UI, et dans /bonds audit. Complète Impeccable et la checklist PAS-IA de BONDS.
---

# Signaux « vibecodé »

Un site « vibecodé » se reconnaît en une seconde. Pas parce qu'il est laid : parce qu'il empile les
valeurs par défaut de tous les générateurs (starter Next, shadcn, Tailwind, lucide, Inter, dégradé
violet, trois cartes). Chaque défaut pris seul est anodin ; leur accumulation signe l'IA. Ce skill
liste les 34 signaux : les 30 du reel « 30 reasons your site looks vibecoded » (aj.on.ai, 2026), retenu par
Hugo comme référence, avec deux niveaux :

- **BLOQUANT** : jamais dans un projet fini. `/bonds audit` refuse le verdict « fini » tant qu'il
  en reste un, sauf dérogation explicite d'Hugo consignée dans `bonds-lock.json`.
- **AVERTISSEMENT** : défaut de starter. Acceptable seulement s'il est **délibéré**, écrit dans
  `DESIGN.md` avec sa raison, et **tenu partout**. Un défaut gardé « parce que c'était là » n'est
  pas une décision.

## Quand l'invoquer

- Avant de dessiner une page ou un composant : pour choisir palette, typographie et icônes hors
  défauts (avec `taste-skill` ou `creative-direction` si présents).
- Pendant la revue d'une UI, la sienne ou celle d'un autre : relire la liste section par section.
- Dans `/bonds audit` : les détecteurs numérotés de `scripts/audit.mjs` portent les mêmes numéros
  que cette liste ; les sévérités ci-dessous font foi.

## Protocole

### Avant de coder (dans `DESIGN.md`)

Choisis hors défauts et écris-le, sinon le défaut gagne à la première ligne de code :

1. **Palette** : 1 accent fort, 2 ou 3 neutres riches (chauds ou froids), fond teinté (jamais
   `#fff` nu). Hors jeu sans décision écrite : violet et noir (20), néon (29), pastels Tailwind
   (30), dégradé de hero (1), texte arc-en-ciel (4).
2. **Typographie** : deux familles nommées, serif éditoriale + grotesque de caractère, ou une seule
   à forte personnalité. Inter, Geist et Space Grotesk sont hors jeu par défaut (10).
3. **Icônes** : Phosphor, Tabler ou SVG maison. lucide (2) seulement si trait et taille sont fixés
   et que tout le site les suit ; jamais `Sparkles` (24), jamais d'emoji (7).
4. **Une règle par effet** : un rayon (19), une ombre ou aucune (5), un décor de fond au plus
   (8, 22, 23). Le mouvement sert un état ou un feedback, pas l'ambiance (25, 28).
5. **Contenu réel prévu** : témoignages vrais ou aucun (12), capture du produit (18), squelettes
   de chargement si l'app a des données (21), CGU et confidentialité dès qu'il y a un formulaire,
   une newsletter, un outil d'analytics ou un paiement (26, 27).

### Pendant (à chaque section ou composant)

- Relis la liste avant de fermer une section. Pour chaque AVERTISSEMENT gardé, une ligne dans
  `DESIGN.md` : « signal n, gardé parce que … ».
- Deux signaux de décor (5, 8, 22, 23) sur la même surface, c'est déjà le look générique : n'en
  garde qu'un.
- Texte : aucun emoji (7), aucun tiret cadratin (9), pas de « ce n'est pas X, c'est Y » (15) ;
  une liste en coches (16) devient prose ou liste simple.
- Mise en page : pas de `grid-cols-3` « Fonctionnalités » (6), de bento (13) ni de trois tarifs
  (17) par réflexe ; le contenu décide de la grille.

### À la fin (`/bonds audit`)

1. `scripts/audit.mjs` : détecteurs 1 à 30 (grep déterministe), sévérités de ce skill.
2. Revue visuelle des captures `playwright-cli` desktop et mobile pour ce que le grep ne voit pas
   ou voit mal : 6, 14, 17, 18, 20, 29, 30.
3. Impeccable `/audit` recoupe les signaux de décor et de palette (1, 3, 5, 8, 19, 22, 23).
4. Le rapport liste les BLOQUANT restants (1, 4, 7, 9, 12, 15, 26, 27) ; le verdict suit la
   checklist PAS-IA de BONDS (`docs/PAS-IA.md`).

## Les 34 signaux

Numérotation du reel, reprise par les détecteurs de `scripts/audit.mjs`.

### Couleur et fond

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 1 | Dégradé violent dans le hero (deux teintes saturées éloignées, `bg-gradient-to-*` ou `linear-gradient` à 2 arrêts saturés ou plus) | BLOQUANT | premier réflexe des générateurs pour « moderne » ; aucune marque ne l'a choisi | fond teinté ou texturé ; au plus un dégradé ton sur ton, presque invisible |
| 3 | Fond blanc pur (`#fff`, `bg-white` sur `body`, `html` ou `main`) | AVERTISSEMENT | la valeur par défaut jamais touchée ; une marque choisit son blanc | blanc cassé, crème, gris chaud ou froid, grain léger |
| 4 | Texte arc-en-ciel (`bg-clip-text` + dégradé à 3 teintes ou plus) | BLOQUANT | le mot devient décor ; look « landing IA 2023 » | titre en couleur pleine, un seul accent fort |
| 20 | Violet et noir (`bg-black` / `zinc-950` + purple / violet) | AVERTISSEMENT | la palette « IA » par excellence depuis 2023 | 1 accent fort inattendu, neutres riches |
| 29 | Néon (`#00ff…`, `fuchsia-400` / `cyan-400` sur fond sombre, « neon ») | AVERTISSEMENT | look « cyber » de démo, contraste rarement AA | un seul accent saturé sur neutres profonds, AA vérifié |
| 30 | Pastels de base (cartes `blue-100`, `pink-100`, `green-100`, `yellow-100`) | AVERTISSEMENT | le « Softer side of Lumina » : teintes Tailwind 100 posées telles quelles | neutres riches + 1 accent ; si pastel, une teinte sur mesure |

### Typographie, icônes et texte

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 10 | Inter, Geist ou Space Grotesk (`next/font/google`, `@import` Google Fonts, `font-family`) | AVERTISSEMENT | polices par défaut de Next, Vercel et des starters ; on les reconnaît avant de lire | serif éditoriale + grotesque de caractère, nommées dans `DESIGN.md` |
| 2 | Icônes lucide (`import … from "lucide-react"`) | AVERTISSEMENT | icône par défaut de shadcn : même trait, même taille sur tous les sites | Phosphor, Tabler ou SVG maison ; lucide seulement personnalisé (trait, taille) et cohérent |
| 24 | Icône étincelles (`Sparkles`, ✨) | AVERTISSEMENT | l'icône « magie IA » collée à toute fonctionnalité | nommer la fonction ; icône liée au métier, ou rien |
| 16 | Puces à coches (✓ ✔ ✅, `<Check />` en liste) | AVERTISSEMENT | la liste qui dit oui à tout ; template de pricing | liste typographique (tiret, numéro) ou prose |
| 7 | Emojis dans l'interface ou le README | BLOQUANT | tic de sortie de modèle ; aucune marque premium n'en met dans un bouton | aucun ; SVG cohérent ou rien |
| 9 | Tirets cadratins (—) dans le texte d'interface, FR ou EN | BLOQUANT | signature d'écriture des modèles, en anglais comme en français | point, deux-points, virgule ; phrases plus courtes |
| 15 | « Ce n'est pas X, c'est Y » / « it's not X, it's Y » | BLOQUANT | figure rhétorique favorite des modèles ; creuse | dire ce que c'est, directement, avec un fait |

### Mise en page

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 6 | Trois cartes « Fonctionnalités » (`grid-cols-3` sous un titre Features / Fonctionnalités) | AVERTISSEMENT | la section Features de tous les templates SaaS | sections asymétriques, une fonctionnalité par section, rythme éditorial |
| 11 | Bande colorée à gauche (`border-l-4 border-<couleur>`) | AVERTISSEMENT | le callout Notion / Tailwind UI recopié | hiérarchie par l'espacement, la graisse et la taille |
| 13 | Grille bento (« bento » dans les classes ou composants, `col-span-2` / `row-span-2` mélangés) | AVERTISSEMENT | mode 2023-2024 servie par défaut ; le contenu est forcé dans les cases | grille éditoriale dont les colonnes suivent le contenu |
| 17 | Trois tarifs Starter / Pro / Enterprise | AVERTISSEMENT | structure de pricing générique, souvent sans produit derrière | une ou deux offres réelles, ou devis expliqué |
| 19 | Arrondis mous partout (`rounded-2xl` / `rounded-3xl`, 10 occurrences ou plus) | AVERTISSEMENT | tout en bulle, aucune tension ; forme de starter | un rayon unique et petit tenu partout, ou angles vifs |

### Effets et décor

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 5 | Ombres lourdes (`shadow-lg/xl/2xl`, `box-shadow` à grand flou) | AVERTISSEMENT | lumière venue de nulle part, posée sur tout ce qui ressemble à une carte | ombre douce à une seule direction, ou bordure fine |
| 8 | Verre dépoli (`backdrop-blur` + `bg-white/10` ou `bg-black/10`, « glass ») | AVERTISSEMENT | effet à la mode copié sans surface derrière à flouter | surfaces opaques, hiérarchie par le contraste |
| 22 | Orbes radiales (divs décoratives `absolute rounded-full blur-3xl`) | AVERTISSEMENT | les trois taches floues de chaque hero généré | rien, ou une texture / photo intentionnelle |
| 23 | Trame de points (`radial-gradient` en motif, « dot-grid », `bg-dot`) | AVERTISSEMENT | le fond « tech » par défaut | rien, ou une trame liée à l'identité (papier, grain) |
| 25 | Flèches animées (`ArrowRight` + `group-hover:translate-x`) | AVERTISSEMENT | le même micro-mouvement sur chaque lien de chaque site généré | flèche statique ; l'interaction montre un état ou un feedback |
| 28 | Survol animé partout (`hover:scale-105`, `hover:-translate-y`, 8 occurrences ou plus) | AVERTISSEMENT | la page bouge sans raison ; l'effet remplace l'intention | hover seulement là où il informe (lien, action) ; transitions courtes |
| 14 | Fausse fenêtre de terminal (composant Terminal, `$ npm install` dans l'UI, trois points macOS) | AVERTISSEMENT | décor « pour devs » sans commande réelle derrière | vrai bloc de code coloré, ou capture du vrai terminal |
| 34 | Surlignage tactile par défaut sur un site sombre (pavé clair à l'appui du doigt) | AVERTISSEMENT | le site n'a jamais été touché sur un vrai téléphone | `-webkit-tap-highlight-color: transparent` et un vrai état `:active` |

### Contenu et preuve

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 12 | Faux témoignages (« John Doe », « Sarah K. », « CEO at Acme », blocs 5 étoiles répétés) | BLOQUANT | placeholders jamais remplacés ; détruit la confiance en une lecture | témoignages réels (nom, entreprise, accord écrit) ; sinon aucun |
| 18 | Pas de démonstration réelle du produit (hero SaaS sans capture ni vidéo) | AVERTISSEMENT | on décrit sans montrer : le produit n'existe peut-être pas | capture ou vidéo du vrai produit, à jour, dans le hero |
| 21 | Pas de squelettes de chargement (aucun Skeleton ni `animate-pulse` dans une app à données) | AVERTISSEMENT | l'état intermédiaire n'a pas été pensé ; « Loading… » ou saut de layout | squelettes à la forme du contenu, dimensions réservées |
| 31 | Le livrable s'explique à son lecteur (« une page, quatre rubriques, comme la fiche 1 le demande », « à lire en vingt secondes ») | BLOQUANT | le raisonnement de fabrication a fui dans le rendu : personne n'écrit ça à un client | le pourquoi dans les commentaires du code, jamais dans la page |
| 32 | « On » pour un groupe identifiable dans un texte à la première personne (« on filme l'expert » quand c'est l'auteur et ses associés) | AVERTISSEMENT | distance impersonnelle là où un humain dirait « nous » | « nous » dès que le groupe est nommable ; « on » gardé pour les tournures générales |
| 33 | Un fichier cité dans le contenu qui n'existe pas dans `public/` (cadre vide, image muette) | BLOQUANT | le chemin a été inventé ou un dossier renommé sans relire les références | chaque chemin vérifié ; `/bonds audit` le fait mécaniquement |

### Légal

| N° | Signal | Sévérité | Pourquoi ça sent l'IA | Alternative |
|---|---|---|---|---|
| 26 | Pas de CGU | BLOQUANT si formulaire, newsletter, analytics ou paiement ; sinon AVERTISSEMENT | site posé comme une démo, sans obligations | CGU réelles, rédigées pour ce site, liées dans le pied de page |
| 27 | Pas de politique de confidentialité | idem 26 | idem, et illégal dès qu'une donnée est collectée | politique réelle, adaptée aux traitements (formulaire, cookies, analytics) |

## Priorité sur react-design-craft

`react-design-craft` (core) impose encore `lucide-react` et cite Inter en exemple de police de
corps. Ce skill prime sur ces deux points : lucide n'est plus la valeur par défaut, Inter, Geist et
Space Grotesk non plus. Les autres règles de craft (stance esthétique, tokens, construction par
couches, garde-fous anti-template) restent entières et vont dans le même sens.
