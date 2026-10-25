---
name: seo-vagues-sourcees
description: Méthode pour faire monter un site sans budget publicitaire, dans Google et dans les réponses des assistants IA - registre unique des pages, vagues de 10 à 30 pages écrites par des agents en parallèle avec un brief commun, chaque fait vérifié à la source et daté, pages produit par plateforme et comparatifs, llms.txt, pricing.md, robots IA nommés, IndexNow, puis guides clic par clic pour le propriétaire (Search Console, Bing, profils, liens). À utiliser quand on demande du « SEO », du contenu pour se faire connaître, une vague de pages ou d'articles, de la visibilité dans ChatGPT ou Perplexity.
---

# SEO par vagues de pages sourcées

Éprouvé sur RushPilot (SaaS pour contributeurs de vidéo stock) du 11 au 12/10/2026 : de 0 à 125
pages anglaises et françaises en deux jours, RankForge 97, GEO 96 (100 avec les profils).
Modèle : la stratégie de fanclaw.ai, site d'un ami d'Hugo qui a percé sans payer.
Complète `seo-aeo-best-practices` et `seo-technique` (balises, sitemap, données structurées) :
ici, c'est la **production du contenu** et la **visibilité IA**. Après chaque vague mise en ligne,
passer `verif-site-en-ligne` (parcours de toutes les pages en production, liens morts, invariants
SEO, IndexNow).

## Les quatre leviers, dans l'ordre où ils rapportent

1. **Le contenu** : une page = une question qu'un client tape. Plus il y a de bonnes pages, plus
   il y a de portes d'entrée. Les assistants IA citent les pages claires, datées et sourcées.
2. **Les liens entrants** : le plus gros levier une fois la technique faite, et le seul que l'IA ne
   peut pas faire à la place du propriétaire (annuaires, forums, YouTube, articles invités).
3. **La technique** : rapide, propre, déclarée aux moteurs (sitemap, IndexNow, hreflang).
4. **La mesure** : Search Console d'abord. Un outil d'analytique (PostHog, etc.) ne fait monter
   aucun site ; il ne sert qu'une fois qu'il y a du trafic à analyser. Le dire franchement quand le
   propriétaire croit le contraire.

## Architecture

- **Registre unique** (`content/pages.ts`) : chemin, titre (50 caractères au plus, le gabarit
  ajoute la marque), h1, description (120 à 160), libellé, résumé, requête visée, dates, pages
  liées, thème, langue, équivalent dans l'autre langue. Il alimente tout le reste. Détails et tests
  dans `references/registre.md`.
- **Une page = une requête principale**, réponse directe dès le premier paragraphe, tableau quand
  on compare, table des matières, FAQ, 3 à 6 liens internes utiles, sources datées en bas.
- **Pages produit par plateforme** (`/for/<plateforme>`) : ce que l'outil fait pour les règles de
  cette plateforme, comparatif daté des concurrents (publicité comparative : critères mesurables,
  prix relevés à une date, jamais « le meilleur »), bouton « Demander à une IA ».
- **Outils gratuits + guide associé** : chaque outil a son guide, chaque guide renvoie à l'outil.
- **Version d'une autre langue** sous `/fr` (ou autre) : traduction adaptée, mêmes faits, mêmes
  sources, angle propre au lecteur local, hreflang réciproque. Souvent moins de concurrence.
- **Signaux IA** (code prêt dans `references/signaux-ia.md`) : robots IA nommés dans robots.txt,
  en-têtes `Link: </llms.txt>; rel="describedby"` et `Content-Signal`, `llms.txt` et `pricing.md`
  générés depuis les sources du site, boutons « Demander à ChatGPT, Claude, Perplexity »,
  IndexNow après chaque mise en ligne, `sameAs` dès que les profils existent.

## Une vague, pas à pas

1. **Choisir 10 à 30 sujets** : requêtes sans page dans Search Console, questions répétées sur les
   forums de la niche, saisie semi-automatique de Google, « Autres questions posées ». Vérifier
   qu'aucune page existante ne couvre déjà la requête.
2. **Écrire le brief commun** dans le scratchpad, à partir de `references/brief-agents.md` (c'est
   l'instance RushPilot de la vague 6 : garder la structure, changer le produit, les modèles de
   pages, les chemins et la liste des nouveaux chemins).
3. **Lancer les agents en parallèle**, 3 à 5 pages chacun (au-delà, ils atteignent leur limite).
   Chacun écrit **seulement** ses `page.tsx`, ne touche ni au registre ni au build, et rend dans
   son rapport ses entrées de registre et la liste des faits corrigés ou retirés.
4. **Coller les entrées** dans le registre (raccourcir les titres à 50 caractères), puis :
   `node scripts/check-pages.cjs . <fichiers>` (tiret cadratin, mots interdits, table des matières
   cohérente, liens internes connus), tests, typecheck, build.
5. **Vérifier en vrai** : chaque nouvelle URL répond 200 sur un serveur de production local
   (`next start` sur un port libre, test sur `127.0.0.1`), pas de débordement à 360 px, pas
   d'erreur JS. Le serveur de dev peut servir un registre périmé sous OneDrive.
6. **Publier** : commit, push, attendre le déploiement, vérifier les URL en ligne, IndexNow.

## Vérification des faits : la règle qui coûte le plus cher

- Tout chiffre ou règle de plateforme vient d'une page officielle, avec sa date (« Last updated »)
  ou « page sans date, lue le JJ mois AAAA ». Centres d'aide qui bloquent les robots : copie
  Wayback datée, ou r.jina.ai, ou Playwright, et le noter.
- **Un agent qui déclare un fait « non sourcé » peut se tromper** : il n'a souvent lu qu'une partie
  des articles. Vérifier soi-même avant de corriger les pages existantes. Sur RushPilot, deux
  « erreurs » signalées étaient bien sourcées dans un autre article du même centre d'aide ; les
  pages avaient été corrigées à tort puis remises.
- Quand deux pages officielles se contredisent, les citer côte à côte avec leurs dates.
- Les corrections confirmées se reportent sur toutes les pages qui portent le fait (`grep`).

## Ce qui revient au propriétaire

Les guides prêts à adapter sont dans `references/` :
- `guide-proprietaire-depart.md` : Search Console (propriété « Domaine », enregistrement TXT que
  l'IA ajoute elle-même si le DNS est chez Vercel : `npx vercel dns add <domaine> @ TXT "<valeur>"`),
  Bing par import depuis Search Console, profils de la marque avec textes et visuels prêts,
  premiers liens (annuaires, communautés) ;
- `guide-proprietaire-routine.md` : 30 minutes par semaine, une vague par mois, prompts à copier,
  ce qu'il ne faut jamais faire, les chiffres à suivre.

Messages à faire passer, parce qu'ils reviennent : le sitemap d'une propriété « Domaine » se
saisit en URL complète ; « Impossible de lire le sitemap » et « connu de Bing mais non indexé »
sont normaux sur un domaine neuf pendant quelques jours ; compter 3 à 6 mois avant de vraies
positions, regarder les impressions avant les clics.

## Interdits

Acheter des liens, publier en masse sans vérification, bourrer de mots-clés, changer l'adresse
d'une page indexée sans redirection 301, faux avis ou faux témoignages en public (directive UE
2019/2161), inventer une URL de profil pour `sameAs`.
