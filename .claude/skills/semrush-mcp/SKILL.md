---
name: semrush-mcp
description: Piloter le MCP Semrush sans gaspiller d'unités - les 10 toolkits et 66 rapports, le parcours en trois temps (découverte, schéma, exécution), la grammaire des paramètres (bases régionales, filtres, colonnes), l'algèbre d'ensembles de l'écart de mots-clés, les appels groupés qui remplacent cent appels unitaires, et la lecture des codes d'erreur. À utiliser dès qu'on veut des chiffres Semrush - volume, difficulté, positions, concurrents, liens - ou qu'un rapport renvoie une erreur. Sans abonnement actif, voir `metriques-seo`, `recherche-mots-cles` et `ecart-concurrentiel`, qui font le même travail sans API.
---

# Piloter le MCP Semrush

Serveur officiel en HTTP : `https://mcp.semrush.com/v2/mcp`, authentification OAuth 2.1, aucune clé
à stocker. Installation et variantes d'URL : fiche `semrush` de `core/mcp/servers.json`.

**Chaque ligne de résultat coûte des unités d'API.** Ce skill existe pour qu'une question soit
payée une fois. La règle qui résume tout : *un appel groupé, des colonnes choisies, une limite
basse.*

## Le parcours en trois temps

1. **Découverte** — un outil par toolkit (`keyword_research`, `organic_research`…), sans paramètre.
   Il rend la liste des rapports du toolkit avec, pour chacun, un `name`, une description et
   souvent un `usage` qui dit quand il convient.
2. **Schéma** — `get_report_schema(report)`. Le nom du rapport se copie **tel quel, sans préfixe de
   toolkit** : `geo`, jamais `audience.geo`.
3. **Exécution** — `execute_report(report, params)`.

On saute l'étape 1 et 2 quand on connaît déjà le rapport et ses paramètres : c'est le cas courant
une fois ce skill lu. La table de routage plus bas sert à ça.

## Grammaire des paramètres

Presque tous les rapports partagent la même forme.

| Paramètre | Ce qu'il fait | À savoir |
|---|---|---|
| `database` | base régionale, **obligatoire** sur tout ce qui touche aux mots-clés | `fr`, `be`, `ch`, `ca`, `lu`, `ma`, `sn` pour le francophone ; `mobile-fr` pour le mobile ; suffixe `-ext` sur quelques pays nordiques. 120 codes en tout. |
| `display_limit` | nombre de lignes | défaut 50. **Commencer à 30-50** : chaque ligne coûte des unités et du contexte. |
| `display_offset` | pagination | exige `display_limit`. |
| `display_sort` | tri | `volume_desc`, `keyword_difficulty_asc`, `cpc_desc`… |
| `export_columns` | colonnes rendues | **le levier le plus rentable** : demander 3 colonnes au lieu de 12 allège la réponse d'autant. |
| `display_filter` | filtre serveur | tableau d'objets `{field, operation, sign, value}`. Voir ci-dessous. |
| `display_date` | historique | `YYYY-MM-15` sur les rapports de mots-clés — **toujours le 15 du mois**. |

### Filtrer côté serveur, pas après coup

```json
"display_filter": [
  {"field": "volume",             "operation": "greater_than", "sign": "+", "value": 50},
  {"field": "keyword_difficulty", "operation": "less_than",    "sign": "+", "value": 35},
  {"field": "keyword",            "operation": "contains",     "sign": "-", "value": "gratuit"}
]
```

`sign` vaut `+` pour inclure, `-` pour exclure. Les champs chiffrés acceptent `equals`,
`greater_than`, `less_than` ; les champs texte `equals`, `begins_with`, `ends_with`, `contains`,
`word_match`. Filtrer au serveur coûte moins que rapatrier 500 lignes pour en garder 20.

### Les liens ne prennent pas de `database`

Le graphe de liens est mondial. Les rapports `backlinks_*` prennent `target` + `target_type`
(`root_domain`, `domain` pour un sous-domaine, `url`). Pas de base régionale.

### L'écart de mots-clés est une algèbre d'ensembles

`domain_domains` compare jusqu'à cinq domaines. Son paramètre `domains` est un tableau d'objets
`{sign, type, domain}` où `sign` fait tout le travail :

| `sign` | Sens | Ce qu'on obtient |
|---|---|---|
| `*` | intersection | les requêtes où **tout le monde** est présent — le terrain commun |
| `+` | union | tout ce que l'un ou l'autre couvre |
| `-` | différence | **les requêtes du concurrent où je suis absent : le gisement** |
| `/` | exclusif | ce que lui seul a |

`type` vaut `organic` ou `paid`. Le cas qui sert le plus souvent — ce que le concurrent capte et
que je ne capte pas :

```json
{"report": "domain_domains", "params": {
  "database": "fr", "display_limit": 50, "display_sort": "volume_desc",
  "domains": [
    {"sign": "-", "type": "organic", "domain": "monsite.fr"},
    {"sign": "*", "type": "organic", "domain": "leconcurrent.fr"}
  ],
  "display_filter": [{"field": "volume", "operation": "greater_than", "sign": "+", "value": 30}]
}}
```

## Économie d'unités

