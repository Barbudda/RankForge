# Guide : travailler le référencement de RushPilot, semaine après semaine

Ce guide complète `guide-referencement.md`, qui couvre les 4 étapes de départ : Search Console,
Bing, profils, premiers liens. Ici, c'est la routine pour faire monter le site dans la durée.

---

## 1. Comment ça marche, en 5 lignes

- **Chaque page est une porte d'entrée** : une page = une question que se pose un contributeur
  (« combien de mots-clés sur Adobe Stock ? »). Plus il y a de bonnes pages, plus il y a de portes.
- **Google classe selon trois choses** : la page répond-elle bien à la question (contenu), le site
  inspire-t-il confiance (liens depuis d'autres sites), est-il rapide et propre (technique).
- **La technique est faite** (score 97/100), et le contenu avance par vagues. **Ce qui manque le
  plus, ce sont les liens entrants** : c'est là que ton temps rapporte le plus.
- **Il faut de la patience** : un site neuf met en général 3 à 6 mois à prendre de vraies positions.
  Les premières semaines, regarde les impressions, pas les clics.
- **Les assistants IA** (ChatGPT, Claude, Perplexity) citent les sites clairs, sourcés et bien liés.
  Ce qui marche pour Google marche aussi pour eux.

---

## 2. La routine hebdomadaire (30 minutes, le lundi par exemple)

### a) Search Console : 15 minutes
Ouvre https://search.google.com/search-console, puis **Performances**.

1. Coche **Impressions**, **Clics**, **CTR** et **Position moyenne**. Période : 28 derniers jours.
2. Onglet **Requêtes** : ce que les gens tapent avant de voir le site.
3. Repère trois cas, et note-les :
   - **Position entre 8 et 20** : la page est presque en première page. Demande à Claude de
     l'améliorer pour cette requête (prompt plus bas). C'est le gain le plus rapide.
   - **Beaucoup d'impressions, peu de clics** (CTR sous 1 %) : le titre ou la description donnent
     peu envie. Demande à Claude de les retravailler.
   - **Une requête sans page dédiée** (le site apparaît « par hasard ») : c'est un sujet pour la
     prochaine vague.
4. Menu **Pages** (indexation) : si des pages sont « Explorées, actuellement non indexées » ou en
   erreur, envoie la liste à Claude.

### b) Liens et communautés : 15 minutes
- 2 ou 3 réponses utiles sur MicrostockGroup, Reddit ou un groupe Facebook, chacune avec **un** lien
  vers le guide qui répond à la question (voir la section 5).
- Si une fiche d'annuaire reste à faire, fais-en une.

### c) Console admin : 1 minute
https://rush-pilot.com/admin : nombre d'inscrits de la semaine, et d'où ils viennent (colonne
provenance ou UTM). C'est le seul chiffre qui compte vraiment à la fin.

---

## 3. La routine mensuelle (1 à 2 heures)

### a) Une nouvelle vague de pages
Choisis 10 à 15 sujets. Où les trouver :
- les requêtes sans page dédiée, notées chaque semaine dans Search Console ;
- les questions qui reviennent sur MicrostockGroup et Reddit (« why was my clip rejected for… ») ;
- la saisie semi-automatique de Google : tape « shutterstock video » ou « adobe stock contributor »
  et note les suggestions ;
- le bloc « Autres questions posées » de Google sur tes requêtes principales.

Puis demande à Claude : *« Lance une vague 6 sur ces sujets : … »*. Il écrit les pages, les vérifie,
les met en ligne et les soumet aux moteurs.

### b) La mise à jour des règles des agences
Les agences changent leurs règles sans prévenir. Un guide faux perd la confiance de Google et des
lecteurs. Une fois par mois, demande à Claude : *« Vérifie si les règles des agences ont changé et
mets à jour les pages et le journal des changements. »*

### c) Le contrôle technique
Demande à Claude : *« Fais un audit RankForge et Lighthouse du site et corrige ce qui baisse. »*

### d) Les annuaires et liens restants
Avance la liste de la section 5, au rythme de 2 ou 3 par mois.

---

