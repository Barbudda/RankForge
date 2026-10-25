# Ce que BONDS a ajouté à ce projet

> Inventaire **généré** le 2026-10-25 par `scripts/inventaire.mjs` de BONDS.
> Ne pas l'éditer à la main : il est réécrit à chaque `/bonds update`.
> Loadout : **vitrine-premium** · 91 éléments · source : `C:/Users/hugo8/OneDrive/Desktop/BONDS`

## En deux phrases

BONDS est une bibliothèque personnelle d'outils pour Claude Code. Équiper un projet, c'est y copier
une sélection de **skills** (modes d'emploi que la session suit), d'**agents** (experts à qui déléguer)
et de **serveurs MCP** (outils externes : navigateur, docs, git), plus un `CLAUDE.md` qui fixe les règles.
Rien ici n'est obligatoire : c'est un réservoir dans lequel la session pioche selon la tâche.

## Comment s'en servir

- **Les skills** se déclenchent seuls quand la tâche correspond à leur description, ou se demandent par leur nom.
- **Les agents** se délèguent explicitement (« fais relire ça par `visual-qa` »).
- **Les serveurs MCP** ne sont chargés qu'au **démarrage d'une session** : après un équipement, relancer ou `/clear`.
- `/bonds audit` lance la checklist « pas l'air fait par une IA » ; un constat bloquant n'est pas négociable.
- `/bonds update` réapplique les évolutions de BONDS ; `/skill-doctor` montre les skills jamais utilisés.

## Skills (61)

### Direction artistique et design

À lire **avant** d'écrire un composant. La direction se décide une fois, s'écrit dans `DESIGN.md`, puis contraint tout le reste.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `awwwards-redesign` | Transforme une page existante en version nettement plus premium : hiérarchie, typographie, motion, layout, images et transitions. | hérité du hub de Second |
| `creative-direction` | Pose une direction artistique avant le code : concept visuel, palette, typographies, style d'animation et signatures visuelles. | hérité du hub de Second |
| `frontend-design` | Skill officiel Anthropic de design front-end, réécrit pour lister les tics de page générée (mot accentué, labels en capitales, numéros décoratifs, fade-and-slide-up, trois looks IA) ; graine directe pour signaux-vibecodes. | anthropics/skills |
| `immersive-landing-page` | Construit une landing page niveau Awwwards : hero mémorable, sections cinématiques, animations au scroll, micro-interactions. | hérité du hub de Second |
| `luxury-design-system` | Design system haut de gamme : palette, typographies fortes, spacing cohérent, composants et états animés. | hérité du hub de Second |
| `react-design-craft` | Composants React de qualité exposition : stance esthétique avant le code, tokens CSS, construction par couches, anti-templates. | hérité du hub de Second |
| `sheleg-design` | Couche de goût en Markdown pur : 39 packs de style verrouillés (tokens, palettes, typographies serif/grotesque/mono propres à chaque pack) et une doctrine de mouvement à horloge de scroll unique avec repli statique, pour les landi | ssheleg/sheleg-design-skill |
| `taste-skill` | Skill anti-slop (v2 expérimental) pour landing pages, portfolios et refontes : lit le brief, déduit la direction de design via trois curseurs (VARIANCE / MOTION / DENSITY), impose un pré-vol strict et des squelettes GSAP pour livr | Leonxlnx/taste-skill |
| `ui-ux-pro-max` | Base de connaissances UI/UX (styles, palettes, pairings de polices, guidelines UX) pour orienter une interface web ou mobile. | nextlevelbuilder/ui-ux-pro-max-skill |

### Anti-IA : le visuel

Les défauts qui font dire « c'est généré ». `signaux-vibecodes` est la référence : 30 signaux numérotés, huit bloquants. `/bonds audit` les vérifie automatiquement.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `anti-ui-slop` | Skill anti-slop qui part du produit existant (brief, composants, tokens), choisit un playbook (création, opérations, polish, audit, iOS) et impose un rendu inspecté avant handoff, sans inventer de nouveauté gratuite, pour vitrine- | uizze/gemini-extension |
| `impeccable` | Skill /impeccable (Paul Bakaus) : direction artistique et exécution frontend en une commande (shape, audit, critique, polish, animate, colorize, harden, optimize…) avec des agents dédiés et un hook de détection d'anti-patterns des | pbakaus/impeccable |
| `signaux-vibecodes` | Les 34 signaux qui font dire « site vibecodé » (30 du reel aj.on.ai 2026, 4 relevés sur les projets), avec sévérité, raison et alternative, plus un protocole avant / pendant / après pour designer hors défauts. | écrit pour BONDS |
| `ui-slop-audit` | Sept skills UI/UX anti-slop (audit en lecture seule avec preuves, refonte visuelle, flux et états, UX writing, porte qualité) qui diagnostiquent puis corrigent une interface au look générique en respectant la marque existante, pou | ch4570/lutriva |

### Anti-IA : le texte

Tout texte visible passe par là avant livraison : tics d'écriture, tournures d'assistant, remplissage.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `avoid-ai-writing` | Audit et réécriture des AI-isms en deux passes avec détecteur déterministe sans dépendance (base). | conorbronsdon/avoid-ai-writing |
| `clear-writing` | Audit des tics d'écriture IA (mots creux, remplissage, modaux d'esquive) et anglais technique simplifié ASD-STE100 pour la doc, l'aide en ligne et la microcopy ; loadout base, en complément de humanizer. | pinkpixel-dev/clear-writing-skill |
| `copywriting` | Rédaction de pages marketing (titres, propositions de valeur, preuves) pour une vitrine. | coreyhaines31/marketingskills |
| `hermes-humanizer` | Réécrit un texte pour supprimer les tics d'écriture IA et lui rendre une voix humaine et précise. | NousResearch/hermes-agent |
| `no-ai-slop` | Supprime plus de 20 patrons d'écriture IA en préservant la voix de l'auteur (base). | petergyang/no-ai-slop |
| `sepia` | Réécrit ou diagnostique un texte pour effacer la signature IA au niveau de la structure (chaînes causales, explication du thème) et applique des règles par type de document technique, en complément d'hermes-humanizer. | Nanako0129/sepia |
| `ux-writing` | Sept skills UI/UX anti-slop (audit en lecture seule avec preuves, refonte visuelle, flux et états, UX writing, porte qualité) qui diagnostiquent puis corrigent une interface au look générique en respectant la marque existante, pou | ch4570/lutriva |
| `zero-slop` | Skill d'édition plus scoreur hors-ligne (294 motifs pondérés, lexique de 96 termes, Python stdlib) et CLI `npx zero-slop score` qui repèrent les tournures IA, réécrivent en préservant noms, chiffres, liens et citations, et notent  | manavmishra/ZeroSlop |

