# ADR 0002 : un outil déterministe à prix fixe, sans API revendue

- **Date** : 2026-10-27
- **Statut** : acceptée (« je valide », Hugo)
- **Origine** : question d'Hugo : brancher côté Septune une IA (Claude) et Semrush, facturés au client à l'usage avec une marge, ou rester comme aujourd'hui ?

## Contexte

Les clients visés sont des développeurs, des freelances et de petites agences. Ils paient déjà leur assistant (Claude Code, Cursor), et ceux qui veulent Semrush ont leur propre compte. Côté fournisseur, l'API Semrush n'existe qu'en option de la formule Business, ses unités s'achètent par paquets d'au moins 2 millions et expirent chaque mois, et ses données ne peuvent pas être gardées en cache plus d'un mois sans accord écrit. Une IA revendue demanderait de mesurer, plafonner et facturer la consommation de chaque client.

## Décision

Septune reste déterministe et à prix fixe. Il ne revend ni IA ni données tierces. Les outils que le client possède déjà s'utilisent chez lui : l'agent Septune dans l'éditeur combine son audit avec le serveur MCP Semrush du client quand il est branché (skill `/septune:seo`, instructions du serveur MCP).

La performance vient de deux chantiers : rattraper la liste des contrôles d'un audit de site complet (55 règles avant ce chantier, 62 après le lot 1), puis brancher la Google Search Console du client (API gratuite, ses vraies données de clics, d'impressions et d'indexation, page par page).

## Conséquences

- Coût variable par client inchangé (voir ADR 0001), facture prévisible pour le client.
- Pas de mots-clés ni de volumes dans l'app hébergée tant que la Search Console n'est pas branchée.
- À revoir si des clients payants réclament l'IA ou les mots-clés dans l'app : ce serait alors une option à prix fixe avec quota, jamais une facturation à l'usage.
