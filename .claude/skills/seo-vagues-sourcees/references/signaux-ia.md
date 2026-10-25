# Signaux pour les moteurs et les assistants IA

Code en ligne sur rush-pilot.com (Next.js 16 App Router), repris de la stratégie de FanClaw
(fanclaw.ai). Chaque bloc est indépendant ; adapter les noms, les chemins et les textes.

## 1. robots.txt : robots IA nommés

Certains robots ne lisent que la règle qui les nomme. Les zones privées restent fermées à tous.

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

// Zones privées ou sans intérêt pour un moteur : console, API, pages ouvertes depuis un e-mail.
const PRIVATE = ["/admin", "/api/", "/unsubscribe", "/confirm", "/fr/confirmer", "/fr/desinscription"];

// Robots des moteurs de réponse IA, nommés explicitement (comme FanClaw) : certains ne lisent que la
// règle qui les concerne. Le site veut être lu, cité et appris par les assistants.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

## 2. En-têtes : llms.txt annoncé partout, usage IA autorisé

Dans `next.config.ts`, `headers()` :

```ts
      // Pages publiques : llms.txt annoncé dans chaque réponse, et usage par les moteurs de réponse IA
      // autorisé explicitement (Content-Signal), comme sur FanClaw.
      {
        source: "/((?!admin|api).*)",
        headers: [
          { key: "Link", value: '</llms.txt>; rel="describedby"; type="text/plain"' },
          { key: "Content-Signal", value: "search=yes, ai-input=yes, ai-train=yes" },
        ],
      },
```

## 3. llms.txt : le résumé sourcé du site pour les assistants

Généré depuis le registre des pages (jamais écrit à la main, sinon il vieillit).

```ts
import { PAGES, PAGES_FR, pagesIn } from "@/content/pages";
import { siteUrl } from "@/lib/config";

// llms.txt (format llmstxt.org) : carte du site pour les assistants IA, avec les faits clés
// sourcés qu'ils peuvent citer. Les chiffres viennent des pages officielles des agences
// (mêmes sources que les pages de référence) ; à mettre à jour avec elles.
export const dynamic = "force-static";

const line = (path: string) => {
  const p = [...PAGES, ...PAGES_FR].find((x) => x.path === path)!;
  return `- [${p.h1}](${siteUrl}${p.path}): ${p.description}`;
};

export function GET() {
  const body = `# RushPilot

> RushPilot is a desktop app for stock video contributors, in private beta. It looks at a few frames of each clip, writes the title, description and keywords each agency expects, checks the usual rejection reasons, and uploads to Shutterstock, Adobe Stock and Pond5. This site also publishes free browser tools and references on stock agency rules, each checked against the agency's official pages and dated. RushPilot is not affiliated with Shutterstock, Adobe, Pond5 or Getty Images.

## Key facts (checked against official agency pages, October 2026)

- Clip length: Shutterstock, Adobe Stock and Pond5 accept clips of 5 to 60 seconds. Sources: https://submit.shutterstock.com/help/en/articles/10594637-what-are-the-technical-requirements-for-video and https://helpx.adobe.com/stock/contributor/submit-your-content/submit-videos/technical-requirements-for-video-submissions.html
- Maximum file size: Shutterstock 10 GB (its technical requirements page; an older article on noise still mentions 4 GB); Adobe Stock 3,900 MB; Pond5 3 GB for HD and vertical, 5 GB for 4K to 6K, 6 GB for 8K (Pond5 contributor portal, page without a date, read on 11 October 2026).
- Frame rates: Shutterstock accepts 23.98, 24, 25, 29.97, 30, 48, 50, 59.94 and 60 fps. Adobe Stock accepts the same list without 48 fps. Pond5 adds 47.95 and 47.96 fps to the Shutterstock list.
- Keywords: Shutterstock 7 to 50. Adobe Stock says up to 49 on its titles and keywords page, 50 in its CSV rules and 5 to 50 on its video upload page; 5 to 49 meets all three, and the first 10 keywords carry the most weight. Pond5 allows up to 50, with a minimum of 5 in one section of its metadata page and 7 in another (7 or more meets both), 10 to 50 in a CSV, and 10 to 20 recommended. Sources: https://submit.shutterstock.com/help/en/articles/10617427-content-publishing-standards-contextual-metadata and https://helpx.adobe.com/stock/contributor/content-policies-guidelines/metadata/tips-effective-titles-keywords.html and https://contributor.pond5.com/getting-started/preparing-your-files/
- Titles: Adobe Stock titles are best under 70 characters, and 70 is the maximum in a CSV. Shutterstock descriptions can be up to 2,048 characters in its metadata standards, but the submission editor caps the field at 150, so one sentence under 150 characters is the safe choice. Pond5 titles run 40 to 80 characters, in English.
- Audio: Adobe Stock's video editing page says Adobe does not accept videos with audio, while its do's and don'ts page asks for a model release for each identifiable voice or no audio. Exporting without audio satisfies Shutterstock, Adobe Stock and Pond5.
- AI-generated video: Adobe Stock accepts it when labeled "Created using generative AI". Shutterstock, Pond5 and Getty Images do not accept AI-generated content. Source: https://submit.shutterstock.com/help/en/articles/10594622-content-policy-updates-ai-generated-content
- Video royalties: Adobe Stock pays 35% of the net price for video. Shutterstock pays 15% to 40% by yearly level (levels reset on January 1). Pond5 pays 30% non-exclusive and 40% exclusive. iStock pays 20% per video license to non-exclusive contributors and 25% to 45% to exclusive contributors on istock.com (rate card effective July 1, 2026). Sources: https://helpx.adobe.com/stock/contributor/payments-earnings/royalties-pricing/royalty-rates-assets.html and https://submit.shutterstock.com/payouts and https://contributors.gettyimages.com/article_public.aspx?article_id=5210