### Animation et mouvement

Le vocabulaire d'animation et son exécution. Une animation doit clarifier, jamais décorer ; `prefers-reduced-motion` est non négociable.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `emil-animate` | Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS. | emilkowalski/skills |
| `emil-animation-vocabulary` | Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS. | emilkowalski/skills |
| `emil-review-animations` | Skills d'animation de référence (animate, review-animations, animation-vocabulary, apple-design, prototype) pour vitrine et SaaS. | emilkowalski/skills |
| `gsap-core` | Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées. | greensock/gsap-skills |
| `gsap-performance` | Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées. | greensock/gsap-skills |
| `gsap-react` | Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées. | greensock/gsap-skills |
| `gsap-scrolltrigger` | Huit skills officiels GSAP (core, timeline, ScrollTrigger, SplitText, React useGSAP, performance) pour les vitrines animées. | greensock/gsap-skills |
| `interaction-lab` | Interactions avancées : hover magnétique, curseur custom, menus animés, transitions de page, drag et carrousels inertiels. | hérité du hub de Second |
| `motion-audit` | Audite les animations d'un site : fluidité, durées, easing, cohérence, utilité, performance et prefers-reduced-motion. | hérité du hub de Second |
| `scroll-cinema` | Site scroll-cinéma premium : une scène héros verrouillée image par image au scroll, avec clip rendu et narration. | hérité du hub de Second |
| `scroll-craft` | Sites scroll-driven premium avec huit grammaires de page, un « fingerprint gate » anti-répétition et des refus explicites des tics IA (vitrine). | nateherkai/scroll-craft |
| `scroll-storytelling` | Expérience scroll-telling premium avec GSAP ScrollTrigger et Lenis : parallaxe, timelines, textes et images synchronisés. | hérité du hub de Second |

