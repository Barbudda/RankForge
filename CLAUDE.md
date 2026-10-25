<!-- bonds:start -->
# CLAUDE.md — RankForge

> Équipé par BONDS le 2026-10-25 — loadout `vitrine-premium` (site vitrine premium).
> **Ne pas éditer entre les balises `bonds:start` / `bonds:end`** : ce bloc est régénéré par
> `/bonds update`. Écrire les règles propres au projet au-dessus ou en dessous du bloc.
> Ce qui est installé ici (source, hash, date) est tracé dans `bonds-lock.json`.

## Ambition

Viser le niveau primé (Awwwards, FWA) **tout en** tenant la barre perf et accessibilité ci-dessous.
**Jamais un rendu standard si une amélioration ambitieuse est possible** : quand deux solutions
tiennent, prends la moins attendue mais défendable, justifie-la en une phrase, exécute.

## Règles d'or (à appliquer systématiquement)

1. **Docs fraîches d'abord** : avant de coder contre une API ou une lib externe (GSAP, three,
   R3F, Lenis, motion…), consulte **context7** — la mémoire d'entraînement peut être périmée.
2. **Comprendre avant de modifier** : `git status` / `git diff` (MCP git) avant toute modification.
3. **Mémoire des décisions** : décisions importantes via **memory** ; structurantes → ADR dans
   `docs/adr/`. La direction artistique retenue est une décision structurante.
4. **Vérifier l'UI** : après un changement d'interface, capture (playwright-cli) desktop, tablette
   et mobile, et regarde-les vraiment. Jamais de « ça devrait marcher ».
5. **Raisonnement structuré** : tâche complexe → **sequential-thinking** avant d'agir.
6. **Agents pour le complexe** : `creative-director` pour la direction, `motion-designer` pour
   la chorégraphie, `threejs-engineer` pour la 3D, `visual-qa` avant de déclarer fini.
7. **Plan bref puis exécution** : grosse modif → plan court, validation, puis exécution.
8. **Tester puis documenter** : typecheck + tests, captures, puis mise à jour de la doc.
9. **Autonomie sur le réversible** : avance seul quand l'action est réversible.

## Garde-fous (demander validation avant)

- `rm -rf`, `git reset --hard`, `git clean -fd`, suppression de fichiers importants.
- `git push`, merge de PR, mise en production.
- Tout **achat, paiement, inscription, action juridique** (polices payantes, assets sous licence).
- Publication d'un **secret** : les clés vivent dans `.env` (git-ignoré), jamais ailleurs.
- Toute action **irréversible** → confirmer d'abord.

## Méthode machine

- **Lis un fichier avant de l'écraser** : les modèles récents peuvent réécrire un fichier jamais lu dans la
  session ; relis-le d'abord, puis édite au plus juste.
- Style de sortie **« Concise »** conseillé (`/config` → Output style) : résultats d'abord, sans narration.
- **Petits lots séquentiels** : les rafales d'appels parallèles se télescopent sur cette machine.
- **Windows 11 + OneDrive** : pas de dépendance native, pas de symlink, chemins entre guillemets.
  Préférer le Bash tool aux commandes PowerShell.
- **`npx` uniquement** ; Python 3 en **stdlib seulement** (img2threejs), pas de `pip`.

## Contenu et honnêteté

- **Rien d'inventé pour combler un trou** : ni date, ni chiffre, ni nom. Le trou se documente en
  commentaire d'en-tête du fichier de contenu et se redemande à l'auteur.
- **Les questions à l'auteur se posent en prose**, toutes d'un coup, groupées par thème. Pas de
  liste de choix fermés : on y perd tout ce que l'auteur aurait raconté autour.
- **Chaque image qui n'est pas de l'auteur porte son crédit** sous elle (auteur, licence, lien),
  plus une légende si c'est une archive. Pas de vue d'architecte ni d'image filigranée.
