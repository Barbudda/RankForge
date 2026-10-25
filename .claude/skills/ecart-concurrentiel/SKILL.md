---
name: ecart-concurrentiel
description: Trouver ce que les concurrents captent et qu'on ne capte pas - identifier les vrais concurrents par la SERP (pas par une liste fournie), relever leur arborescence par sitemap.xml et titres, regrouper par thème, comparer au registre de pages, et choisir où attaquer. Inclut les recettes d'algèbre d'ensembles de domain_domains quand le MCP Semrush est disponible. À utiliser quand on demande une analyse de concurrence SEO, un écart de mots-clés, « que font les concurrents », ou qu'on cadre le contenu d'un site vitrine, local ou SaaS.
---

# Écart concurrentiel

Le but n'est pas de copier un concurrent : c'est de voir **quels besoins il sert et qu'on ne sert
pas**, puis de choisir ceux où l'on peut être meilleur. Un écart relevé sans décision est un
tableau mort.

Avec le MCP Semrush, `domain_domains` donne l'écart en un appel (recettes en fin de page). Sans
abonnement, la méthode manuelle ci-dessous donne un résultat moins exhaustif mais **plus
structurel** : elle montre l'architecture du concurrent, pas seulement ses requêtes.

## 1. Les vrais concurrents sont dans la SERP

Ne jamais partir de la liste que donne le client : il nomme ses concurrents **commerciaux**, qui ne
sont pas forcément ses concurrents **de recherche**. Procéder ainsi :

1. Prendre les 10 requêtes les plus importantes du registre (voir `recherche-mots-cles`).
2. Ouvrir chaque SERP et relever les domaines du top 10.
3. Compter les apparitions. **Les 3 à 5 domaines les plus récurrents sont les concurrents réels.**

Puis les trier en trois catégories, parce qu'elles n'appellent pas la même réponse :

| Catégorie | Exemples | Quoi en faire |
|---|---|---|
| **Pairs** | un autre artisan, un autre SaaS de même taille | la cible : ce qu'il a, on peut l'avoir |
| **Agrégateurs** | Pages Jaunes, Yelp, places de marché, comparateurs | on ne les bat pas de front — on y **figure**, et on attaque les variantes précises qu'ils traitent mal |
| **Géants** | Wikipédia, marques nationales, médias | hors jeu sur leurs requêtes ; utile seulement pour comprendre l'intention |

Une erreur classique : compter un agrégateur comme un concurrent et conclure « marché
inaccessible ». Un annuaire occupe la position 1 sur des milliers de requêtes sans servir aucune
intention précise — c'est exactement là qu'une page spécifique gagne.

## 2. Relever l'arborescence d'un pair

Gratuit, rapide, légal : ce sont des pages publiques, et le `sitemap.xml` existe pour être lu.

```bash
# L'inventaire des pages
curl -s https://leconcurrent.fr/robots.txt | grep -i sitemap
curl -s https://leconcurrent.fr/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's/<\/*loc>//g' > concurrent.txt
wc -l < concurrent.txt
```

Un sitemap d'index renvoie vers d'autres sitemaps : les suivre. Si aucun sitemap n'existe, les
liens de la navigation et du pied de page donnent l'essentiel de l'arborescence.

Puis récupérer les titres, qui disent la requête visée par chaque page :

```bash
while read -r u; do
  t=$(curl -sL --max-time 10 "$u" | grep -o -i '<title>[^<]*' | head -1 | sed 's/<title>//I')
  printf '%s\t%s\n' "$t" "$u"
done < concurrent.txt > titres.tsv
```

Rester courtois : une pause entre les requêtes, pas de rafale sur un petit serveur, et on s'arrête
à ce qu'on a besoin de savoir. L'objectif est de comprendre une structure, pas d'aspirer un site.

## 3. Regrouper par thème, pas par page

Le tableau de 300 URL n'apprend rien. Ce qui apprend, c'est le **regroupement** : classer les
titres en thèmes (prestations, zones géographiques, cas clients, guides, comparatifs, tarifs), puis
compter les pages par thème.

Ce comptage révèle la stratégie du concurrent mieux que n'importe quel discours : 40 pages de
villes signifie qu'il joue le maillage géographique ; 60 guides signifient qu'il joue l'autorité
thématique ; 3 pages signifient qu'il ne joue pas le SEO du tout — et que le terrain est libre.

## 4. Croiser avec son propre registre

Mettre côte à côte ses thèmes et les leurs. Quatre cases en sortent, et chacune commande une action
différente :