### SEO, performance et web moderne

Être trouvé et rester rapide. Les images sont presque toujours le premier levier de performance.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `ai-seo` | Référencement dans les réponses IA (AEO/GEO) en complément du SEO classique. | coreyhaines31/marketingskills |
| `modern-web-guidance` | Guides web modernes de l'équipe Chrome (View Transitions, container queries, subgrid, oklch, text-wrap, accessibilité) au format skill, économes en tokens ; utile au volet perf/a11y du loadout vitrine-premium. | GoogleChrome/modern-web-guidance |
| `seo-aeo-best-practices` | Métadonnées, Open Graph, sitemap, robots.txt, hreflang, JSON-LD et EEAT pour moteurs classiques et réponses IA (vitrine, SaaS). | sanity-io/agent-toolkit |
| `seo-audit-canaux` | Audite et corrige un site sur cinq canaux (SEO, AEO, GEO, LLMO) avec score, sans clé. | leopard627/fire-your-seo-agency |
| `seo-landing` | SEO technique de landing page visant 100/100 PageSpeed : Core Web Vitals, sémantique, Schema.org, AVIF (vitrine). | aleksandr-alhoff/seo-landing |
| `seo-technique` | SEO technique : balises, sitemap, robots, performance, données structurées. | rampstackco/claude-skills |
| `seo-vagues-sourcees` | Faire monter un site sans budget pub, dans Google et dans les assistants IA : registre unique des pages, vagues écrites par des agents en parallèle avec faits sourcés et datés, pages produit par plateforme, llms.txt, pricing.md, r | local:RushPilot |
| `visual-performance-optimizer` | Optimise LCP/CLS/INP, images, vidéos, textures, GLTF, shaders et bundle sans sacrifier la qualité visuelle. | hérité du hub de Second |
| `web-performance` | Optimisation des performances web (Core Web Vitals, images, scripts). | rampstackco/claude-skills |

### Images, 3D et média

Réservé aux moments forts. Une scène 3D ou un effet lourd doit avoir un repli mobile.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `image-transformation-lab` | Effets avancés sur images : morphing, displacement maps, hover reveal, avant/après, carrousels immersifs et masques animés. | hérité du hub de Second |
| `img2threejs` | Transforme une image de référence (objet ou personnage) en modèle Three.js procédural généré par étapes et validé par des gates qualité, avec des scripts Python stdlib pour l'analyse, la spec et la validation. | img2threejs/img2threejs |
| `threejs-r3f-scene` | Scène 3D web avec Three.js / React Three Fiber / Drei : modèles GLTF, lumières, caméra animée, shaders simples, repli mobile. | hérité du hub de Second |
| `webgl-hero` | Hero WebGL spectaculaire : particules, displacement, distorsion d'image, shaders et transitions premium. | hérité du hub de Second |

### Méthode de travail

