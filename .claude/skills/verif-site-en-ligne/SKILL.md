---
name: verif-site-en-ligne
description: Vérifier un site réellement en production — parcourir toutes les pages, détecter les liens morts et les invariants de référencement cassés (titres et descriptions trop longs, canoniques divergentes, h1 manquants ou multiples, images sans alt), puis prévenir les moteurs d'une publication via IndexNow. À utiliser après chaque mise en ligne, et obligatoirement le jour où un nom de domaine est branché. Deux scripts Node sans dépendance. Né de Terouva (octobre 2026).
---

# Vérifier un site en ligne

Deux scripts qui interrogent le site **tel qu'il est servi**, pas tel qu'il est écrit. C'est la
différence qui compte : une configuration correcte et une page correcte sont deux choses, et c'est
toujours la seconde que les moteurs lisent.

Complète `seo-technique`, qui donne la méthode d'audit. Ici, ce sont des outils qui tournent et qui
rendent un verdict en quelques secondes.

## Quand l'invoquer

- **Après chaque mise en ligne.** Le parcours prend dix secondes et attrape les liens morts.
- **Le jour où un domaine est branché.** C'est le moment où tout se casse silencieusement.
- **Avant de déclarer un site fini.** Un titre coupé dans les résultats de recherche est un défaut
  de livraison, pas un détail.

## `parcourir.mjs` — le parcours et les invariants

```bash
node scripts/parcourir.mjs https://exemple.com
```

Part de la racine, suit chaque lien interne, et vérifie sur chaque page indexable :

| Contrôle | Seuil | Pourquoi |
|---|---|---|
| Code HTTP | < 400 | lien mort |
| `<title>` | présent, ≤ 70 signes | au-delà, coupé dans les résultats |
| `meta description` | présente, 70 à 165 signes | trop courte elle n'argumente pas, trop longue elle est coupée |
| `rel=canonical` | présente et cohérente | une canonique qui pointe ailleurs annule la page |
| `<h1>` | exactement un | structure du document |
| `<img>` | `alt` présent | accessibilité |

Les pages marquées `noindex` sont ignorées pour les contrôles de référencement, mais leur code HTTP
est vérifié.

**Ce qu'il a trouvé en vrai, sur un site qu'on croyait propre :** sept défauts d'un coup — des
titres jusqu'à 93 signes, des descriptions jusqu'à 190. Et, le jour du branchement d'un domaine, le
défaut le plus coûteux de tous : des pages servies sur le nouveau domaine mais déclarant encore
l'ancienne adresse comme canonique.

**Un faux positif connu** : si on parcourt une adresse locale alors que le site calcule ses
canoniques depuis une variable de production, toutes les canoniques sont signalées comme
divergentes. C'est normal. Le parcours qui fait foi est celui de la production.

## `indexnow.mjs` — prévenir les moteurs

```bash
node scripts/indexnow.mjs                       # toutes les adresses du plan du site
node scripts/indexnow.mjs https://exemple.com/x # une page précise
```

IndexNow est un protocole ouvert accepté par Bing, Yandex, Seznam et Naver. **Google n'y participe
pas** : pour lui, il faut la Search Console. Le gain est donc partiel, mais gratuit et immédiat.

Mise en place, une fois : déposer un fichier `<clé>.txt` à la racine publique du site, contenant la
clé elle-même (32 caractères hexadécimaux). Le script la retrouve seul.

```bash
node -e "const c=require('crypto').randomBytes(16).toString('hex');require('fs').writeFileSync('public/'+c+'.txt',c);console.log(c)"
```

## Ce que ces scripts ne font pas

Ils ne mesurent ni la performance ni l'accessibilité — c'est Lighthouse, et il ment parfois sur la
première mesure après une mise en ligne (retour R40). Ils ne jugent pas la qualité d'un contenu.
Et ils ne remplacent pas la Search Console, qui seule dit ce que Google a réellement indexé.

## Rappels de terrain

- Un domaine branché sans reprise des canoniques ne reçoit rien (retour R35).
- La Search Console veut l'**adresse complète** du plan du site sur une propriété « Domaine », et
  refuse toute URL hors du préfixe exact d'une propriété (retour R36).
- « Impossible de récupérer » sur un plan du site fraîchement soumis est normal : vérifier une fois
  que Googlebot reçoit 200, puis attendre 48 h (retour R37).
- Les cibles tactiles ne sont contrôlées par aucun outil automatique : les mesurer à part
  (retour R49).
