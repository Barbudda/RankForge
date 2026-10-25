---
name: recherche-mots-cles
description: Construire un registre de requêtes cibles sans abonnement SEO - les sources gratuites (Search Console, autocomplétion, « Autres questions posées », recherches associées, Trends, Keyword Planner, forums), la lecture de SERP qui remplace l'indice de difficulté, le classement par intention, et la priorisation par gain attendu. Produit un tableau requête / intention / demande / difficulté / page cible. À utiliser quand on demande « sur quels mots-clés se positionner », avant d'écrire une page ou une vague de contenu, ou pour cadrer le SEO d'un site vitrine, local ou SaaS.
---

# Recherche de mots-clés sans abonnement

Un outil payant estime ce que les sources gratuites **mesurent** ou **montrent**. Ce skill fait le
travail sans unité d'API ; quand le MCP Semrush est disponible, il sert à confirmer et à élargir,
pas à démarrer. Voir `semrush-mcp` pour le pilotage, `metriques-seo` pour la lecture des chiffres.

**Ce qu'on cherche pour chaque requête**, et rien de plus : l'**intention**, la **demande**, la
**difficulté**, la **valeur**. Une requête dont on ignore l'intention ne peut pas recevoir la bonne
page, et c'est la première cause d'échec — avant la concurrence, avant les liens.

## 1. Partir de la matière du client, pas d'un outil

Avant toute recherche, écrire la liste des **termes que le client emploie et que ses clients
emploient** — ils diffèrent presque toujours. Sources, dans l'ordre de valeur :

- ses devis, ses factures, ses pages existantes : le vocabulaire métier exact ;
- **ses échanges clients** (mails, messages, avis Google) : le vocabulaire d'achat réel ;
- ses concurrents locaux : les intitulés de prestations ;
- les avis Google de ses concurrents : ce que les gens reprochent et cherchent.

Un detailer dit « correction de vernis », son client cherche « enlever rayures voiture ». **C'est le
second qui se tape dans Google.** Cette liste brute est la graine de tout le reste.

## 2. Sources gratuites, par ce qu'elles apportent

### Search Console — à faire en premier si le site existe

Elle donne les requêtes **réelles** : impressions, clics, CTR, position moyenne. Trois lectures qui
produisent du travail immédiat :

1. **Requêtes en position 5 à 20** avec des impressions : le site est déjà vu, il manque peu de
   chose. C'est le gisement le moins cher du SEO. Améliorer la page existante avant d'en écrire une.
2. **Requêtes à fortes impressions et CTR faible** : le positionnement est là, le titre et la
   méta-description ne donnent pas envie. Correction en dix minutes.
3. **Requêtes inattendues** : ce que les gens cherchent vraiment et qu'on n'avait pas prévu. Souvent
   une page à créer.

Sans Search Console, la brancher est la première action SEO du projet — avant d'écrire une ligne.

### Autocomplétion Google

Taper la requête racine et relever les suggestions. Puis **l'élargir** : la racine suivie de chaque
lettre de l'alphabet, puis des mots interrogatifs (comment, pourquoi, quel, où, combien, quand),
puis des modificateurs (prix, tarif, avis, meilleur, pas cher, près de moi, + ville).

Ces suggestions sont construites sur des recherches effectives : **elles ne donnent pas de volume
mais elles ne sont jamais inventées**. L'ordre d'apparition est un indice grossier de fréquence.

### « Autres questions posées » et recherches associées

Le bloc de questions en milieu de SERP et les recherches associées en bas de page. Les questions
sont de la matière à FAQ, à sous-titres `h2`, et à citation par les assistants IA — elles portent
la formulation exacte attendue. Dérouler une question en ouvre d'autres.

### Google Trends

Comparaison **relative** entre requêtes, saisonnalité, requêtes en progression. Deux usages
honnêtes : choisir entre deux formulations concurrentes (« detailing » contre « esthétique
automobile » sur la France), et repérer le creux saisonnier pour planifier la publication. Jamais
pour un volume absolu.

### Keyword Planner (gratuit avec un compte Google Ads)

Donne des **fourchettes** de volume et des CPC. Suffisant pour classer les requêtes par ordre de
grandeur, trop vague pour trancher entre deux requêtes proches. Le CPC, lui, est exploitable : il
indique la valeur commerciale (voir `metriques-seo`).

### Forums, Reddit, avis, groupes Facebook locaux

La formulation non filtrée, les objections, les peurs. C'est là qu'on trouve les requêtes longues
qu'aucun outil ne liste parce qu'elles sont trop rares individuellement — et qui, ensemble, font le
trafic d'un site de niche.

### Bing Webmaster Tools

Donne un volume de recherche en plus de ses propres données de performance. À brancher aussi :
**Bing alimente les réponses de ChatGPT**, ce qui en fait un canal à part entière et non un
doublon de Google.

## 3. Lire la SERP — ce qui remplace l'indice de difficulté