Comment mener une tâche : cadrer, planifier, vérifier avant de dire que c'est fini.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `brainstorming` | Dialogue de cadrage avant tout développement : explore l'intention, les besoins et le design d'une fonctionnalité avant d'écrire du code. | obra/superpowers |
| `ecc-coding-standards` | Standards de code universels TypeScript/JavaScript/React/Node : nommage, structure, gestion d'erreurs, bonnes pratiques. | affaan-m/ECC |
| `executing-plans` | Exécute un plan d'implémentation étape par étape, avec points de contrôle et revue entre chaque lot. | obra/superpowers |
| `grill-me` | Interroge l'utilisateur sur son plan jusqu'à résoudre toutes les branches de décision avant de coder (base). | mattpocock/skills |
| `systematic-debugging` | Méthode de débogage systématique : reproduire, isoler, formuler une hypothèse et la vérifier avant de corriger. | obra/superpowers |
| `test-driven-development` | Cycle rouge-vert-refactor strict : écrire le test qui échoue avant le code, puis nettoyer. | obra/superpowers |
| `token-economy` | Économie de tokens : plan mode, /compact, sous-agents, sortie plafonnée et maintien d'un CODEMAP du projet. | local:Poliguide/.claude/skills/token-economy |
| `verification-before-completion` | Impose de prouver qu'un travail est terminé (tests, sortie réelle) avant de le déclarer fini. | obra/superpowers |
| `writing-plans` | Rédige un plan d'implémentation détaillé, découpé en tâches vérifiables, à partir d'un design validé. | obra/superpowers |

### Vérification et navigateur

La preuve : captures réelles, mesures réelles. Pas de « ça devrait marcher ».

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `playwright-cli` | CLI Playwright pilotée depuis le terminal (open, goto, click, snapshot, screenshot, pdf, traces, mocks réseau) qui sert de preuve visuelle desktop/tablette/mobile ; le skill documente les commandes pour l'agent. | https://www.npmjs.com/package/@playwright/cli |

### Autres

Assets qui ne rentrent dans aucune famille ci-dessus.