## Pricing

RushPilot is paid per clip, from €0.05 to €0.09: monthly plans from €7 for 100 clips a month, or credit packs from €9 for 100 clips, with the first 25 clips free. A clip costs the same whatever its length and covers metadata, checks and upload for Shutterstock, Adobe Stock and Pond5. Details: ${siteUrl}/pricing (machine-readable: ${siteUrl}/pricing.md)

Compared with other tools (published prices read on 11 October 2026): PhotoKeyworder.ai and Stocktag write keywords only, at about €0.07 to €0.10 and $0.04 to $0.12 per video; StockSubmitter manages uploads on Windows, free up to 33 submissions a month per agency, then €4 to €62.50 a month; Xpiks is a metadata editor and uploader at €49 once or €99 a year. Sources: ${siteUrl}/guides/best-stock-footage-keywording-tools

## RushPilot for each agency

${["/for/shutterstock", "/for/adobe-stock", "/for/pond5"].map((p) => line(p)).join("\n")}

## Free tools

${pagesIn("tools", "tool").map((p) => line(p.path)).join("\n")}

## Agency requirements and rules

${pagesIn("requirements").map((p) => line(p.path)).join("\n")}

## Guides

${pagesIn("guides", "guide").map((p) => line(p.path)).join("\n")}

## Pages in French

Written in French for French-speaking contributors, with the same sources as the English pages.

- [RushPilot en français](${siteUrl}/fr): l'application de bureau et sa liste d'attente.
${PAGES_FR.filter((p) => p.kind !== "hub").map((p) => line(p.path)).join("\n")}

## About

- [About RushPilot](${siteUrl}/about): who publishes this site and how agency rules are sourced, dated and corrected.
- [Home](${siteUrl}/): the RushPilot desktop app and its private beta waitlist.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

## 4. pricing.md : les prix en texte brut

Les assistants citent mieux un tableau en Markdown qu'une page de prix en composants. Même source
que la page de tarifs (`lib/pricing.ts`), pour qu'ils ne divergent jamais.

```ts
import { siteUrl } from "@/lib/config";
import { FREE_REGENERATIONS, MONTHLY, PACK_VALIDITY_MONTHS, PACKS, TRIAL_CLIPS, perClip } from "@/lib/pricing";

// Tarifs lisibles par les machines (comme le pricing.md de FanClaw) : un assistant IA qui veut
// citer un prix lit ce fichier plutôt que de deviner. Généré depuis lib/pricing.ts.
export const dynamic = "force-static";

const eur = (n: number) => `€${Number.isInteger(n) ? n : n.toFixed(3).replace(/0+$/, "")}`;
const row = (name: string, clips: number, price: number, monthly: boolean) =>
  `| ${name} | ${clips.toLocaleString("en-US")} | ${eur(price)}${monthly ? " / month" : ""} | ${eur(Math.round(perClip({ id: name, clips, price }) * 1000) / 1000)} |`;

export function GET() {
  const body = `# RushPilot pricing

RushPilot is a desktop app for stock video contributors, in private beta. It writes the title, description and keywords each agency expects from a few frames of each clip, checks the usual rejection reasons, and uploads to Shutterstock, Adobe Stock and Pond5. These are the launch prices, in euros, VAT included for buyers in the European Union.

## How a clip is counted

- One credit = one video clip, whatever its length (five frames are analysed).
- One clip covers metadata, checks and upload for Shutterstock, Adobe Stock and Pond5 together.
- ${FREE_REGENERATIONS} free regenerations of the metadata per clip.
- ${TRIAL_CLIPS} clips free for every new account.

## Monthly plans