| Case | Lecture | Action |
|---|---|---|
| **Ils ont, nous pas** | le gisement | arbitrer : est-ce un besoin réel de nos clients, ou leur spécialité à eux ? |
| **Nous avons, eux pas** | notre avantage | le renforcer et le rendre visible ; c'est là qu'on est seul |
| **Les deux** | terrain disputé | ne pas réécrire la même page : être **plus précis**, plus local, ou mieux prouvé |
| **Personne** | angle mort du marché | le plus rentable quand la demande existe — à vérifier dans Search Console et l'autocomplétion |

**Le filtre à appliquer à la case « ils ont, nous pas »** : ne pas tout reprendre. Garder ce qui
réunit trois conditions — le besoin existe chez les clients du projet, on peut faire mieux que la
page existante, et le format est à notre portée. Le reste va dans une liste « plus tard » honnête.

## 5. Choisir où attaquer

Trois angles tiennent contre un concurrent mieux installé :

- **Plus précis.** Il a « detailing auto », on prend « rénovation de phares jaunis ». Moins de
  volume, bien plus de conversion, et aucune concurrence.
- **Plus local.** Il couvre la région, on couvre la ville et les communes voisines, avec des
  preuves locales réelles (chantiers, avis, photos datées) — pas des pages de ville clonées, que
  Google traite comme du contenu dupliqué et que `/bonds audit` relève.
- **Mieux prouvé.** Sa page est générique, la nôtre porte des photos avant/après, un prix, un
  délai, un nom. C'est ce qui fait la différence sur une SERP où toutes les pages se ressemblent —
  et c'est aussi la démarche anti-IA de BONDS.

## Avec le MCP Semrush

Les recettes utiles, dans l'ordre d'emploi. Grammaire complète dans `semrush-mcp`.

**Qui sont mes concurrents organiques réels** — à confronter au relevé de SERP, qui reste la vérité
terrain :

```json
{"report": "domain_organic_organic",
 "params": {"domain": "monsite.fr", "database": "fr", "display_limit": 20}}
```

**Ce qu'un concurrent capte et que je ne capte pas** — le gisement, directement :

```json
{"report": "domain_domains", "params": {
  "database": "fr", "display_limit": 50, "display_sort": "volume_desc",
  "domains": [{"sign": "-", "type": "organic", "domain": "monsite.fr"},
              {"sign": "*", "type": "organic", "domain": "leconcurrent.fr"}],
  "display_filter": [{"field": "volume", "operation": "greater_than", "sign": "+", "value": 30},
                     {"field": "keyword_difficulty", "operation": "less_than", "sign": "+", "value": 40}]
}}
```

Le double filtre est ce qui rend la réponse exploitable : sans lui, on paie 50 lignes dont 40 sont
hors de portée ou sans demande.

**Le terrain commun à plusieurs concurrents** — s'ils couvrent tous une requête, c'est qu'elle
rapporte, et son absence chez nous est un trou :

```json
{"domains": [{"sign": "*", "type": "organic", "domain": "concurrent1.fr"},
             {"sign": "*", "type": "organic", "domain": "concurrent2.fr"},
             {"sign": "-", "type": "organic", "domain": "monsite.fr"}]}
```

**Comparer les profils de liens** avant de décider si l'écart est gagnable par le contenu seul ou
s'il demande des liens. Les deux tableaux doivent avoir **la même longueur** :

```json
{"report": "backlinks_comparison", "params": {
  "targets": ["monsite.fr", "concurrent1.fr", "concurrent2.fr"],
  "target_types": ["root_domain", "root_domain", "root_domain"],
  "export_columns": ["target", "authority_score", "domains_num", "total"]}}
```

Lire `domains_num` avant `total` — voir `metriques-seo`. Si le concurrent a 200 domaines référents
contre nos 8, aucune page ne renversera la requête disputée à court terme : l'énergie va sur la
longue traîne et l'angle précis.

## Pièges

- **Prendre la liste du client pour la liste des concurrents.** Elle décrit son marché, pas la SERP.
- **Compter un agrégateur comme un pair** et renoncer à un marché qui est en fait ouvert.
- **Copier l'arborescence d'un concurrent** sans se demander si ses pages marchent. On ne voit que
  ce qu'il a publié, pas ce qui lui rapporte. Un relevé d'arborescence montre une **intention**, pas
  un résultat.
- **Cloner des pages de ville.** Quarante pages identiques à la ville près ne se classent pas et
  signent le site généré.
- **Livrer le tableau.** L'écart n'est un livrable qu'accompagné de la décision : ce qu'on écrit,
  dans quel ordre, et ce qu'on écarte volontairement.
