"use client";

/**
 * Moteur de séquence filmée, version éprouvée.
 *
 * Éprouvé veut dire : il a tourné en production sur Portfolio Hugo
 * (vitrine-premium, octobre 2026), sur deux séquences de 43 et 359 images, et
 * les chiffres cités plus bas ont été mesurés sur cette machine, pas estimés.
 *
 * LA RÈGLE : on ne pilote jamais video.currentTime au défilement. Chercher une
 * position dans un flux compressé dépend du décodeur, et ça se voit : l'image
 * saute comme un diaporama. On joue donc le clip UNE fois, hors écran, on
 * capture chaque image présentée, et c'est ensuite le défilement qui choisit
 * laquelle peindre.
 *
 * Quatre écarts par rapport à `frame-stage.tsx`, qui reste dans ce dossier
 * comme composant de référence mais garde les défauts corrigés ici. Les trois
 * premiers sont des corrections de bugs constatés, le quatrième un choix.
 *
 * 1. Les images capturées ne sont pas toutes gardées décodées. 263 images en
 *    ImageBitmap occupaient plus de 400 Mo de mémoire vive, et 359 images
 *    dépassaient le giga-octet : aucun onglet n'y survit. On garde les images
 *    compressées (quelques dizaines de ko pièce) et on ne décode qu'une
 *    fenêtre glissante autour de la tête de lecture. Mesuré à 5 Mo pour le
 *    même rendu. Voir `docs/RETOURS.md`, retour R8.
 * 2. L'encodage se fait en JPEG, pas en WebP : 18 ms par image contre 108 ms,
 *    mesuré en 1440x810 depuis un canvas hors écran. Sur une séquence préparée
 *    au chargement, c'est 5 s au lieu de 30 s. Retour R7.
 * 3. L'encodage passe par une file séquentielle. Empiler des convertToBlob()
 *    sans ordonnancement rend les images dans l'ordre d'encodage et non dans
 *    celui du film : la séquence se mélange.
 * 4. Rien ici ne touche à l'état React. La peinture se fait depuis la boucle
 *    d'horloge du site, ce qui évite un rendu React par image de défilement.
 *
 * Deux pièges qui ne sont pas dans ce fichier mais qui vont avec :
 *
 * — l'affiche d'une séquence doit être son image zéro. Prise ailleurs, le
 *   fondu entre l'affiche et la toile montre deux positions, et le défaut se
 *   lit comme un flou de basse définition (retour R10) ;
 * — ne pas interpoler les images manquantes avec `minterpolate` de ffmpeg :
 *   il dédouble les sujets sur les plans à forte parallaxe, souvent au début
 *   du plan seulement (retour R11).
 */

const DB_NOM = "scroll-cinema";
const MAGASIN = "sequences";
// À incrémenter dès qu'un clip source change ou que le format de capture
// bouge : les URL, elles, ne bougent pas, donc rien d'autre ne périme le cache.
const VERSION_CACHE = 1;

/* ───────────────────────────── Cache navigateur ──────────────────────────── */

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOM, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(MAGASIN);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function lireCache(cle: string): Promise<Blob[] | null> {
  try {
    const db = await ouvrir();
    return await new Promise((resolve) => {
      const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).get(cle);
      req.onsuccess = () => {
        const v = req.result as Blob[] | undefined;
        resolve(Array.isArray(v) && v.length > 0 ? v : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    // Navigation privée, quota plein, stockage bloqué : on recapturera.
    return null;
  }
}

async function ecrireCache(cle: string, blobs: Blob[]): Promise<void> {
  try {
    const db = await ouvrir();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(MAGASIN, "readwrite");
      tx.objectStore(MAGASIN).put(blobs, cle);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* le cache est un confort, jamais une dépendance */
  }
}

/* ──────────────────────────────── Capture ────────────────────────────────── */

type VideoAvecRVFC = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number) => void) => number;
};

/**
 * JPEG, et pas WebP.
 *
 * Mesuré dans Chrome sur une image de 1440 x 810 : 108 ms en WebP contre 18 ms
 * en JPEG, et la qualité demandée ne change rien à l'écart. Sur les 240 images
 * du second acte, cela fait 26 s d'encodage contre 4 s. Le JPEG pèse deux fois
 * plus en cache, ce qui est sans conséquence : ces images ne transitent jamais
 * par le réseau, elles sont fabriquées puis relues sur la machine.
 */
const FORMAT = "image/jpeg";