| Skill | À quoi ça sert | Provenance |
|---|---|---|
| `ecart-concurrentiel` | Trouver ce que les concurrents captent et qu'on ne capte pas : identifier les vrais concurrents par la SERP, relever leur arborescence par sitemap et titres, regrouper par thème, croiser avec son registre, choisir l'angle d'attaqu | local:BONDS |
| `metriques-seo` | Ce que mesure vraiment chaque métrique SEO et comment la lire : volume, CPC, densité concurrentielle, difficulté, intention, score d'autorité, domaines référents, ancres, visibilité, CTR par position. Chaque entrée donne l'ordre d | local:BONDS |
| `recherche-mots-cles` | Construire un registre de requêtes cibles sans abonnement : sources gratuites (Search Console, autocomplétion, questions posées, Trends, Keyword Planner, forums), lecture de SERP en six questions à la place de l'indice de difficul | local:BONDS |
| `semrush-mcp` | Piloter le MCP Semrush sans gaspiller d'unités : les 10 toolkits et 66 rapports, le parcours découverte / schéma / exécution, la grammaire des paramètres (bases régionales, filtres serveur, colonnes), l'algèbre d'ensembles de l'éc | local:BONDS |
| `verif-site-en-ligne` | Deux scripts Node sans dépendance : un parcours du site en ligne qui détecte liens morts, titres et descriptions hors limites, canoniques hors domaine, h1 manquants et images sans alt ; et une soumission IndexNow (Bing, Yandex, Se | écrit pour BONDS |

## Agents (5)

### Direction artistique et design

À lire **avant** d'écrire un composant. La direction se décide une fois, s'écrit dans `DESIGN.md`, puis contraint tout le reste.

| Agent | À quoi ça sert | Provenance |
|---|---|---|
| `creative-director` | Directeur artistique web premium : direction visuelle, concepts, niveau Awwwards et cohérence esthétique du site. | hérité du hub de Second |
| `design-craft-expert` | Ingénieur front et designer UI : composants React de qualité exposition, conçus et non assemblés, via la skill react-design-craft. | hérité du hub de Second |

### Animation et mouvement

Le vocabulaire d'animation et son exécution. Une animation doit clarifier, jamais décorer ; `prefers-reduced-motion` est non négociable.

| Agent | À quoi ça sert | Provenance |
|---|---|---|
| `motion-designer` | Expert animation web (GSAP, Framer Motion, ScrollTrigger, Lenis) : chorégraphie des transitions, micro-interactions et scroll. | hérité du hub de Second |

### Images, 3D et média

Réservé aux moments forts. Une scène 3D ou un effet lourd doit avoir un repli mobile.

| Agent | À quoi ça sert | Provenance |
|---|---|---|
| `threejs-engineer` | Expert 3D web (Three.js, React Three Fiber, Drei) : scènes, modèles GLTF, caméra, lumières, shaders et optimisation mobile. | hérité du hub de Second |

### Vérification et navigateur

La preuve : captures réelles, mesures réelles. Pas de « ça devrait marcher ».

| Agent | À quoi ça sert | Provenance |
|---|---|---|
| `visual-qa` | Contrôle qualité visuelle via Playwright : captures desktop/tablette/mobile, bugs visuels, cohérence design et revue d'animations. | hérité du hub de Second |

## Serveurs MCP (9)

Outils externes branchés sur la session, déclarés dans `.mcp.json`. **Chargés au démarrage de session seulement.**

| Serveur | À quoi ça sert | Provenance |
|---|---|---|
| `chrome-devtools` | Chrome DevTools en MCP : audits Lighthouse, traces de performance, réseau, console et captures pour mesurer LCP/CLS/INP. | npm:chrome-devtools-mcp@latest |
| `context7` | Documentation à jour des bibliothèques et frameworks, injectée à la demande. | npm:@upstash/context7-mcp |
| `figma` | Lecture des maquettes Figma (fichiers, styles, composants) par le serveur officiel en HTTP, sans clé ni processus local. | core/mcp/servers.json#figma |
| `git` | Opérations git (status, diff, log, commit, branches) sur le dépôt du projet. | npm:@cyanheads/git-mcp-server |
| `memory` | Graphe de connaissances persistant entre sessions (entités, relations, observations). | npm:@modelcontextprotocol/server-memory |
| `playwright` | Pilotage d'un navigateur (navigation, captures, formulaires) pour tester et vérifier visuellement. | npm:@playwright/mcp@latest |
| `prodcheck` | Checklist de mise en production (sécurité, perf, scaling, Stripe, Supabase, Vercel, Next.js) servie en MCP et en skill de revue, à passer avant de lancer un SaaS ou une vitrine. | npm:prodcheck-mcp |
| `semrush` | Recherche de mots-clés, positions et analyse de concurrence par le serveur officiel Semrush en HTTP. | core/mcp/servers.json#semrush |
| `sequential-thinking` | Raisonnement pas à pas structuré pour les problèmes complexes. | npm:@modelcontextprotocol/server-sequential-thinking |

## Références de design (16)

Fichiers `DESIGN.md` de marques connues, copiés dans `.claude/design-md/`. Ce sont des **graines** :
on en lit une proche du ton visé, on l'adapte, on **ne la copie jamais telle quelle**.

`airbnb` · `apple` · `cursor` · `figma` · `framer` · `linear` · `lovable` · `notion` · `posthog` · `resend` · `shopify` · `spotify` · `stripe` · `superhuman` · `vercel` · `warp`

## Dérogations

Écarts assumés à la règle, consignés dans `bonds-lock.json`.

- **mcp/figma retiré du .mcp.json** : FIGMA_API_KEY absente de l'environnement : pas de secret en clair (règle BONDS). (Claude, règle BONDS, 2026-10-25)
- **mcp/semrush retiré du .mcp.json** : Déjà installé et authentifié au scope user avec la même URL (https://mcp.semrush.com/v2/mcp) ; un doublon projet risquerait une seconde authentification OAuth. (Claude, règle BONDS, 2026-10-25)

## Où est quoi

| Chemin | Contenu |
|---|---|
| `.claude/skills/` | Les skills, un dossier par skill, chacun avec son `SKILL.md` |
| `.claude/agents/` | Les agents, un fichier Markdown par agent |
| `.claude/design-md/` | Les références de design |
| `.mcp.json` | Les serveurs MCP du projet (sauvegarde dans `.mcp.json.bak`) |
| `CLAUDE.md` | Les règles du projet ; le bloc entre les balises `bonds:` est régénéré par BONDS |
| `bonds-lock.json` | Ce qui a été installé : source, empreinte, date. Permet `/bonds update` |

