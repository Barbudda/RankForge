---
name: metriques-seo
description: Ce que veut dire chaque métrique SEO et comment la lire sans se tromper - volume, CPC, densité concurrentielle, difficulté (KD), intention, score d'autorité, domaines référents, ancres, visibilité, CTR par position. Chaque entrée dit ce que la métrique mesure vraiment, son ordre de grandeur utile, et le contresens classique. À utiliser dès qu'on lit un export Semrush, Ahrefs, Search Console ou Keyword Planner, qu'on hésite à viser une requête, ou qu'on doit expliquer un chiffre à un client.
---

# Lire les métriques SEO

Les chiffres SEO se ressemblent et ne mesurent pas la même chose. Ce skill sert à ne pas confondre
une densité d'annonceurs avec une difficulté de référencement, ni un volume avec du trafic.

**Le principe qui gouverne tout** : la plupart de ces métriques sont des **estimations relatives
propres à l'outil qui les publie**. Un KD de 42 chez Semrush et un KD de 42 chez Ahrefs ne sont
pas la même chose. On les compare entre elles au sein d'un même export, jamais d'un outil à
l'autre, et jamais comme une vérité absolue.

## Côté requête

### `volume` — recherches mensuelles

Moyenne des douze derniers mois, pour **un pays et une langue donnés**. Donc :

- une requête saisonnière (« cadeau Noël ») affiche une moyenne qui n'existe aucun mois réel ;
- le volume d'une base `fr` ne dit rien du Québec ou de la Belgique — ce sont les bases `ca` et `be` ;
- **le volume n'est pas du trafic.** Une requête à 100 recherches où l'on est premier rapporte plus
  qu'une requête à 10 000 où l'on est quarantième.

Ordre de grandeur en local francophone : une requête métier + ville (« detailing auto Annecy »)
tourne souvent entre 10 et 150 recherches par mois. C'est **normal et c'est bon** : l'intention y
est forte et la concurrence quasi nulle. Ne pas juger ces requêtes à l'aune des volumes nationaux.

### CTR par position — le facteur qui convertit volume en visites

| Position | Part de clics observée |
|---|---|
| 1 | ~27-30 % |
| 2 | ~15 % |
| 3 | ~10 % |
| 4-5 | ~5-7 % |
| 6-10 | ~2-3 % |
| au-delà de 10 | marginal |

Ces ordres de grandeur se dégradent quand la SERP porte un extrait optimisé, un bloc local, des
annonces ou un aperçu IA : la première position organique peut alors être le quatrième élément vu.
Un trafic estimé se calcule `volume × CTR(position)`, et toute estimation qui ignore la forme de la
SERP est optimiste.

### `cpc` — coût par clic

Ce qu'un annonceur accepte de payer pour ce clic. **C'est le meilleur indicateur gratuit de valeur
commerciale d'une requête** : personne ne paie 4 € le clic pour une curiosité. Un CPC élevé sur un
volume faible signale une requête d'achat — exactement ce qu'un site vitrine veut capter.

Un CPC nul ou absent signifie « aucun annonceur », pas « aucune valeur » : c'est fréquent sur les
requêtes informationnelles et sur le très local.

### `competitive_density` — densité concurrentielle, de 0 à 1

**Le contresens le plus courant du métier.** Cette métrique mesure la densité d'**annonceurs
payants** sur la requête. Elle ne dit rien de la difficulté à se classer en organique. Une requête
peut afficher 1.00 et être facile en SEO, ou 0.00 et être verrouillée par Wikipédia et trois
agrégateurs.

Pour la difficulté organique, c'est `keyword_difficulty`, ou la lecture de la SERP.

### `keyword_difficulty` (KD) — de 0 à 100

Estimation de l'effort pour entrer dans le top 10, dérivée surtout de la force des liens des pages
déjà classées. Grille de lecture praticable pour un site jeune ou petit :

| KD | Lecture |
|---|---|
| 0-15 | accessible rapidement, même sans liens |
| 15-30 | accessible avec une page sérieuse et un minimum d'ancienneté |
| 30-50 | demande un contenu meilleur que l'existant et quelques liens |
| 50-70 | chantier de plusieurs mois |
| 70+ | hors de portée sans budget liens — ne pas viser pour un client vitrine |

Le KD **ignore l'intention et la forme de la SERP**. Une requête à KD 20 dont la SERP est remplie
de fiches Google Business ne se gagne pas avec un article : elle se gagne avec une fiche
d'établissement. Le KD ne le dit pas.

### `intent` — intention

| Intention | Ce que la personne veut | Ce qu'on lui sert |
|---|---|---|
| informationnelle | comprendre | un guide, une FAQ, une page de fond |
| navigationnelle | atteindre une marque précise | rien à gagner, sauf si la marque est le client |
| commerciale | comparer avant d'acheter | un comparatif, une page d'offre argumentée |
| transactionnelle | acheter ou contacter maintenant | une page de conversion, un formulaire court |