- **Aucune donnée d'un tiers** : comptes d'une entreprise d'accueil, nom d'une personne privée,
  document source non destiné au web. Vérifier en production que le document n'est pas servi.
- **Une étude de cas dit ce qui a été appris**, pas seulement ce qui a été fait, et chaque
  compétence annoncée est suivie de sa preuve en une phrase.
- **Pas de chiffre nu** : un repère court suivi d'une phrase vaut mieux que quatre nombres
  surlignés avec une étiquette de quatre mots.

## Convention française

- Commentaires en français, denses et utiles (le pourquoi, pas le quoi).
- Commits en français : un sujet par commit, corps qui explique la raison.
- Identifiants de code en anglais ; textes d'interface dans la langue du site.

## Pipeline design (obligatoire, dans cet ordre)

1. **Graine** : un `DESIGN.md` de référence est copié dans `.claude/design-md/` ; sinon
   `taste-skill` seul. La graine s'adapte au projet, elle ne se copie jamais telle quelle.
2. **Direction** : `taste-skill` (design-taste-frontend) + `creative-direction` → **un mot de ton**,
   une **palette non conventionnelle** (pas le bleu générique), **2 polices distinctives**,
   une densité (aérée ou dense, pas les deux). Consigner le résultat dans `DESIGN.md`.
3. **Exécution / vérification** : le skill `impeccable` (argument `shape`) (structure) → `craft` (finition) →
   `audit` / `critique` sur chaque page. Un audit rouge se corrige, il ne se commente pas.
4. **Preuve** : `playwright-cli` captures desktop / tablette / mobile + Lighthouse via
   `chrome-devtools` (`lighthouse_audit`). Les chiffres vont dans la PR ou le message de fin.

## Règles de craft (fusion de `react-design-craft` ; en cas de conflit, ce bloc prime)

- **Stance esthétique avant le code** : 2 polices distinctives (serif éditoriale + grotesque de
  caractère ; **Inter, Geist et Space Grotesk exclues par défaut**), 1 accent fort + 2-3 neutres
  riches sur un **fond teinté ou texturé, jamais blanc pur** ; violet-et-noir, néon et pastels
  basiques exclus par défaut ; un mot de ton tenu dans chaque décision.
- **Tokens** dans `@theme` (Tailwind v4) en `oklch` ; aucun hex sauvage dans les composants, et
  une variable se règle là où elle est déclarée : une `var()` inconnue rend la déclaration
  invalide et retombe au pire cas, sans la moindre erreur.
- **Tout CSS maison vit dans `@layer components`.** Hors couche, une classe de composant bat les
  utilitaires Tailwind et un `position: relative` écrase un `absolute`.
- **Jamais de préfixe constructeur écrit à la main** : Lightning CSS supprime alors la version
  standard. Écrire la propriété seule, le compilateur préfixe.
- **Construire par couches** : structure → typographie → couleur et surface → micro-détails
  (hover, transitions 150-300 ms, arrondis) → animation seulement si elle clarifie.
- Espacements en **multiples de 4 px** ; contraste **≥ 4,5:1** (AA) sur tout texte.
- Chaque élément interactif a un état **hover et focus visibles** ; ordre de tab logique.
- Animations : `motion/react`, **jamais `framer-motion`** ; GSAP + Lenis pour le scroll ;
  easing sur mesure, jamais `linear` brut ; stagger et ordre d'apparition pensés.
- **Icônes : Phosphor, Tabler ou SVG maison ; lucide seulement si personnalisé et cohérent.**
  `@radix-ui/*` pour les primitives accessibles.
- **Pas de décor par défaut** : ni orbes flous, ni grille de points, ni sparkles, ni flèche qui
  glisse au hover ; ombres douces à une seule direction, jamais d'ombre portée partout.
- Sections asymétriques plutôt que trois cartes en rang ; **témoignages réels ou aucun**.
- **CGU et politique de confidentialité obligatoires** dès qu'un formulaire, une newsletter ou
  un outil d'analytique existe.
