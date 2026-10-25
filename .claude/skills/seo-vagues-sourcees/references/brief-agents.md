# Brief commun : vague 6 (EN) et vague 5 FR, RushPilot

Projet : C:\Users\hugo8\OneDrive\Desktop\RushPilot (Next.js 16 App Router, Windows, OneDrive).
RushPilot = app de bureau en bêta privée pour contributeurs de vidéo stock (titres, mots-clés IA,
contrôle des motifs de refus, envoi vers Shutterstock, Adobe Stock, Pond5). Site anglais d'abord,
version française sous /fr. Aujourd'hui : 12 octobre 2026.

## Ce que tu fais
Tu écris UNIQUEMENT les fichiers `page.tsx` de tes pages. Tu ne modifies AUCUN autre fichier
(surtout pas content/pages.ts, ni composants, ni lib). Pas de `npm run build`, pas de `tsc`, pas de
serveur de dev, ne touche pas aux processus sur les ports 3000/3100/54322 : je fais le build et le
typecheck moi-même à la fin. Pas de git.

## Modèle à suivre (lis-les AVANT d'écrire)
- Pages anglaises : `app/(site)/guides/stock-footage-review-time/page.tsx`,
  `app/(site)/guides/adobe-stock-vs-pond5/page.tsx`, page produit `app/(site)/for/pond5/page.tsx`.
- Pages françaises : `app/(fr)/fr/guides/prores-ou-h264/page.tsx` (traduction d'une page EN, mêmes
  faits et mêmes sources, libellés de sources traduits), `app/(fr)/fr/tarifs/page.tsx` si besoin.