Pour chaque requête qui compte, ouvrir la SERP et répondre à six questions. C'est plus lent qu'une
colonne KD, et c'est plus juste, parce que ça intègre ce que le KD ignore : la **forme** du
résultat.

| Question | Ce qu'on en tire |
|---|---|
| Quel **format** occupe le top 10 ? (pages de vente, articles, fiches locales, vidéos, forums) | le format qu'il faut produire. Servir un article là où Google montre des fiches locales est perdu d'avance. |
| Combien d'**agrégateurs** et d'annuaires ? (Pages Jaunes, Yelp, Wikipédia, places de marché) | trois ou plus : la SERP est verrouillée pour un petit site, sauf sur une variante plus précise. |
| Y a-t-il des **forums ou des pages faibles** dans le top 10 ? | oui : SERP pénétrable. Google manque de bonnes réponses, il prendra la nôtre. |
| Y a-t-il un **bloc local** (carte, trois fiches) ? | la bataille se joue sur la fiche d'établissement et les avis, pas sur le site. |
| Y a-t-il un **extrait optimisé** ou un **aperçu IA** ? | le premier clic organique est repoussé ; viser l'extrait (réponse directe en 40-60 mots sous un `h2` interrogatif) plutôt que la position. |
| Les titres contiennent-ils la requête **exacte** ? | non : personne n'a optimisé, l'entrée est facile. Oui partout : terrain travaillé. |

**Deux signaux d'entrée facile** qui ne se voient que sur la SERP : des résultats visiblement
anciens (dates de 3 ans et plus) et des pages qui répondent à côté. Deux signaux d'arrêt : le bloc
local saturé quand on n'a pas d'adresse dans la zone, et une SERP entièrement tenue par des
marques nationales.

## 4. Classer par intention

Trier chaque requête en informationnelle, commerciale, transactionnelle ou locale — **d'après la
SERP, pas d'après l'intuition**. Puis affecter le bon type de page :

- transactionnelle et locale → page de service ou de contact, formulaire court ;
- commerciale → comparatif, page d'offre argumentée, tarifs ;
- informationnelle → guide ou FAQ, qui capte tôt et renvoie vers l'offre.

Un site vitrine local se construit sur le transactionnel et le local ; l'informationnel vient
après, pour l'autorité thématique et la visibilité dans les assistants IA.

## 5. Prioriser

Classer par **gain attendu divisé par effort**, en n'utilisant que ce qu'on a :

```
gain attendu ≈ demande estimée × CTR(position atteignable) × valeur de l'intention
effort       ≈ difficulté lue sur la SERP + écart entre le format exigé et ce qu'on a déjà
```

Dans l'ordre, pour un site neuf ou petit :

1. **Requêtes déjà en position 5-20** (Search Console) — le moins d'effort pour le plus d'effet.
2. **Longue traîne locale et transactionnelle** — faible volume, intention forte, concurrence
   quasi nulle. C'est ce qui fait sonner le téléphone.
3. **Questions** issues du bloc « Autres questions posées » — peu disputées, bonnes pour l'extrait
   optimisé et la citation par les IA.
4. **Requêtes commerciales** du métier — plus disputées, à attaquer quand le site a de l'ancienneté.
5. **Têtes de requêtes génériques** — en dernier, et souvent jamais pour un client vitrine. Une
   agence qui vend « on vous met premier sur *detailing auto* » vend un rêve ; la valeur est dans
   les trois cents requêtes précises en dessous.

## 6. Le livrable

Un seul tableau, qui devient le registre de pages du projet et se branche directement sur
`seo-vagues-sourcees` :

| Requête | Intention | Demande | Difficulté lue | Format exigé | Page cible | Statut |
|---|---|---|---|---|---|---|
| enlever rayures voiture annecy | transactionnelle locale | ~40/mois (Planner) | faible — 1 agrégateur, titres non optimisés | page de service | `/prestations/correction-vernis` | à écrire |

Colonnes à tenir honnêtement : **la source de chaque estimation**, et la **date** de la lecture de
SERP — une SERP se remanie en quelques mois, et une difficulté lue en janvier ne vaut plus rien en
septembre.

## Pièges

- **Confondre volume et opportunité.** Voir `metriques-seo` : volume × CTR × intention, jamais
  volume seul.
- **Viser une requête dont on ne peut pas servir le format.** Un site sans adresse physique ne
  gagnera pas une requête à bloc local.
- **Écrire une page par variante.** « enlever rayures voiture » et « enlever les rayures sur une
  voiture » sont la même intention : une seule page, qui emploie les deux formulations
  naturellement. Deux pages se cannibalisent et aucune ne monte.
- **Cibler des requêtes sans demande du tout.** La longue traîne vaut par son cumul ; une requête
  que personne ne tape ne rapporte rien, même en première position.
- **Oublier de rebrancher.** Trois mois après la mise en ligne, Search Console dit ce qui a marché.
  Le registre se relit à ce moment-là, sinon la recherche était un exercice.