- **Pas de reset CSS global** (`* { margin: 0 }`) : Tailwind s'en charge.
- Pas de `style={{ }}` quand une classe suffit ; pas d'animation sur chaque élément (effet de
  foire) ; pas de dégradé rainbow.
- **Pas de Lorem Ipsum** : invente un contenu réel, cohérent avec le brief.
- Pas de composant générique sans personnalité (card blanche, bouton bleu, hero centré à dégradé).
- Un seul point focal par écran ; un moment « wow » par page, pas dix.
- États vide / chargement / erreur designés, jamais un simple « Loading… ».
- Commentaires seulement quand le pourquoi n'est pas évident.
- 3D / images : GLB Draco ou meshopt, textures KTX2, images AVIF/WebP, lazy hors viewport,
  **repli mobile** (scène allégée ou image) obligatoire.

## Signaux « vibecodé » à éviter

Huit **BLOQUANT**, numérotés comme dans `/bonds audit` (catégorie « Signaux vibecodés ») :

- **#1** dégradé violent dans le hero (`bg-gradient-to-*` entre teintes saturées éloignées).
- **#4** texte arc-en-ciel (`bg-clip-text` + dégradé à trois teintes ou plus).
- **#7** emojis dans les textes d'interface ou le README.
- **#9** tirets cadratins (—) dans les textes d'interface, en français comme en anglais.
- **#12** faux témoignages (« John Doe », « Sarah K. », blocs cinq étoiles répétés, « CEO at Acme »).
- **#15** la tournure « ce n'est pas X, c'est Y » / « it's not X, it's Y ».
- **#26 / #27** CGU ou politique de confidentialité absentes alors qu'un formulaire, une newsletter,
  un outil d'analytique ou un paiement existe (sans eux : AVERTISSEMENT).

Les 22 autres (AVERTISSEMENT) : skill `signaux-vibecodes` et `/bonds audit`.

## Barre perf et accessibilité (bloquante)

| Mesure | Seuil | Outil |
|---|---|---|
| LCP | < 2,5 s | `chrome-devtools` `lighthouse_audit` |
| CLS | < 0,1 | idem |
| INP | < 200 ms | idem |
| Animations | 60 fps, pas de jank, CPU 4× sur mobile | `chrome-devtools` trace perf |
| Contraste | AA (≥ 4,5:1) | Lighthouse a11y + skill `impeccable` (argument `audit`) |
| `prefers-reduced-motion` | repli statique respecté | émulation `chrome-devtools` / playwright |

## Pas-IA (résumé) — checklist complète : `/bonds audit`

Pas « fini » tant qu'un critère **BLOQUANT** échoue, sauf dérogation explicite d'Hugo consignée
dans `bonds-lock.json` (`derogations`). Visuel : Impeccable `/audit` propre, zéro Lorem, pas de
look par défaut, zéro signal vibecodé bloquant, un point focal, états designés. Texte :
`hermes-humanizer`, aucun tic d'IA. Code + git : pas de commentaire signature IA, README sans
emojis, commits crédibles. Perf / a11y : la barre ci-dessus.

## Arsenal installé

