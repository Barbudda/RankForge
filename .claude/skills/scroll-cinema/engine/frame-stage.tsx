"use client";

/**
 * frame-stage.tsx — Moteur scroll-cinéma (Web Strategy de Jonah, Edition 1.0).
 * --------------------------------------------------------------------------
 * Un clip est joué UNE fois, invisible. Chaque frame est capturée
 * (requestVideoFrameCallback → blob WebP → ImageBitmap) puis stockée. Le scroll
 * peint ensuite la bonne frame sur un canvas plein écran : aucun décodage à
 * l'exécution, fluide au refresh-rate.
 *
 * LA RÈGLE : on ne scrube JAMAIS avec video.currentTime (decode-bound = diaporama).
 * On capture d'abord, on peint ensuite.
 *
 * Générique et autonome. Pour un nouveau site : copie ce fichier en
 * components/<name>/frame-stage.tsx et passe-lui la timeline de lib/<name>-assets.ts.
 *
 * Stack : React 18+/Next.js (client component), TypeScript strict, zéro dépendance.
 */

import { useEffect, useRef, useState } from "react";

/** Un segment de la timeline. La progression scroll 0→1 est répartie par `span`. */
export type Segment = {
  /** Source 1080p (mobile, et fallback desktop). */
  url: string;
  /** Master 4K (desktop). Optionnel : à défaut on prend `url`. */
  url4K?: string;
  /** Rejoue les frames de CE clip à l'envers (réassemblage, dézoom). GRATUIT. */
  reverse?: boolean;
  /** Poids relatif de ce segment dans le scroll total (défaut 1). */
  span?: number;
};

export type FrameStageProps = {
  /** La timeline. Les segments dont l'url (résolue) est vide sont IGNORÉS. */
  segments: Segment[];
  /** Hauteur scrollable, en multiples de la hauteur viewport (défaut 6 = 600vh). */
  scrollVh?: number;
  /** Still de secours (poster) tant qu'aucune frame n'est prête / si reduced-motion. */
  poster?: string;
  /** Largeur de capture cible côté mobile (défaut 1080). */
  mobileWidth?: number;
  /** Classe CSS du wrapper sticky (pour le fond, etc.). */
  className?: string;
  children?: React.ReactNode;
};

/* ───────────────────────── IndexedDB (cache des frames) ───────────────────── */

const DB_NAME = "scroll-cinema";
const STORE = "frames";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Lit les blobs WebP cachés pour une url (clé). null si absent. */
async function readCache(key: string): Promise<Blob[] | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      tx.onsuccess = () => resolve((tx.result as Blob[]) ?? null);
      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Écrit les blobs WebP d'une url. Échec silencieux (cache best-effort). */
async function writeCache(key: string, blobs: Blob[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blobs, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* pas de cache, on régénérera à la prochaine visite */
  }
}

/* ──────────────────────── Capture des frames d'un clip ─────────────────────── */

/**
 * Joue un clip une fois (muet, invisible) et capture chaque frame présentée via
 * requestVideoFrameCallback → canvas.toBlob('image/webp'). Retourne les blobs.
 * Le canvas est dimensionné depuis videoWidth/videoHeight à la 1re frame
 * (sinon défaut 300×150 → flou : fix « blurry »).
 */
function captureClip(url: string, targetWidth?: number): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const blobs: Blob[] = [];
    let sized = false;

    const grab = (blob: Blob | null) => {
      if (blob) blobs.push(blob);
    };

    const onFrame = () => {
      if (!sized && video.videoWidth) {
        const scale = targetWidth ? Math.min(1, targetWidth / video.videoWidth) : 1;
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        sized = true;
      }
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(grab, "image/webp", 0.9);
      }
      // @ts-expect-error — rVFC n'est pas encore dans tous les lib.dom
      video.requestVideoFrameCallback(onFrame);
    };

    video.addEventListener("ended", () => {
      // Laisse le dernier toBlob (async) se résoudre avant de rendre la main.
      setTimeout(() => resolve(blobs), 60);
    });
    video.addEventListener("error", () => reject(video.error));

    video.play().then(() => {
      // @ts-expect-error — rVFC
      if (typeof video.requestVideoFrameCallback === "function") {
        // @ts-expect-error — rVFC
        video.requestVideoFrameCallback(onFrame);
      } else {
        // Fallback (Firefox ancien) : échantillonnage timeupdate. Moins fin.
        video.addEventListener("timeupdate", onFrame);
      }
    }).catch(reject);
  });
}

