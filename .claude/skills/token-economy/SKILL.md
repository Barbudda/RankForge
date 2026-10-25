---
name: token-economy
description: Économie de tokens du projet. À utiliser pour travailler efficacement (plan mode, /compact, sous-agents, sortie plafonnée) et pour générer/rafraîchir .claude/CODEMAP.md. Invoquer quand le contexte se remplit ou que l'archi change.
---

# Économie de tokens

Le contexte est la ressource rare. Applique :
1. **CODEMAP d'abord** : lis `.claude/CODEMAP.md` ; n'ouvre/grep le repo que si nécessaire.
2. **Plan mode** avant toute tâche multi-fichiers (plan court, puis exécuter).
3. **`/compact`** proactivement ; relance `/context` pour voir où partent les tokens.
4. **Sous-agents** pour l'investigation (contexte isolé) ; ne ramène que la conclusion.
5. **Sortie plafonnée** : plages de lignes précises, jamais de `cat`/logs entiers.
6. **Réponses concises** : pas de récap, pas de code recopié inutilement.

## Rafraîchir la CODEMAP
Quand l'architecture change : relis la structure et mets à jour `.claude/CODEMAP.md`
(chemin → rôle en une ligne) pour que les prochains tours lisent la carte au lieu de scanner.