### Skills (`.claude/skills/`)
- taste-skill — Skill anti-slop (v2 expérimental) pour landing pages, portfolios et refontes : lit le brief, déduit la direction de design via trois curseurs (VARIANCE / MOTION / DENSITY), impose un pré-vol strict et des squelettes GSAP pour livrer des interfaces qui n'ont pas l'air templatées.
- impeccable — Skill /impeccable (Paul Bakaus) : direction artistique et exécution frontend en une commande (shape, audit, critique, polish, animate, colorize, harden, optimize…) avec des agents dédiés et un hook de détection d'anti-patterns design après chaque édition.
- signaux-vibecodes — Les 34 signaux qui font dire « site vibecodé » (30 du reel aj.on.ai 2026, 4 relevés sur les projets), avec sévérité, raison et alternative, plus un protocole avant / pendant / après pour designer hors défauts.
- react-design-craft — Composants React de qualité exposition : stance esthétique avant le code, tokens CSS, construction par couches, anti-templates.
- ui-ux-pro-max — Base de connaissances UI/UX (styles, palettes, pairings de polices, guidelines UX) pour orienter une interface web ou mobile.
- creative-direction — Pose une direction artistique avant le code : concept visuel, palette, typographies, style d'animation et signatures visuelles.
- luxury-design-system — Design system haut de gamme : palette, typographies fortes, spacing cohérent, composants et états animés.
- immersive-landing-page — Construit une landing page niveau Awwwards : hero mémorable, sections cinématiques, animations au scroll, micro-interactions.
- scroll-storytelling — Expérience scroll-telling premium avec GSAP ScrollTrigger et Lenis : parallaxe, timelines, textes et images synchronisés.
- scroll-cinema — Site scroll-cinéma premium : une scène héros verrouillée image par image au scroll, avec clip rendu et narration.
- webgl-hero — Hero WebGL spectaculaire : particules, displacement, distorsion d'image, shaders et transitions premium.
- threejs-r3f-scene — Scène 3D web avec Three.js / React Three Fiber / Drei : modèles GLTF, lumières, caméra animée, shaders simples, repli mobile.
- interaction-lab — Interactions avancées : hover magnétique, curseur custom, menus animés, transitions de page, drag et carrousels inertiels.
- image-transformation-lab — Effets avancés sur images : morphing, displacement maps, hover reveal, avant/après, carrousels immersifs et masques animés.
- motion-audit — Audite les animations d'un site : fluidité, durées, easing, cohérence, utilité, performance et prefers-reduced-motion.
- visual-performance-optimizer — Optimise LCP/CLS/INP, images, vidéos, textures, GLTF, shaders et bundle sans sacrifier la qualité visuelle.
- awwwards-redesign — Transforme une page existante en version nettement plus premium : hiérarchie, typographie, motion, layout, images et transitions.
- img2threejs — Transforme une image de référence (objet ou personnage) en modèle Three.js procédural généré par étapes et validé par des gates qualité, avec des scripts Python stdlib pour l'analyse, la spec et la validation.
- playwright-cli — CLI Playwright pilotée depuis le terminal (open, goto, click, snapshot, screenshot, pdf, traces, mocks réseau) qui sert de preuve visuelle desktop/tablette/mobile ; le skill documente les commandes pour l'agent.
- frontend-design — Skill officiel Anthropic de design front-end, réécrit pour lister les tics de page générée (mot accentué, labels en capitales, numéros décoratifs, fade-and-slide-up, trois looks IA) ; graine directe pour signaux-vibecodes.
- scroll-craft — Sites scroll-driven premium avec huit grammaires de page, un « fingerprint gate » anti-répétition et des refus explicites des tics IA (vitrine).
- emil-animate — Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS.
- emil-review-animations — Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS.
- emil-animation-vocabulary — Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS.
- gsap-core — Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées.
- gsap-scrolltrigger — Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées.
- gsap-react — Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées.
- gsap-performance — Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées.
- seo-aeo-best-practices — Métadonnées, Open Graph, sitemap, robots.txt, hreflang, JSON-LD et EEAT pour moteurs classiques et réponses IA (vitrine, SaaS).
- sheleg-design — Couche de goût en Markdown pur : 39 packs de style verrouillés (tokens, palettes, typographies serif/grotesque/mono propres à chaque pack) et une doctrine de mouvement à horloge de scroll unique avec repli statique, pour les landing pages cinématiques du loadout vitrine-premium.
- seo-landing — SEO technique de landing page visant 100/100 PageSpeed : Core Web Vitals, sémantique, Schema.org, AVIF (vitrine).
- seo-audit-canaux — Audite et corrige un site sur cinq canaux (SEO, AEO, GEO, LLMO) avec score, sans clé.
- seo-technique — SEO technique : balises, sitemap, robots, performance, données structurées.
- seo-vagues-sourcees — Faire monter un site sans budget pub, dans Google et dans les assistants IA : registre unique des pages, vagues écrites par des agents en parallèle avec faits sourcés et datés, pages produit par plateforme, llms.txt, pricing.md, robots IA, IndexNow, et guides pour le propriétaire.
- recherche-mots-cles — Construire un registre de requêtes cibles sans abonnement : sources gratuites (Search Console, autocomplétion, questions posées, Trends, Keyword Planner, forums), lecture de SERP en six questions à la place de l'indice de difficulté, classement par intention, priorisation par gain sur effort.
- ecart-concurrentiel — Trouver ce que les concurrents captent et qu'on ne capte pas : identifier les vrais concurrents par la SERP, relever leur arborescence par sitemap et titres, regrouper par thème, croiser avec son registre, choisir l'angle d'attaque. Recettes d'algèbre d'ensembles de domain_domains quand le MCP Semrush est là.
- metriques-seo — Ce que mesure vraiment chaque métrique SEO et comment la lire : volume, CPC, densité concurrentielle, difficulté, intention, score d'autorité, domaines référents, ancres, visibilité, CTR par position. Chaque entrée donne l'ordre de grandeur utile et le contresens classique.
- semrush-mcp — Piloter le MCP Semrush sans gaspiller d'unités : les 10 toolkits et 66 rapports, le parcours découverte / schéma / exécution, la grammaire des paramètres (bases régionales, filtres serveur, colonnes), l'algèbre d'ensembles de l'écart de mots-clés, les appels groupés jusqu'à 100 requêtes, et la lecture des codes d'erreur.
- web-performance — Optimisation des performances web (Core Web Vitals, images, scripts).
- ai-seo — Référencement dans les réponses IA (AEO/GEO) en complément du SEO classique.
- modern-web-guidance — Guides web modernes de l'équipe Chrome (View Transitions, container queries, subgrid, oklch, text-wrap, accessibilité) au format skill, économes en tokens ; utile au volet perf/a11y du loadout vitrine-premium.
- copywriting — Rédaction de pages marketing (titres, propositions de valeur, preuves) pour une vitrine.
- ux-writing — Sept skills UI/UX anti-slop (audit en lecture seule avec preuves, refonte visuelle, flux et états, UX writing, porte qualité) qui diagnostiquent puis corrigent une interface au look générique en respectant la marque existante, pour les loadouts vitrine-premium et saas-webapp.
- ui-slop-audit — Sept skills UI/UX anti-slop (audit en lecture seule avec preuves, refonte visuelle, flux et états, UX writing, porte qualité) qui diagnostiquent puis corrigent une interface au look générique en respectant la marque existante, pour les loadouts vitrine-premium et saas-webapp.
- anti-ui-slop — Skill anti-slop qui part du produit existant (brief, composants, tokens), choisit un playbook (création, opérations, polish, audit, iOS) et impose un rendu inspecté avant handoff, sans inventer de nouveauté gratuite, pour vitrine-premium et saas-webapp ; le MCP UIZZE payant est facultatif.
- verif-site-en-ligne — Deux scripts Node sans dépendance : un parcours du site en ligne qui détecte liens morts, titres et descriptions hors limites, canoniques hors domaine, h1 manquants et images sans alt ; et une soumission IndexNow (Bing, Yandex, Seznam, Naver).
- writing-plans — Rédige un plan d'implémentation détaillé, découpé en tâches vérifiables, à partir d'un design validé.
- executing-plans — Exécute un plan d'implémentation étape par étape, avec points de contrôle et revue entre chaque lot.
- brainstorming — Dialogue de cadrage avant tout développement : explore l'intention, les besoins et le design d'une fonctionnalité avant d'écrire du code.
- systematic-debugging — Méthode de débogage systématique : reproduire, isoler, formuler une hypothèse et la vérifier avant de corriger.
- test-driven-development — Cycle rouge-vert-refactor strict : écrire le test qui échoue avant le code, puis nettoyer.
- verification-before-completion — Impose de prouver qu'un travail est terminé (tests, sortie réelle) avant de le déclarer fini.
- ecc-coding-standards — Standards de code universels TypeScript/JavaScript/React/Node : nommage, structure, gestion d'erreurs, bonnes pratiques.
- token-economy — Économie de tokens : plan mode, /compact, sous-agents, sortie plafonnée et maintien d'un CODEMAP du projet.
- hermes-humanizer — Réécrit un texte pour supprimer les tics d'écriture IA et lui rendre une voix humaine et précise.
- grill-me — Interroge l'utilisateur sur son plan jusqu'à résoudre toutes les branches de décision avant de coder (base).
- zero-slop — Skill d'édition plus scoreur hors-ligne (294 motifs pondérés, lexique de 96 termes, Python stdlib) et CLI `npx zero-slop score` qui repèrent les tournures IA, réécrivent en préservant noms, chiffres, liens et citations, et notent la prose de 0 à 100 ; pour la passe texte pas-IA de tout projet.
- clear-writing — Audit des tics d'écriture IA (mots creux, remplissage, modaux d'esquive) et anglais technique simplifié ASD-STE100 pour la doc, l'aide en ligne et la microcopy ; loadout base, en complément de humanizer.
- no-ai-slop — Supprime plus de 20 patrons d'écriture IA en préservant la voix de l'auteur (base).
- sepia — Réécrit ou diagnostique un texte pour effacer la signature IA au niveau de la structure (chaînes causales, explication du thème) et applique des règles par type de document technique, en complément d'hermes-humanizer.
- avoid-ai-writing — Audit et réécriture des AI-isms en deux passes avec détecteur déterministe sans dépendance (base).

