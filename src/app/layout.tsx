import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";
import { DevButton } from "@/components/dev/dev-button";
import { SupportChat } from "@/components/support/support-chat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const APP_URL = config.appUrl;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "RankForge — Automated technical SEO fixes, shipped as pull requests",
    template: "%s · RankForge",
  },
  description:
    "RankForge audits your rendered site and opens small, reviewable pull requests that fix your technical SEO. Built for Next.js, Nuxt, Astro & SvelteKit.",
  keywords: [
    "technical SEO",
    "GitHub",
    "pull requests",
    "Next.js SEO",
    "automated SEO",
    "SEO agent",
  ],
  authors: [{ name: "RankForge" }],
  openGraph: {
    title: "RankForge — Automated technical SEO fixes, shipped as pull requests",
    description:
      "Audits tell you what is broken. RankForge ships the fix as a pull request.",
    // Relative path resolved per-page against metadataBase. Pages override
    // this with their own path (see /pricing) so og:url is never wrong.
    url: "/",
    siteName: "RankForge",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RankForge — Automated technical SEO fixes, shipped as pull requests",
    description:
      "Audits tell you what is broken. RankForge ships the fix as a pull request.",
  },
};

export const viewport: Viewport = {
  themeColor: "#05060b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        {children}
        {/* Dev tooling never ships to production bundles (statically eliminated). */}
        {process.env.NODE_ENV === "development" && <DevButton />}
        <SupportChat />
      </body>
    </html>
  );
}