/** Décode une liste de blobs WebP en ImageBitmap peignables instantanément. */
async function decodeFrames(blobs: Blob[]): Promise<ImageBitmap[]> {
  return Promise.all(blobs.map((b) => createImageBitmap(b)));
}

/* ───────────────────────────── Détection device ────────────────────────────── */

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ─────────────────────────────── Composant ─────────────────────────────────── */

type LoadedSegment = { frames: ImageBitmap[]; reverse: boolean; span: number };

export default function FrameStage({
  segments,
  scrollVh = 6,
  poster,
  mobileWidth = 1080,
  className = "",
  children,
}: FrameStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<LoadedSegment[]>([]);
  const totalSpanRef = useRef(0);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  // Charge (capture ou cache) toutes les frames de tous les segments non vides.
  useEffect(() => {
    let cancelled = false;
    const mobile = isMobile();
    const reduce = prefersReducedMotion();

    // Reduced-motion : on n'anime pas, on laisse le poster s'afficher.
    if (reduce) {
      setReady(true);
      return;
    }

    (async () => {
      const loaded: LoadedSegment[] = [];
      for (const seg of segments) {
        const url = mobile ? seg.url : seg.url4K || seg.url;
        if (!url) continue; // slot vide → sauté (build vert à chaque étape)

        let blobs = await readCache(url);
        if (!blobs) {
          blobs = await captureClip(url, mobile ? mobileWidth : undefined);
          void writeCache(url, blobs);
        }
        if (cancelled) return;

        const frames = await decodeFrames(blobs);
        loaded.push({ frames, reverse: !!seg.reverse, span: seg.span ?? 1 });
      }
      if (cancelled) return;
      loadedRef.current = loaded;
      totalSpanRef.current = loaded.reduce((s, l) => s + l.span, 0) || 1;
      setReady(true);
      paint(0);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

  // Peint la frame correspondant à une progression globale 0→1.
  const paint = (p: number) => {
    const canvas = canvasRef.current;
    const loaded = loadedRef.current;
    if (!canvas || loaded.length === 0) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Trouve le segment courant selon les poids span, puis la frame dans ce segment.
    const target = p * totalSpanRef.current;
    let acc = 0;
    let seg = loaded[loaded.length - 1];
    let local = 1;
    for (const l of loaded) {
      if (target <= acc + l.span || l === loaded[loaded.length - 1]) {
        seg = l;
        local = Math.min(1, Math.max(0, (target - acc) / l.span));
        break;
      }
      acc += l.span;
    }

    const n = seg.frames.length;
    if (n === 0) return;
    let idx = Math.round(local * (n - 1));
    if (seg.reverse) idx = n - 1 - idx; // reverse gratuit
    idx = Math.min(n - 1, Math.max(0, idx));

    const bmp = seg.frames[idx];
    // Dimensionne le canvas depuis la 1re frame (jamais 300×150 → fix « blurry »).
    if (canvas.width !== bmp.width || canvas.height !== bmp.height) {
      canvas.width = bmp.width;
      canvas.height = bmp.height;
    }
    ctx.drawImage(bmp, 0, 0);
  };

  // Scroll → progression → peinture (throttle via rAF, jamais de reflow par frame).
  useEffect(() => {
    if (!ready) return;
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        const p = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
        setProgress(p);
        paint(p);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div
      ref={wrapRef}
      style={{ height: `${scrollVh * 100}vh`, position: "relative" }}
      className={className}
    >
      {/* Scène collée plein écran : le canvas peint la frame courante. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Poster de secours sous le canvas (visible tant que rien n'est peint
            et en reduced-motion). */}
        {poster && (
          <img
            src={poster}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: ready ? "block" : "none",
          }}
        />
        {/* Copy éditorial qui flotte par-dessus la scène. */}
        {children && (
          <div style={{ position: "relative", zIndex: 2, height: "100%" }} data-progress={progress}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