- **Grouper les mots-clés.** `phrase_these` prend jusqu'à **100 requêtes séparées par des
  points-virgules** (`"detailing auto;lavage voiture;polish carrosserie"`) et rend volume, CPC,
  densité et nombre de résultats. `phrase_kdi` fait pareil pour la difficulté. Cent appels à
  `phrase_this` pour cent mots-clés, c'est cent fois le prix d'un seul appel groupé.
- **Ne jamais boucler sur les dates.** `resource_rank_history` rend toute la série mensuelle depuis
  2012-2016 **en un appel**. Une boucle mois par mois paie la même donnée trente fois.
- **Choisir le bon toolkit.** `domain_overview` donne des totaux et des rangs ; `organic_research`
  donne la liste des mots-clés. Demander la liste pour en compter les lignes, c'est payer cher un
  nombre que `domain_rank` donne en une ligne.
- **Un seul domaine à la fois sur les liens.** `backlinks_research` analyse un domaine ;
  comparer plusieurs profils passe par `backlinks_comparison` (toolkit concurrence), pas par N
  appels. Ses tableaux `targets` et `target_types` doivent avoir **la même longueur**.

## Table de routage

| La question | Le rapport | Toolkit |
|---|---|---|
| Que vaut cette requête ? (volume, CPC, densité) | `phrase_this`, ou `phrase_these` pour un lot | mots-clés |
| Est-ce que je peux me classer dessus ? | `phrase_kdi` | mots-clés |
| Quoi écrire autour ? | `phrase_related`, `phrase_questions`, `phrase_fullsearch` | mots-clés |
| Qui occupe cette SERP ? | `phrase_organic` | mots-clés |
| Sur quoi ce site se classe-t-il ? | `resource_organic` | organique |
| Quelles pages lui rapportent ? | `resource_organic_unique`, `domain_organic_subdomains` | organique |
| Le site progresse-t-il ? | `resource_rank_history` (série complète) | vue domaine |
| Qui sont mes concurrents réels ? | `domain_organic_organic` | concurrence |
| Que captent-ils que je ne capte pas ? | `domain_domains` (voir l'algèbre) | concurrence |
| Quel est son profil de liens ? | `backlinks_overview` puis `backlinks_refdomains` | liens |
| Ses ancres sont-elles suroptimisées ? | `backlinks_anchors` | liens |
| Comparer les profils de liens de 2-5 sites | `backlinks_comparison` | concurrence |
| Qu'achètent-ils en Ads ? | `resource_adwords`, `resource_adwords_unique` | payant |
| Où en est mon suivi de positions ? | `campaigns` puis `tracking_position_organic` | suivi |
| Quelles erreurs techniques ? | `snapshots` puis `info`, `meta_issues`, `issue_details` | audit |

**Audit de site et suivi de positions exigent un projet Semrush déjà configuré.** On passe
d'abord par `list_projects` (toolkit projets) pour le `project_id`, puis par `campaigns` pour le
`campaign_id` que tout rapport `tracking_*` réclame. Ces deux toolkits ne découvrent rien tout
seuls : ils lisent des campagnes créées dans l'interface Semrush.

## Lire les erreurs

Un appel qui échoue rend un objet JSON, pas du texte. Champs : `code`, `message`, `retryable`,
et selon les cas `hint`, `url`, `trace_id`.

| `code` | Ce que ça veut dire | Quoi faire |
|---|---|---|
| `validation_failed` | paramètres mal formés | relire le schéma ; souvent un tableau attendu là où on a mis une chaîne, ou l'inverse (`phrase` veut des points-virgules, pas un tableau) |
| `no_subscription` | la formule ne couvre pas ce toolkit | ne pas réessayer ; faire le travail autrement |
| `no_api_units` | unités épuisées | ne pas réessayer ; attendre le renouvellement |
| `no_data` | Semrush n'a pas de donnée pour ces paramètres | **ce n'est pas un échec** : c'est la réponse finale. Rien à réessayer, aucun autre rapport à tenter. |
| `rate_limit` | trop d'appels | espacer |
| `internal` | panne côté Semrush | réessayer plus tard, citer `trace_id` au support |

Le `trace_id` et l'`url` se transmettent **verbatim** à Hugo : ce sont ses recours, pas les miens.

## Ce que la formule d'Hugo ne couvre pas

Relevé le 2026-10-23 sur son compte : `traffic_overview` (Traffic Analytics) et
`audience_research` (Audience Analytics) répondent `no_subscription`. Les douze toolkits annoncés
se réduisent donc à **dix utilisables**. Concrètement, pas de données de trafic estimé, de canaux
d'acquisition, de taux de rebond, ni de profil démographique d'audience. Ne pas les proposer comme
livrable, et ne pas rebâtir l'appel « au cas où » : `retryable` vaut `false`.

## Avant de dépenser une unité

Trois questions, dans cet ordre :

1. **La réponse est-elle déjà gratuite ?** Un site qu'Hugo possède a une Search Console : elle
   donne les impressions, les positions et les requêtes **réelles**, pas estimées, pour zéro unité.
   Semrush estime ce que Search Console mesure. Voir `recherche-mots-cles`.
2. **Est-ce que ça change une décision ?** Un chiffre qui ne change ni la page à écrire, ni la
   requête à viser, ni l'ordre des travaux, ne vaut pas son unité.
3. **Peut-on grouper ?** Si la même question revient pour dix mots-clés, c'est un appel, pas dix.

Le catalogue complet des 66 rapports, toolkit par toolkit, est dans
[`references/rapports.md`](references/rapports.md).