Cancel anytime. Unused clips carry over to the next month, once.

| Plan | Clips per month | Price | Per clip |
|---|---|---|---|
${MONTHLY.map((o) => row(o.id[0]!.toUpperCase() + o.id.slice(1), o.clips, o.price, true)).join("\n")}

## Credit packs

No subscription. Credits stay valid for ${PACK_VALIDITY_MONTHS} months.

| Pack | Clips | Price | Per clip |
|---|---|---|---|
${PACKS.map((o) => row({ discovery: "Discovery", regular: "Regular", "pro-pack": "Pro pack" }[o.id] ?? o.id, o.clips, o.price, false)).join("\n")}

## Links

- Pricing page: ${siteUrl}/pricing
- What RushPilot does, with sourced agency rules: ${siteUrl}/llms.txt
`;
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
```

## 5. Boutons « Demander à une IA »

Sur les pages produit : la question préremplie renvoie l'assistant vers llms.txt et pricing.md.
Le visiteur a un avis extérieur ; l'assistant apprend à citer le site.

```tsx
import { siteUrl } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

// Boutons « Demander à une IA » (idée reprise de FanClaw) : la question préremplie renvoie
// l'assistant vers llms.txt et pricing.md, qui décrivent RushPilot avec des faits sourcés.
// Le visiteur obtient un avis extérieur ; l'assistant, lui, apprend à citer le site.

const COPY = {
  en: {
    title: "Ask an AI about RushPilot",
    text: "Get a second opinion. Each link opens the assistant with a question that points it to our sourced summary.",
    prompt: (u: string) =>
      `I sell stock video on Shutterstock, Adobe Stock or Pond5. Read ${u}/llms.txt and ${u}/pricing.md, then tell me what RushPilot does, what it costs and its limits compared with keywording and uploading by hand.`,
  },
  fr: {
    title: "Demandez à une IA ce qu'elle pense de RushPilot",
    text: "Pour un avis extérieur : chaque lien ouvre l'assistant avec une question qui le renvoie vers notre résumé sourcé.",
    prompt: (u: string) =>
      `Je vends des vidéos stock sur Shutterstock, Adobe Stock ou Pond5. Lis ${u}/llms.txt et ${u}/pricing.md, puis explique-moi ce que fait RushPilot, combien il coûte et ses limites par rapport aux mots-clés et à l'envoi faits à la main. Réponds en français.`,
  },
};

const ASSISTANTS = [
  { name: "ChatGPT", url: (q: string) => `https://chatgpt.com/?q=${q}` },
  { name: "Claude", url: (q: string) => `https://claude.ai/new?q=${q}` },
  { name: "Perplexity", url: (q: string) => `https://www.perplexity.ai/search?q=${q}` },
];

export function AskAi({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
  const q = encodeURIComponent(t.prompt(siteUrl));
  return (
    <aside aria-labelledby="ask-ai" className="card p-6 sm:p-7">
      <h2 id="ask-ai" className="font-display text-[22px] text-ink">
        {t.title}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{t.text}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ASSISTANTS.map((a) => (
          <li key={a.name}>
            <a
              href={a.url(q)}
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px] font-semibold text-ink transition-colors hover:border-ink"
            >
              {locale === "fr" ? `Demander à ${a.name}` : `Ask ${a.name}`}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

## 6. IndexNow : prévenir Bing et les autres à chaque mise en ligne

Clé publique par conception, prouvée par un fichier `public/<clé>.txt` contenant la clé.
Lancer après chaque déploiement : `npx tsx scripts/indexnow.ts https://exemple.com`.

```ts
// Prévient les moteurs IndexNow (Bing, Yandex, Seznam, Naver) de toutes les pages du sitemap.
// Usage : npx tsx scripts/indexnow.ts [https://rush-pilot.com]
// La clé est publique par conception : le fichier public/7fb2aff0b673d256aba2248ef8545bac.txt prouve que le site en est le propriétaire.

const KEY = "7fb2aff0b673d256aba2248ef8545bac";
const site = (process.argv[2] ?? "https://rush-pilot.com").replace(/\/$/, "");
const host = new URL(site).host;

const xml = await fetch(`${site}/sitemap.xml`).then((r) => r.text());
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
if (urls.length === 0) throw new Error("Sitemap vide ou inaccessible.");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${site}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow : ${urls.length} adresses envoyées, réponse ${res.status}`);

export {};
```

## 7. Données structurées : `sameAs`

`Organization` en JSON-LD avec `sameAs` vers les profils officiels (X, LinkedIn, YouTube) dès
qu'ils existent : c'est ce qui manquait pour passer GEO de 96 à 100 dans RankForge. Un tableau
vide tant que les profils n'existent pas ; ne jamais inventer d'URL.