## 4. Ce que tu peux demander à Claude (prompts prêts à l'emploi)

| Situation | Message à envoyer |
|---|---|
| Une page est en position 8 à 20 | « La page /guides/X est en position 12 sur la requête "Y". Améliore-la pour cette requête. » |
| Beaucoup d'impressions, peu de clics | « La page /guides/X a 2 000 impressions et 5 clics. Retravaille son titre et sa description. » |
| Nouvelle vague | « Lance une vague 6 sur : sujet 1, sujet 2… » |
| Une agence a changé une règle | « Adobe a changé sa limite de mots-clés, mets à jour tout le site. » |
| Traduire en français | « Fais la version française de /guides/X, /guides/Y. » |
| Nouveau profil créé | « Voici mes profils : … Ajoute-les au site. » |
| Pages non indexées | « Search Console dit que ces pages ne sont pas indexées : … Trouve pourquoi. » |
| Bilan | « Fais un bilan SEO : audit, pages les plus vues, ce qu'il faut faire ensuite. » |

---

## 5. Obtenir des liens gratuitement (le plus gros levier)

**Annuaires de logiciels** (une fois chacun) : AlternativeTo, SaaSHub, BetaList, Indie Hackers,
puis Product Hunt le jour de la sortie publique. Les textes à copier sont dans
`guide-referencement.md`.

**Réponses utiles** (chaque semaine) : quand quelqu'un pose une question à laquelle un guide répond,
donne la réponse en deux phrases, puis le lien. Exemple :

> Adobe Stock allows up to 49 keywords on its main help page (50 in its CSV rules), and the first 10
> carry the most weight, so put the subject and place first. I keep a sourced comparison of the
> limits per agency here: https://rush-pilot.com/guides/keyword-limits-by-agency

**Contenus qu'on a envie de citer** : les outils gratuits (vérificateur de fichiers, de mots-clés,
calculateur de revenus), le glossaire, le journal des changements de règles. Ce sont les pages à
proposer quand quelqu'un écrit un article ou une liste de ressources.

**YouTube** : une vidéo de 2 à 4 minutes qui répond à une question (« how many keywords on Adobe
Stock », « why Shutterstock rejected my clip »), avec le lien du guide en description. YouTube est le
deuxième moteur de recherche, et la vidéo est ton domaine.

**Articles invités et partenaires** : blogs de vidéastes, écoles de drone, chaînes YouTube de
contributeurs. Propose un article ou un échange de liens utile, jamais un lien payé. Modèle de
message :

> Hi, I run RushPilot, a site that tracks stock agency rules for video contributors, with sources and
> dates. I noticed your article on selling drone footage. Our page comparing drone rules by agency
> (link) might be useful to your readers. Happy to send you a short guest post on keywording aerial
> clips if that helps.

---

## 6. Ce qu'il ne faut jamais faire

- **Acheter des liens** ou passer par des « services SEO » qui en promettent : Google pénalise.
- **Publier en masse du texte non vérifié** : un fait faux coûte plus qu'une page en moins.
- **Bourrer les pages de mots-clés** : écris pour un vidéaste, pas pour Google.
- **Changer l'adresse d'une page** qui est déjà indexée. Si c'est indispensable, demande à Claude une
  redirection permanente (301).
- **Supprimer une page** qui reçoit des visites.
- **Faux avis ou faux témoignages** : interdits dans l'UE, et destructeurs de confiance.

---

## 7. Les chiffres à suivre

| Indicateur | Où | Ce qui est bon signe |
|---|---|---|
| Impressions | Search Console | Elles montent chaque mois, même sans clics au début |
| Position moyenne | Search Console | Des requêtes qui passent sous 10 |
| Clics | Search Console | Ils suivent les impressions avec 1 à 3 mois de retard |
| Pages indexées | Search Console, Pages | Proche du nombre de pages du site (96 aujourd'hui) |
| Inscrits | Console admin | L'objectif final |
| Liens entrants | Search Console, Liens | Quelques nouveaux sites chaque mois |

**Priorité des langues** : l'anglais d'abord (le marché est mondial), le français ensuite (moins de
concurrence, donc des positions plus faciles).
