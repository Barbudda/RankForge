"use client";

import { useEffect, useState } from "react";

export type GpuTier = "desktop" | "mobile";

export interface WebglCapability {
  /** True only once a probe has run AND the device may run the scene. */
  ready: boolean;
  /** Instance budget tier; null until probed (so nothing mounts during SSR). */
  tier: GpuTier | null;
}

const DENY: WebglCapability = { ready: false, tier: null };

/**
 * Deterministic, client-only capability probe. Default-deny on any
 * uncertainty. The probe runs once after mount; the single state write is
 * deferred to the next frame so it never fires synchronously inside the effect.
 */
export function useCanLaunchWebgl(): WebglCapability {
  const [cap, setCap] = useState<WebglCapability>(DENY);

  useEffect(() => {
    let cancelled = false;
    const result = probeCapability();
    const id = requestAnimationFrame(() => {
      if (!cancelled) setCap(result);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  return cap;
}

function probeCapability(): WebglCapability {
  // 1. Respect reduced-motion: never run, never download the WebGL chunk.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return DENY;

  // 2. Probe a throwaway WebGL2 context.
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return DENY;

  // Dev/demo override: ?forcewebgl=1 skips the software-renderer blocklist AND
  // the network gate (e.g. to preview the scene in a headless/SwiftShader
  // browser, or on a throttled connection).
  if (/[?&]forcewebgl=1/.test(window.location.search)) {
    releaseContext(gl);
    return { ready: true, tier: "desktop" };
  }

  // 3. Poor connection → keep the 2D floor so we never download the three.js
  // chunk + atlas over a starved link. Only the genuinely slow cases trip this
  // (Save-Data on, or 2g/slow-2g); 3g+ still gets the full scene, and the API
  // is Chromium-only so its absence never penalises Firefox/Safari.
  if (networkTooSlow()) {
    releaseContext(gl);
    return DENY;
  }

  // 4. Blocklist software renderers (SwiftShader / llvmpipe / etc.).
  let renderer = "";
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      renderer = String(
        gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "",
      ).toLowerCase();
    }
  } catch {
    // Some browsers gate the extension; fall through to the coarse heuristics.
  }
  if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(renderer)) {
    releaseContext(gl);
    return DENY;
  }

  // 5. Tier from coarse signals.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMem =
    (((navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
      8) as number) <= 4;
  const tier: GpuTier = coarse || lowCore || lowMem ? "mobile" : "desktop";

  releaseContext(gl);
  return { ready: true, tier };
}

function releaseContext(gl: WebGL2RenderingContext) {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

/**
 * True only for genuinely starved links: the user opted into Save-Data, or the
 * effective connection is 2g/slow-2g. 3g and up keep the full scene (the chunk
 * loads lazily on idle anyway). The API is Chromium-only — when it's absent we
 * assume the link is fine rather than downgrade blindly.
 */
function networkTooSlow(): boolean {
  const conn = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "2g" || conn.effectiveType === "slow-2g";
}
