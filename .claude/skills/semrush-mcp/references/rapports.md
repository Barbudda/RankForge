# Catalogue des rapports du MCP Semrush

Relevé par appels de découverte le 2026-10-23. **Lire cette page remplace les appels de
découverte** : ils ne coûtent pas d'unités mais coûtent du contexte et un aller-retour.

Les noms se passent à `get_report_schema` et `execute_report` **tels quels, sans préfixe**.

10 toolkits utilisables, 66 rapports. Deux toolkits supplémentaires existent mais répondent
`no_subscription` sur le compte d'Hugo (voir la fin).

---

## Mots-clés — `keyword_research` (11)

Prend `database`. Tout ce qui part d'une requête plutôt que d'un domaine.

| Rapport | Ce qu'il rend |
|---|---|
| `phrase_this` | résumé d'**un** mot-clé : volume, CPC, densité concurrentielle, nombre de résultats |
| `phrase_these` | le même résumé pour **jusqu'à 100 mots-clés** séparés par `;` — l'appel groupé à privilégier |
| `phrase_all` | le même résumé dans **toutes** les bases régionales d'un coup |
| `phrase_kdi` | indice de difficulté (0-100), jusqu'à 100 mots-clés par appel |
| `phrase_related` | requêtes sémantiquement proches — l'expansion de contenu |
| `phrase_questions` | les questions posées autour du terme — matière à FAQ et à AEO |
| `phrase_fullsearch` | correspondances larges et formulations alternatives |
| `phrase_organic` | les domaines classés sur la requête, avec positions et trafic estimé |
| `phrase_adwords` | les domaines qui achètent la requête en ce moment |
| `phrase_adwords_historical` | qui a enchéri sur la requête sur 12 mois, et à quelle position |

## Vue domaine — `domain_overview` (3)

Des **totaux et des rangs**, jamais la liste des mots-clés.

| Rapport | Ce qu'il rend |
|---|---|
| `domain_rank` | instantané à une date : Semrush Rank, nombre de mots-clés, trafic, coût, dans **une** base |
| `domain_ranks` | le Semrush Rank dans **toutes** les bases régionales |
| `resource_rank_history` | série **mensuelle complète** depuis 2012-2016 — un seul appel, jamais de boucle |

## Organique — `organic_research` (3)

La liste réelle de ce sur quoi un domaine se classe.

| Rapport | Ce qu'il rend |
|---|---|
| `resource_organic` | les mots-clés du top 100 d'un domaine ou d'une URL : position, volume, CPC, trafic |
| `resource_organic_unique` | les pages du domaine présentes dans le top 100, avec leur poids |
| `domain_organic_subdomains` | quels sous-domaines portent le trafic |

## Concurrence — `competitors_research` (9)

| Rapport | Ce qu'il rend |
|---|---|
| `domain_organic_organic` | **qui sont les concurrents organiques réels**, avec score de pertinence et mots-clés partagés |
| `domain_domains` | l'écart de mots-clés sur 2 à 5 domaines (algèbre `*` `+` `-` `/`) |
| `domain_adwords_adwords` | les concurrents en recherche payante |
| `domain_shopping_shopping` | les concurrents en Google Shopping (inutile hors e-commerce) |
| `backlinks_comparison` | comparaison groupée des profils de liens — une ligne par domaine. `targets` et `target_types` de **longueur identique** |
| `backlinks_competitors` | les domaines au profil de liens semblable |
| `backlinks_matrix` | quels domaines référents sont **partagés** entre plusieurs cibles |
| `rank_difference` | les gagnants et perdants du marché sur la période |
| `search_rank` | les domaines leaders en trafic organique d'une base |

## Liens — `backlinks_research` (12)

**Pas de `database`** : le graphe est mondial. Prend `target` + `target_type`
(`root_domain` \| `domain` \| `url`).

| Rapport | Ce qu'il rend |
|---|---|
| `backlinks_overview` | **le point de départ** : total de liens, domaines référents, score d'autorité, variations |
| `backlinks` | la liste détaillée des liens, avec ancres et scores |
| `backlinks_refdomains` | les domaines qui pointent vers la cible |
| `backlinks_anchors` | la distribution des ancres — c'est là qu'on voit la suroptimisation |
| `backlinks_ascore_profile` | répartition des domaines référents par score d'autorité |
| `backlinks_historical` | tendance mensuelle du nombre de liens et de domaines |
| `backlinks_geo` | répartition des référents par pays (d'après l'IP) |
| `backlinks_tld` | répartition par extension |
| `backlinks_refips` | les adresses IP d'origine des liens |
| `backlinks_categories` | les catégories de la cible |
| `backlinks_categories_profile` | les catégories de ses référents — la cohérence thématique du profil |
| `backlinks_pages` | les pages indexées de la cible |

