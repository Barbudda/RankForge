# ADR 0001 : la production tourne sans clé Anthropic

- **Date** : 2026-10-26
- **Statut** : acceptée
- **Origine** : question d'Hugo, « y a-t-il un moyen d'éviter de mettre une clé Anthropic ? Sinon, il faut des quotas pour garder un bon bénéfice. »

## Contexte

Trois fonctions savent appeler Claude quand `ANTHROPIC_API_KEY` existe :

- le chatbot de support, un appel par message ;
- l'enrichissement des audits lancés dans l'app, un appel par audit (3 000 tokens de sortie au plus) ;
- les correctifs qui demandent du jugement, trois appels (localiser, patcher, valider : 12 000 tokens de sortie au plus).

Aucune n'est vendue : l'offre payante est le monitoring, entièrement déterministe. Une clé ferait grandir la facture avec l'usage gratuit, sans recette en face. Le 2026-10-26, la production n'a pas de clé : le chatbot y répond en mode `corpus`.

## Décision

Pas de clé Anthropic en production. Le travail de jugement (réécrire un titre, choisir une ancre de lien) se fait chez l'utilisateur : son assistant (Claude Code, Cursor) appelle le serveur MCP de Septune et travaille sur son propre abonnement. Le mode `claude-cli`, qui passerait par l'abonnement du fondateur, reste bloqué hors développement (`src/lib/agents/cli-driver.ts`).

Ce qui tourne sur nos serveurs est borné dans le code : MCP hébergé à 20 crawls par heure et par adresse, chatbot à 30 messages, audits de l'app à 10 par heure et par utilisateur, en plus des bornes existantes de l'audit public, des outils gratuits et du monitoring.

## Conséquences

- Le coût variable d'un client se limite au temps de fonction du monitoring et aux emails d'alerte, bornés par les limites de son plan.
- Le chatbot répond par extraits de la documentation, sans conversation libre.
- Si une clé est posée un jour : fixer d'abord un plafond de dépense dans la Console Claude (au-delà, l'API refuse et le code retombe sur ses réponses déterministes), et réserver ces extras aux plans payants.
- Les limites horaires vivent dans la mémoire de chaque instance : elles freinent un abus, elles ne comptent pas exactement. Le plafond global est le Spend Management de Vercel.