- Composants : `components/content/article-layout.tsx`, `components/content/blocks.tsx`,
  `components/content/fr.tsx`, `components/content/ask-ai.tsx` (regarde s'il gère le français).
- Registre : `content/pages.ts` (lis le type PageEntry et quelques entrées EN vague 5 et FR vague 4).
- `const PATH = "..."; export const metadata = pageMetadata(PATH);` comme les modèles.

## Règles de contenu (bloquantes)
- **Chaque fait chiffré ou règle d'agence est sourcé** dans SOURCES (url, date `updated` de la page
  si elle en a une, sinon `note` « Page without a date, read on 12 October 2026. » / « Page sans
  date, lue le 12 octobre 2026. »). Vérifie toi-même les pages officielles (WebFetch/WebSearch ; si
  un centre d'aide bloque, copie Wayback datée, comme dans les modèles). Si tu ne peux pas vérifier un
  fait, ne l'écris pas. Aucun chiffre inventé, aucun témoignage, aucune statistique de RushPilot.
- RushPilot est en **bêta privée** : ne promets aucune fonction absente des pages /for existantes.
- **Interdits** : tiret cadratin « — » (utilise virgule, deux-points, parenthèses) ; emojis ;
  la tournure « it's not X, it's Y » / « ce n'est pas X, c'est Y » ; mots : delve, landscape,
  navigate, unlock, elevate, seamless, robust, crucial, game-changer, leverage, empower, streamline,
  comprehensive, ultimate, cutting-edge, « in conclusion », « it's worth noting », « whether you're »,
  « let's dive ». En français, pas de tics IA (« Plongeons », « En somme », « Il est important de
  noter », « véritable », « incontournable », « n'hésitez pas »).
- Ton : précis, concret, phrases courtes, vouvoiement en français. Réponse directe à la question dès
  le premier paragraphe. 900 à 1 600 mots de texte par page, avec au moins un tableau (DataTable)
  quand la comparaison s'y prête, une table des matières (`toc`) dont chaque id correspond à un
  `<section id="...">`, une FAQ si les modèles en ont une.
- **Liens internes** (`<Link href>`) : seulement vers des chemins qui existent dans content/pages.ts
  ou dans la liste des NOUVEAUX chemins ci-dessous. Pages françaises : lie vers les pages françaises
  (/fr/...) quand elles existent, sinon vers l'anglais. 3 à 6 liens internes utiles par page.
- Commentaires de code en français, brefs (le pourquoi), comme les modèles.

## Nouveaux chemins de cette vague (tu peux y faire des liens)
Français (traductions de la vague 5 ; `alternate` = page anglaise entre parenthèses) :
- /fr/pour/shutterstock (/for/shutterstock)
- /fr/pour/adobe-stock (/for/adobe-stock)
- /fr/pour/pond5 (/for/pond5)
- /fr/guides/comment-vendre-des-videos-stock (/guides/how-to-sell-stock-footage)
- /fr/guides/video-stock-rentable (/guides/is-selling-stock-footage-worth-it)
- /fr/guides/vendre-videos-smartphone (/guides/sell-stock-footage-from-phone)
- /fr/guides/filmer-pour-la-video-stock (/guides/how-to-shoot-stock-footage)
- /fr/guides/video-stock-4k-ou-hd (/guides/stock-footage-4k-or-hd)
- /fr/guides/noms-de-fichiers-video-stock (/guides/stock-footage-file-names)
- /fr/guides/delai-de-validation-video-stock (/guides/stock-footage-review-time)
- /fr/guides/categories-video-shutterstock (/guides/shutterstock-video-categories)
- /fr/guides/categories-adobe-stock (/guides/adobe-stock-categories)
- /fr/guides/adobe-stock-ou-pond5 (/guides/adobe-stock-vs-pond5)
- /fr/guides/istock-ou-shutterstock (/guides/istock-vs-shutterstock)
- /fr/guides/licences-entrainement-ia-video-stock (/guides/stock-footage-ai-training-licenses)
- /fr/guides/exemples-mots-cles-video-stock (/guides/stock-footage-keyword-examples)
- /fr/guides/glossaire-video-stock (/guides/stock-footage-glossary)

Anglais (vague 6, nouvelles pages) :
- /guides/become-a-shutterstock-contributor
- /guides/become-an-adobe-stock-contributor
- /guides/sell-footage-on-storyblocks
- /guides/shutterstock-payouts
- /guides/adobe-stock-payouts
- /guides/stock-footage-clip-length
- /guides/color-grading-stock-footage
- /guides/property-releases-stock-video
- /guides/filming-landmarks-for-stock
- /guides/exclusive-vs-non-exclusive-stock-footage
- /guides/pond5-pricing
- /guides/how-many-clips-to-make-money

## Traductions françaises
Traduis et adapte la page anglaise (lis-la en entier) : mêmes faits, mêmes sources (libellés
traduits, dates conservées), mêmes tableaux. Pas de mot-à-mot : formulation naturelle pour un
vidéaste français, unités et formats français (12 octobre 2026, 1 000, 0,05 €). Garde un angle
propre au lecteur français quand il existe déjà dans d'autres pages FR (fiscalité, mots-clés en
anglais obligatoires). Si la page anglaise contient un fait qui te semble faux ou périmé, vérifie à
la source ; si tu le corriges, signale-le dans ton rapport.

## Ton rapport final (obligatoire, c'est tout ce que je reçois)
1. Liste des fichiers écrits.
2. Pour CHAQUE page, l'entrée de registre prête à coller, au format exact de content/pages.ts :
   ```ts
   {
     path: "...",
     section: "guides",          // "company" pour /fr/pour/*
     kind: "guide",
     topic: "...",               // start | production | metadata | upload | rights | compare | tools (pas pour /fr/pour/*)
     locale: "fr",               // pages françaises seulement
     alternate: "...",           // pages françaises seulement
     title: "...",               // ~60 caractères, sans la marque
     h1: "...",
     description: "...",         // 140 à 160 caractères
     label: "...",
     summary: "...",
     query: "...",
     published: W6,              // W6 pour l'anglais, FR5 pour le français (je définis ces constantes)
     updated: W6,
     related: ["...", "...", "..."], // 3 chemins existants ou de cette vague, même langue de préférence
   },
   ```
3. Faits corrigés par rapport à la page anglaise, et faits que tu n'as pas pu vérifier (retirés).