## Payant — `paid_search_research` (3)

Part d'un domaine, jamais d'un mot-clé.

| Rapport | Ce qu'il rend |
|---|---|
| `resource_adwords` | les mots-clés achetés : position, CPC, volume, trafic estimé |
| `resource_adwords_unique` | les annonces uniques : titres, descriptions, pages d'arrivée |
| `domain_adwords_historical` | 12 mois d'historique d'enchères, avec textes d'annonces |

Les textes d'annonces d'un concurrent sont de la **matière rédactionnelle vérifiée** : ce sont des
promesses qu'il paie pour afficher, donc celles qui convertissent chez lui.

## Shopping — `shopping_research` (2)

| Rapport | Ce qu'il rend |
|---|---|
| `domain_shopping` | les requêtes qui déclenchent ses fiches produit, avec prix |
| `domain_shopping_unique` | les annonces produit : titres, URL, prix |

E-commerce seulement ; rend du vide sur tout autre domaine.

## Projets — `projects` (2)

| Rapport | Ce qu'il rend |
|---|---|
| `list_projects` | tous les projets : `id`, nom, domaine, outils activés |
| `get_project` | le détail d'un projet |

**À appeler en premier** pour les deux toolkits suivants, qui exigent un `project_id`.

## Audit de site — `site_audit` (8)

Lit une campagne d'audit **déjà configurée** dans l'interface Semrush. Ne crawle rien à la demande.

Enchaînement : `snapshots` → `info` / `meta_issues` → `page_list` → `page_info` / `issue_details`.

| Rapport | Ce qu'il rend |
|---|---|
| `snapshots` | la liste des instantanés d'audit — fournit les `snapshot_id` |
| `info` | résumé du dernier audit : erreurs, avertissements, notices, pages explorées |
| `snapshot` | score du site, problèmes, nombre de vérifications |
| `meta_issues` | le dictionnaire des problèmes et leurs identifiants — à lire avant `issue_details` |
| `issue_details` | les URL touchées par un problème donné (`issueid` + `snapshot_id`) |
| `page_list` | recherche de pages par URL exacte — fournit les `pageid` |
| `page_info` | le détail technique d'une page |
| `history` | les résultats sur une période |

## Suivi de positions — `position_tracking` (13)

Même principe : campagne préconfigurée. `campaigns` d'abord, son champ `id` alimente tous les
rapports `tracking_*`.

| Rapport | Ce qu'il rend |
|---|---|
| `campaigns` | **à appeler en premier** : les campagnes du projet et leurs identifiants |
| `locations` | recherche de zones par identifiant, type (région, ville, pays, code postal) ou nom |
| `tracking_campaign_dates` | les dates où la campagne a collecté |
| `tracking_position_organic` | toutes les requêtes suivies, les positions, et leurs variations |
| `tracking_overview_organic` | combien de requêtes par tranche de position, gains, pertes, mouvements |
| `tracking_visibility_organic` | la visibilité du domaine et son évolution |
| `tracking_competitors_organic` | les domaines présents sur les mêmes requêtes, position moyenne et visibilité |
| `tracking_landing_pages_organic` | les URL du domaine qui ressortent sur les requêtes suivies |
| `tracking_position_adwords`, `tracking_overview_adwords`, `tracking_visibility_adwords`, `tracking_competitors_adwords`, `tracking_landing_pages_adwords` | les mêmes cinq vues côté payant |

---

## Hors formule

| Toolkit | Ce qu'il aurait donné | Statut au 2026-10-23 |
|---|---|---|
| `traffic_overview` | visites, visiteurs uniques, pages par visite, rebond, durée, canaux d'acquisition, pages d'entrée | `no_subscription` |
| `audience_research` | démographie, intérêts, géographie des visiteurs, recouvrement d'audience | `no_subscription` |

`retryable: false` : ne pas retenter, ne pas contourner. Pour une estimation de trafic sans ces
toolkits, `resource_organic` donne le trafic organique estimé mot-clé par mot-clé — c'est une
autre mesure, plus étroite, mais elle est dans la formule.