L'intention se **lit sur la SERP** plutôt qu'elle ne se devine : Google y a déjà tranché. Si le top
10 n'est composé que de pages de vente, c'est une requête transactionnelle, quoi qu'en dise une
colonne d'export. Servir le mauvais format est la première cause de page qui ne se classe pas
malgré un bon contenu.

### `results` — nombre de résultats Google

Quasi inutile comme critère. Un milliard de résultats ne rend pas une requête difficile. À ignorer
dans une priorisation.

### `trend` — tendance

Douze valeurs mensuelles normalisées entre 0 et 1. Sert à repérer la saisonnalité et le déclin
structurel, pas à estimer un volume. Une tendance qui s'effondre sur douze mois sur une requête
métier est un signal : le vocabulaire du marché a peut-être changé.

## Côté domaine et liens

### `authority_score` — score d'autorité, de 0 à 100

Composite propriétaire : force du profil de liens, trafic organique estimé, signaux de naturalité.
**Logarithmique** : passer de 10 à 20 est bien plus facile que de 60 à 70. S'utilise en
**comparaison** — « mon prospect de lien est à 35, mes référents actuels sont à 12 » — jamais comme
une note à atteindre.

### `domains_num` contre `total` — la seule lecture qui compte

`total` compte les liens, `domains_num` compte les **domaines distincts** qui en sont la source.
C'est le second qui pèse :

> 10 000 liens venant de 3 domaines valent moins que 300 liens venant de 200 domaines.

Un rapport entre les deux très élevé (des milliers de liens pour une poignée de domaines) trahit
un lien de pied de page répliqué sur tout un site, un annuaire, ou un réseau artificiel.

### `follows_num`, `nofollows_num`, `sponsored_num`, `ugc_backlinks`

Un profil **entièrement** en `follow` est anormal : un site qui se fait citer naturellement récolte
des `nofollow` au passage (réseaux sociaux, presse, forums). L'absence totale de `nofollow` est un
indice de liens fabriqués. Les `sponsored` et `ugc` sont déclarés comme tels et ne transmettent
pas d'autorité.

### `referring_ips_class_c`

Nombre de classes d'adresses IP distinctes. Beaucoup de domaines référents pour très peu de
classes C = les sites sont hébergés ensemble = réseau de liens. Signal de risque sur un profil
qu'on hérite d'un client, et raison de ne pas acheter ce genre de lien.

### Ancres

La distribution des ancres doit ressembler à du langage humain : le nom de la marque, l'URL nue,
« ici », « ce site », et quelques ancres descriptives. Une majorité d'ancres exactement égales à la
requête visée est le signe le plus lisible d'une suroptimisation — et c'est aussi ce qu'un
concurrent peut voir chez nous.

### `visibility` — visibilité

Part de visibilité sur un panier de requêtes suivies, pondérée par le CTR de chaque position. C'est
la bonne métrique de progression d'un chantier SEO : elle bouge quand les positions bougent, même
sans changement de trafic mesurable, et elle ne dépend pas de la saison.

## Les sources gratuites, et ce qu'elles valent

| Source | Ce qu'elle donne | Fiabilité |
|---|---|---|
| **Search Console** | requêtes, impressions, clics, CTR, position moyenne **réels** du site | mesuré, pas estimé — la référence |
| Bing Webmaster Tools | les mêmes, côté Bing, plus un volume de recherche | mesuré ; Bing alimente aussi ChatGPT |
| Google Keyword Planner | volumes **en fourchettes** larges, CPC | correct sur l'ordre de grandeur, vague sur la valeur |
| Google Trends | évolutions **relatives**, comparaison entre requêtes | fiable en tendance, muet en absolu |
| Autocomplétion et « Autres questions posées » | les formulations réelles des gens | qualitatif, sans volume, mais c'est du vrai langage |
| Semrush / Ahrefs | volume, KD, liens, concurrence | estimations modélisées, à usage comparatif |

**Search Console gagne contre tous les outils payants** sur un site qu'on possède : elle mesure au
lieu d'estimer. Un outil payant ne sert que pour ce qu'elle ne peut pas voir — les requêtes des
concurrents, et celles où le site n'apparaît pas encore du tout.

## Résumé des contresens

| On lit | On en conclut à tort | La vérité |
|---|---|---|
| `competitive_density` à 0.9 | « difficile à référencer » | difficile **à acheter** ; le SEO peut être facile |
| volume à 20 000 | « belle opportunité » | sans regarder le KD ni la SERP, c'est un leurre |
| volume à 30 | « négligeable » | en local, c'est souvent la requête qui fait sonner le téléphone |
| `results` à 500 millions | « marché saturé » | ne veut rien dire |
| 50 000 liens | « domaine puissant » | regarder `domains_num` d'abord |
| KD à 18 | « facile » | si la SERP est faite de fiches locales, un article ne passera jamais |
| CPC à 0 | « sans valeur » | fréquent sur l'informationnel et le très local |
| autorité à 45 | « bon » | comparé à quoi ? la métrique n'a de sens qu'en relatif |