type ToileHorsEcran = OffscreenCanvas | HTMLCanvasElement;
type Contexte2d = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type OptionsCapture = {
  largeurMax?: number;
  qualite?: number;
  /**
   * Vitesse de lecture pendant la capture. Le clip est invisible, donc rien
   * n'oblige à le jouer en temps réel : à 2x on attend deux fois moins. Si le
   * navigateur ne présente pas toutes les images à cette vitesse, on en
   * capture simplement moins, et le défilement reste fluide avec un pas plus
   * large. Une image manquante ne se voit pas, dix secondes d'attente si.
   */
  vitesse?: number;
  /** Appelée avec 0→1 pendant la lecture du clip. */
  onProgres?: (p: number) => void;
  signal?: AbortSignal;
};

function toileHorsEcran(l: number, h: number): ToileHorsEcran {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(l, h);
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  return c;
}

function versBlob(toile: ToileHorsEcran, type: string, qualite: number): Promise<Blob> {
  if ("convertToBlob" in toile) return toile.convertToBlob({ type, quality: qualite });
  return new Promise<Blob>((resolve, reject) =>
    toile.toBlob((b) => (b ? resolve(b) : reject(new Error("encodage impossible"))), type, qualite),
  );
}

/**
 * Joue le clip une fois, muet et hors écran, et rend ses images encodées.
 * L'ordre est garanti : chaque image est posée à son index, jamais empilée.
 */
export async function capturerSequence(url: string, options: OptionsCapture = {}): Promise<Blob[]> {
  const { largeurMax, qualite = 0.82, vitesse = 1, onProgres, signal } = options;

  const video = document.createElement("video") as VideoAvecRVFC;
  video.src = url;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.playbackRate = vitesse;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  // iOS refuse de lire une vidéo détachée du document.
  Object.assign(video.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(video);

  const nettoyer = () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }
      video.addEventListener("loadedmetadata", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(video.error ?? new Error("vidéo illisible")), {
        once: true,
      });
    });

    const echelle = largeurMax ? Math.min(1, largeurMax / video.videoWidth) : 1;
    const largeur = Math.round(video.videoWidth * echelle);
    const hauteur = Math.round(video.videoHeight * echelle);
    const duree = video.duration || 1;

    // Deux toiles : l'une reçoit l'image vidéo, l'autre l'encode. La première
    // est vidée par transferToImageBitmap(), qui donne un instantané synchrone.
    // Aucune image ne peut donc être écrasée avant d'avoir été encodée.
    const capture = toileHorsEcran(largeur, hauteur);
    const ctx = capture.getContext("2d", { alpha: false }) as Contexte2d | null;
    const encodeur = toileHorsEcran(largeur, hauteur);
    const ectx = encodeur.getContext("2d", { alpha: false }) as Contexte2d | null;
    if (!ctx || !ectx) throw new Error("contexte 2d indisponible");

    const blobs: Blob[] = [];
    let file: Promise<void> = Promise.resolve();
    let index = 0;

    const encoder = (source: CanvasImageSource, i: number) => {
      file = file.then(async () => {
        ectx.drawImage(source, 0, 0, largeur, hauteur);
        blobs[i] = await versBlob(encodeur, FORMAT, qualite);
        if (source instanceof ImageBitmap) source.close();
      });
    };

    await new Promise<void>((resolve, reject) => {
      const surAbandon = () => {
        video.pause();
        resolve();
      };
      signal?.addEventListener("abort", surAbandon, { once: true });

      const surImage = () => {
        if (signal?.aborted) return;
        ctx.drawImage(video, 0, 0, largeur, hauteur);
        const i = index;
        index += 1;
        if ("transferToImageBitmap" in capture) {
          encoder(capture.transferToImageBitmap(), i);
        } else {
          // Repli sans OffscreenCanvas : on recopie la toile de capture.
          const copie = document.createElement("canvas");
          copie.width = largeur;
          copie.height = hauteur;
          copie.getContext("2d")?.drawImage(capture as HTMLCanvasElement, 0, 0);
          encoder(copie, i);
        }
        onProgres?.(Math.min(1, video.currentTime / duree));
        video.requestVideoFrameCallback?.(surImage);
      };

      video.addEventListener("ended", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(video.error ?? new Error("lecture impossible")), {
        once: true,
      });

      video
        .play()
        .then(() => {
          // Certains navigateurs remettent playbackRate à 1 au démarrage.
          video.playbackRate = vitesse;
          if (typeof video.requestVideoFrameCallback === "function") {
            video.requestVideoFrameCallback(surImage);
          } else {
            // Firefox ancien : pas de rVFC. L'échantillonnage est plus grossier.
            video.addEventListener("timeupdate", surImage);
          }
        })
        .catch(reject);
    });

    await file;
    onProgres?.(1);
    return blobs.filter(Boolean);
  } finally {
    nettoyer();
  }
}

/* ──────────────────────────── Séquence jouable ───────────────────────────── */

