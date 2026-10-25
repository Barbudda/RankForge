# Guide : les 4 étapes de référencement que toi seul peux faire

Ordre conseillé : 1, puis 2, puis 3, puis 4 au fil des semaines. Compte environ 1 heure pour les
étapes 1 à 3.

---

## Étape 1 : Google Search Console (10 minutes)

C'est l'étape la plus importante. Elle dit à Google que le site existe et te montre ce qu'il en voit.

1. Va sur https://search.google.com/search-console et connecte-toi avec ton compte Google.
2. Clique sur **Ajouter une propriété** (menu en haut à gauche).
3. Choisis la case de gauche, **Domaine**, tape `rush-pilot.com` (sans https ni www), puis **Continuer**.
4. Google affiche un enregistrement **TXT** qui commence par `google-site-verification=`.
   **Copie-le et envoie-le à Claude.** Ne clique pas encore sur « Valider ».
5. Claude ajoute l'enregistrement dans le DNS de Vercel et te prévient.
6. Reviens sur la fenêtre de Google et clique sur **Valider**. Si ça échoue, attends 10 minutes et
   réessaie : le DNS peut mettre un peu de temps.
7. Dans le menu de gauche, ouvre **Sitemaps**, tape `sitemap.xml` dans le champ, puis **Envoyer**.
8. Facultatif, et utile : dans **Inspection de l'URL**, colle `https://rush-pilot.com/`, puis clique
   sur **Demander l'indexation**. Fais de même pour `/fr` et `/pricing`. Google limite le nombre de
   demandes par jour.

Ensuite, regarde **Performances** une fois par semaine : quelles recherches font apparaître le site,
et à quelle position.

---

## Étape 2 : Bing Webmaster Tools (5 minutes)

Bing alimente aussi Copilot et une partie des résultats de DuckDuckGo.

1. Va sur https://www.bing.com/webmasters et connecte-toi (compte Microsoft ou Google).
2. Choisis **Importer depuis Google Search Console**. Ça ne marche qu'une fois l'étape 1 terminée.
3. Autorise l'accès, coche `rush-pilot.com`, puis **Importer**. Le sitemap est repris automatiquement.

C'est tout : le site prévient déjà Bing de chaque page par IndexNow.

---

## Étape 3 : les profils de la marque (30 minutes)

Les moteurs et les assistants IA relient un site à ses profils officiels. Quand c'est fait,
**envoie les liens à Claude** : il les ajoute au code (`sameAs`).

**Visuels prêts à télécharger** (clic droit, « Enregistrer l'image sous ») :
- photo de profil : https://rush-pilot.com/brand/avatar.png
- bannière : https://rush-pilot.com/brand/banner.png

**Textes à copier :**
- Nom : `RushPilot`
- Bio courte (X, 154 caractères) :
  `Desktop app for stock video contributors: AI titles, keywords and rejection checks, then upload to Shutterstock, Adobe Stock and Pond5. Free guides below.`
- Description longue (LinkedIn, YouTube) :
  `RushPilot is a desktop app for stock video contributors. It writes titles, descriptions and keywords from a few frames of each clip, checks rejection reasons and uploads to Shutterstock, Adobe Stock and Pond5. Free tools and sourced guides at https://rush-pilot.com`
- Site web : `https://rush-pilot.com`

**Les comptes à créer, dans cet ordre :**

1. **X (Twitter).** Crée un compte sur https://x.com avec une adresse e-mail dédiée. Choisis un
   identifiant comme `@rushpilot` ou `@rushpilotapp`, selon ce qui est libre. Mets la photo, la
   bannière, la bio courte et le site.
2. **LinkedIn, page entreprise.** Il faut d'abord ton profil personnel LinkedIn. Ensuite, menu
   **Pour les entreprises**, puis **Créer une page entreprise**, puis **Entreprise**. Nom
   `RushPilot`, URL `linkedin.com/company/rushpilot` si elle est libre. Ajoute le logo, la
   description longue et le site.
3. **YouTube.** Sur https://youtube.com, clique sur ta photo, puis **Créer une chaîne**, et donne-lui
   le nom `RushPilot` (une chaîne de marque, distincte de ta chaîne perso). Ajoute la photo, la
   bannière, la description et le lien vers le site. Plus tard, des tutoriels courts (« how to keyword
   stock footage ») y attireront du monde : YouTube est le deuxième moteur de recherche.

Garde les identifiants de ces comptes dans un gestionnaire de mots de passe.

---

## Étape 4 : obtenir des liens vers le site (au fil des semaines)

Les liens depuis d'autres sites sont ce qui fait le plus monter un site sur Google. Personne ne peut
les automatiser. Règle d'or : partager des **guides utiles**, pas de la publicité.

**Annuaires de logiciels** (une fiche chacun, avec les textes de l'étape 3) :
- **AlternativeTo** (alternativeto.net) : ajoute RushPilot comme alternative à Xpiks et à
  StockSubmitter.
- **SaaSHub** (saashub.com) : même principe.
- **BetaList** (betalist.com) : fait pour les produits en bêta. Vérifie s'il y a une file d'attente
  gratuite avant de payer quoi que ce soit.
- **Indie Hackers** (indiehackers.com) : une fiche produit, puis un post qui raconte la création de
  RushPilot.
- **Product Hunt** : à garder pour le jour de la sortie publique. On ne lance qu'une fois.

**Communautés de contributeurs** (réponds aux questions et donne le lien du guide qui y répond) :
- **Forum MicrostockGroup** (microstockgroup.com), le forum de référence des contributeurs ;
- **Reddit** : r/stockfootage, r/stockphotography, r/microstock. Lis les règles de chaque
  communauté ; la plupart refusent l'autopromotion directe ;
- **Groupes Facebook** de contributeurs stock, en anglais et en français.

**Exemples de réponses qui marchent** : quelqu'un demande combien de mots-clés mettre sur Adobe, tu
réponds avec le chiffre et tu donnes le lien vers
`https://rush-pilot.com/guides/keyword-limits-by-agency`. Quelqu'un a un clip refusé, tu donnes le lien
de la page des refus. Un lien utile par réponse, pas plus.

**Rythme conseillé** : 2 ou 3 annuaires la première semaine, puis 2 ou 3 réponses utiles par semaine
dans les communautés.

---

## Ce que Claude fait de son côté

- Ajoute l'enregistrement DNS de Google dès que tu lui envoies le texte de l'étape 1.
- Branche les profils dans le code dès que tu lui envoies les liens de l'étape 3.
- Soumet chaque nouvelle page à Bing et aux autres moteurs (IndexNow) à chaque mise en ligne.
- Continue d'écrire des pages : chaque guide est une porte d'entrée de plus depuis Google.