### Agents (`.claude/agents/`)
- design-craft-expert — Ingénieur front et designer UI : composants React de qualité exposition, conçus et non assemblés, via la skill react-design-craft.
- creative-director — Directeur artistique web premium : direction visuelle, concepts, niveau Awwwards et cohérence esthétique du site.
- motion-designer — Expert animation web (GSAP, Framer Motion, ScrollTrigger, Lenis) : chorégraphie des transitions, micro-interactions et scroll.
- threejs-engineer — Expert 3D web (Three.js, React Three Fiber, Drei) : scènes, modèles GLTF, caméra, lumières, shaders et optimisation mobile.
- visual-qa — Contrôle qualité visuelle via Playwright : captures desktop/tablette/mobile, bugs visuels, cohérence design et revue d'animations.

### MCP (`.mcp.json`)
- playwright — Pilotage d'un navigateur (navigation, captures, formulaires) pour tester et vérifier visuellement.
- chrome-devtools — Chrome DevTools en MCP : audits Lighthouse, traces de performance, réseau, console et captures pour mesurer LCP/CLS/INP.
- figma — Lecture des maquettes Figma (fichiers, styles, composants) par le serveur officiel en HTTP, sans clé ni processus local.
- prodcheck — Checklist de mise en production (sécurité, perf, scaling, Stripe, Supabase, Vercel, Next.js) servie en MCP et en skill de revue, à passer avant de lancer un SaaS ou une vitrine.
- semrush — Recherche de mots-clés, positions et analyse de concurrence par le serveur officiel Semrush en HTTP.
- context7 — Documentation à jour des bibliothèques et frameworks, injectée à la demande.
- sequential-thinking — Raisonnement pas à pas structuré pour les problèmes complexes.
- memory — Graphe de connaissances persistant entre sessions (entités, relations, observations).
- git — Opérations git (status, diff, log, commit, branches) sur le dépôt du projet.
<!-- bonds:end -->