export type ChargementSequence = {
  /** 0→1, couvre la capture puis le décodage de la première fenêtre. */
  onProgres?: (p: number) => void;
  signal?: AbortSignal;
};

export class Sequence {
  readonly url: string;
  readonly largeurMax?: number;
  private blobs: Blob[] = [];
  private decodees = new Map<number, ImageBitmap>();
  private recence: number[] = [];
  private enCours = new Set<number>();
  private plafond: number;
  private sens = 1;

  private vitesse: number;

  constructor(
    url: string,
    options: { largeurMax?: number; plafond?: number; vitesse?: number } = {},
  ) {
    this.url = url;
    this.largeurMax = options.largeurMax;
    this.plafond = options.plafond ?? 48;
    this.vitesse = options.vitesse ?? 1;
  }

  get nombre(): number {
    return this.blobs.length;
  }

  get pret(): boolean {
    return this.blobs.length > 0;
  }

  private get cle(): string {
    return `${this.url}@${this.largeurMax ?? "natif"}@v${VERSION_CACHE}`;
  }

  /** Récupère les images : depuis le cache si elles y sont, sinon en capturant. */
  async charger({ onProgres, signal }: ChargementSequence = {}): Promise<void> {
    const cache = await lireCache(this.cle);
    if (cache) {
      this.blobs = cache;
      onProgres?.(0.9);
    } else {
      this.blobs = await capturerSequence(this.url, {
        largeurMax: this.largeurMax,
        vitesse: this.vitesse,
        onProgres: (p) => onProgres?.(p * 0.9),
        signal,
      });
      void ecrireCache(this.cle, this.blobs);
    }
    // On décode d'avance le début pour que la première peinture soit immédiate.
    await this.prechauffer(0, Math.min(12, this.blobs.length));
    onProgres?.(1);
  }

  private noter(i: number) {
    const pos = this.recence.indexOf(i);
    if (pos !== -1) this.recence.splice(pos, 1);
    this.recence.push(i);
  }

  private elaguer() {
    while (this.recence.length > this.plafond) {
      const vieux = this.recence.shift();
      if (vieux === undefined) break;
      this.decodees.get(vieux)?.close();
      this.decodees.delete(vieux);
    }
  }

  private async decoder(i: number): Promise<void> {
    if (this.decodees.has(i) || this.enCours.has(i)) return;
    const blob = this.blobs[i];
    if (!blob) return;
    this.enCours.add(i);
    try {
      const bitmap = await createImageBitmap(blob);
      this.decodees.set(i, bitmap);
      this.noter(i);
      this.elaguer();
    } catch {
      /* image illisible : la peinture retombera sur la plus proche */
    } finally {
      this.enCours.delete(i);
    }
  }

  async prechauffer(depart: number, combien: number): Promise<void> {
    const taches: Promise<void>[] = [];
    for (let k = 0; k < combien; k++) {
      const i = depart + k;
      if (i >= 0 && i < this.blobs.length) taches.push(this.decoder(i));
    }
    await Promise.all(taches);
  }

  /**
   * L'image à peindre pour l'index demandé. Si elle n'est pas encore décodée on
   * rend la plus proche disponible — une image voisine d'un soixantième de
   * seconde vaut mieux qu'un écran noir — et on lance son décodage.
   */
  imagePour(index: number): ImageBitmap | null {
    if (this.blobs.length === 0) return null;
    const i = Math.min(this.blobs.length - 1, Math.max(0, index));

    const exacte = this.decodees.get(i);
    if (exacte) {
      this.noter(i);
      this.alimenter(i);
      return exacte;
    }

    void this.decoder(i);
    this.alimenter(i);

    for (let d = 1; d <= 24; d++) {
      const avant = this.decodees.get(i - d);
      if (avant) return avant;
      const apres = this.decodees.get(i + d);
      if (apres) return apres;
    }
    return null;
  }

  /** Décode en avance dans le sens où va la tête de lecture. */
  private alimenter(i: number) {
    const pas = this.sens >= 0 ? 1 : -1;
    for (let k = 1; k <= 10; k++) {
      const cible = i + pas * k;
      if (cible >= 0 && cible < this.blobs.length) void this.decoder(cible);
    }
    // Deux images derrière soi, pour absorber un rembobinage court.
    for (let k = 1; k <= 2; k++) {
      const cible = i - pas * k;
      if (cible >= 0 && cible < this.blobs.length) void this.decoder(cible);
    }
  }

  noterSens(sens: number) {
    if (sens !== 0) this.sens = Math.sign(sens);
  }

  detruire() {
    for (const bitmap of this.decodees.values()) bitmap.close();
    this.decodees.clear();
    this.recence = [];
    this.blobs = [];
  }
}
