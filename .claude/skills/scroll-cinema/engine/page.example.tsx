"use client";

/**
 * page.example.tsx — Gabarit de page scroll-cinéma.
 * ------------------------------------------------
 * Copie en app/<name>/page.tsx. Le moteur (FrameStage) tient toute la scène ;
 * le copy éditorial flotte par-dessus, ancré à des beats de scroll.
 *
 * THÈME : échantillonne l'accent sur la lumière clé du footage (champagne pour
 * une voiture mate, titane pour une montre, crimson pour une boisson, volt-green
 * pour une sneaker, or pour un lever de soleil). Centre lumineux, bords assombris
 * pour la nav/le texte. Scrim léger sur les beats de texte pour laisser voir le
 * mouvement derrière le copy.
 */

import FrameStage from "@/components/<name>/frame-stage";
import { TIMELINE, POSTER } from "@/lib/<name>-assets";

const ACCENT = "#e23"; // ← échantillonné sur la lumière clé du footage

export default function Page() {
  return (
    <main className="bg-black text-white overflow-x-hidden">
      {/* Wordmark minimal (collapse en drawer sur mobile). */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between p-6">
        <span className="text-lg font-semibold tracking-tight">&lt;NAME&gt;</span>
        <nav className="hidden md:flex gap-8 text-sm text-white/70">
          <a href="#film">Le film</a>
          <a href="#detail">Détail</a>
          <a href="#order">Commander</a>
        </nav>
      </header>

      {/* La scène scroll-cinéma : un seul objet, verrouillé au scroll. */}
      <FrameStage segments={TIMELINE} poster={POSTER} scrollVh={6}>
        {/* Beats de copy flottants. Positionne-les en % de hauteur de scène. */}
        <section
          id="film"
          className="absolute left-6 md:left-16 top-[15%] max-w-md"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,.6)" }}
        >
          <p
            className="text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: ACCENT }}
          >
            Édition 01
          </p>
          <h1 className="text-5xl md:text-8xl font-semibold leading-[0.95]">
            Le mouvement<br />est le produit.
          </h1>
        </section>

        <section
          id="detail"
          className="absolute right-6 md:right-16 bottom-[20%] max-w-sm text-right"
        >
          <h2 className="text-3xl md:text-5xl font-semibold">Chaque détail tient.</h2>
          <p className="mt-3 text-white/70">
            Rigide, sans déformation — filmé une fois, peint frame par frame.
          </p>
        </section>
      </FrameStage>

      {/* Sections classiques après la scène (specs, CTA, footer). */}
      <section id="order" className="min-h-screen flex items-center justify-center">
        <a
          href="#"
          className="rounded-full px-8 py-4 text-black font-medium"
          style={{ backgroundColor: ACCENT }}
        >
          Commander
        </a>
      </section>
    </main>
  );
}
