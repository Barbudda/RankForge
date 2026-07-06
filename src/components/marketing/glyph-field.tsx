"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import {
  TOKENS,
  VERTEX,
  FRAGMENT,
  HALO_VERTEX,
  HALO_FRAGMENT,
} from "./glyph-field.shaders";
import type { GpuTier } from "@/hooks/use-can-launch-webgl";

/** Deterministic PRNG — no Math.random, identical server/client and across loads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function remap(v: number, a: number, b: number, c: number, d: number) {
  return c + ((v - a) / (b - a)) * (d - c);
}

interface AtlasCell {
  u: number;
  v: number;
  w: number;
  h: number;
  aspect: number;
}

/** Build a glyph atlas from the SEO tokens on a single canvas (client only). */
function buildAtlas(): { texture: THREE.CanvasTexture; cells: AtlasCell[] } {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const mono =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mono")
      .trim() || "ui-monospace, monospace";
  const fontPx = 46;
  const padX = 28;
  const padY = 22;
  const cellH = fontPx + padY * 2;
  const font = `500 ${fontPx}px ${mono}`;

  const cells: AtlasCell[] = [];
  let x = 8;
  let y = 8;

  for (const token of TOKENS) {
    ctx.font = font;
    const textW = Math.ceil(ctx.measureText(token.text).width);
    const cw = textW + padX * 2;
    if (x + cw > W - 8) {
      x = 8;
      y += cellH + 8;
    }

    const r = 14;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x + 2, y + 2, cw - 4, cellH - 4, r);
    } else {
      ctx.rect(x + 2, y + 2, cw - 4, cellH - 4);
    }
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillText(token.text, x + padX, y + cellH / 2 + 1);

    cells.push({
      u: x / W,
      v: y / H,
      w: cw / W,
      h: cellH / H,
      aspect: cw / cellH,
    });
    x += cw + 8;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, cells };
}

/** Deterministic instanced geometry: chaos cloud + grid + helix params. */
function buildGeometry(
  cells: AtlasCell[],
  count: number,
  tier: GpuTier,
): THREE.InstancedBufferGeometry {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute("position", base.attributes.position!);
  geo.setAttribute("uv", base.attributes.uv!);
  geo.instanceCount = count;
  base.dispose();

  const rng = mulberry32(0x5eed);
  const chaosPos = new Float32Array(count * 3);
  const orderPos = new Float32Array(count * 3);
  const spinAxis = new Float32Array(count * 3);
  const spin = new Float32Array(count);
  const chaosScale = new Float32Array(count);
  const aspect = new Float32Array(count);
  const uvOffset = new Float32Array(count * 2);
  const uvScale = new Float32Array(count * 2);
  const stagger = new Float32Array(count);
  const tone = new Float32Array(count);
  const depth = new Float32Array(count);
  const helixT = new Float32Array(count);
  const strand = new Float32Array(count);

  const cols = Math.round(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const colW = tier === "mobile" ? 1.0 : 1.3;
  const rowH = tier === "mobile" ? 0.46 : 0.52;

  for (let i = 0; i < count; i++) {
    const token = TOKENS[i % TOKENS.length]!;
    const cell = cells[i % cells.length]!;

    const cz = -3 + rng() * 5; // [-3, 2]
    chaosPos[i * 3] = (rng() * 2 - 1) * 3.4;
    chaosPos[i * 3 + 1] = (rng() * 2 - 1) * 2.2;
    chaosPos[i * 3 + 2] = cz;

    // Normalized random tumble axis (fallback to +z if degenerate).
    let ax = rng() * 2 - 1;
    let ay = rng() * 2 - 1;
    let az = rng() * 2 - 1;
    const len = Math.hypot(ax, ay, az) || 1;
    if (len < 1e-3) {
      ax = 0;
      ay = 0;
      az = 1;
    }
    spinAxis[i * 3] = ax / len;
    spinAxis[i * 3 + 1] = ay / len;
    spinAxis[i * 3 + 2] = az / len;

    spin[i] = (rng() * 2 - 1) * 0.9;
    chaosScale[i] = 0.18 + rng() * 0.12;
    stagger[i] = rng() * 0.45;
    depth[i] = remap(cz, -3, 2, 1.0, 0.25);
    helixT[i] = (i + 0.5) / count; // even helix arc distribution
    strand[i] = i % 2;

    const col = i % cols;
    const row = Math.floor(i / cols);
    orderPos[i * 3] = (col - (cols - 1) / 2) * colW + (rng() - 0.5) * 0.05;
    orderPos[i * 3 + 1] = ((rows - 1) / 2 - row) * rowH + (rng() - 0.5) * 0.05;
    orderPos[i * 3 + 2] = 0;

    aspect[i] = cell.aspect;
    uvOffset[i * 2] = cell.u;
    uvOffset[i * 2 + 1] = cell.v;
    uvScale[i * 2] = cell.w;
    uvScale[i * 2 + 1] = cell.h;
    tone[i] = token.tone;
  }

  const set = (name: string, arr: Float32Array, size: number) =>
    geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  set("aChaosPos", chaosPos, 3);
  set("aOrderPos", orderPos, 3);
  set("aSpinAxis", spinAxis, 3);
  set("aSpin", spin, 1);
  set("aChaosScale", chaosScale, 1);
  set("aAspect", aspect, 1);
  set("aUvOffset", uvOffset, 2);
  set("aUvScale", uvScale, 2);
  set("aStagger", stagger, 1);
  set("aTone", tone, 1);
  set("aDepth", depth, 1);
  set("aHelixT", helixT, 1);
  set("aStrand", strand, 1);
  return geo;
}

type Uniforms = {
  uProgress: { value: number };
  uTime: { value: number };
  uMouse: { value: THREE.Vector2 };
  uAtlas: { value: THREE.Texture };
  uFade: { value: number };
  uIdle: { value: number };
  uScale: { value: number };
  uHelixOn: { value: number };
  uTurns: { value: number };
  uColorBad: { value: THREE.Color };
  uColorWarn: { value: THREE.Color };
  uColorElectric: { value: THREE.Color };
  uColorCyan: { value: THREE.Color };
  uColorSignal: { value: THREE.Color };
  uColorBg: { value: THREE.Color };
};

function makeUniforms(texture: THREE.Texture, tier: GpuTier): Uniforms {
  return {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uAtlas: { value: texture },
    uFade: { value: 1 },
    uIdle: { value: 1 },
    uScale: { value: 1 },
    uHelixOn: { value: 1 },
    uTurns: { value: tier === "mobile" ? 2 : 3 },
    uColorBad: { value: new THREE.Color("#ff6b81") },
    uColorWarn: { value: new THREE.Color("#ffb454") },
    uColorElectric: { value: new THREE.Color("#4f7bff") },
    uColorCyan: { value: new THREE.Color("#22d3ee") },
    uColorSignal: { value: new THREE.Color("#34e0a1") },
    uColorBg: { value: new THREE.Color("#05060b") },
  };
}

interface SceneObjects {
  geometry: THREE.InstancedBufferGeometry;
  bodyMat: THREE.ShaderMaterial;
  haloMat: THREE.ShaderMaterial;
  texture: THREE.CanvasTexture;
  uniforms: Uniforms;
}

export function GlyphField({
  progress,
  tier,
  active,
  onDegrade,
  scrollClockRef,
  onIdleChange,
}: {
  progress: MotionValue<number>;
  tier: GpuTier;
  /** In viewport range & tab visible — gates whether we request frames. */
  active: boolean;
  onDegrade?: () => void;
  /** Timestamp (performance.now ms) of the last user scroll. */
  scrollClockRef: React.RefObject<number>;
  /** Fired (rarely) when the field crosses the dimmed threshold. */
  onIdleChange?: (dimmed: boolean) => void;
}) {
  const [scene, setScene] = useState<SceneObjects | null>(null);
  const sceneRef = useRef<SceneObjects | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const lastFov = useRef(35);
  const idleVal = useRef(1);
  const idleTargetRef = useRef(1);
  const dimmedRef = useRef(false);
  const frames = useRef(0);
  const slow = useRef(0);
  const degraded = useRef(false);

  // On-demand rendering: request frames on scroll/pointer + a wake to run the
  // idle-dim ramp; the loop self-sustains while animating and coasts to a
  // GPU-idle stop once everything settles (see invalidate() in useFrame).
  useEffect(() => {
    scrollClockRef.current = performance.now();
    if (active) invalidate();
    let wake: ReturnType<typeof setTimeout> | undefined;
    const scheduleWake = () => {
      if (wake) clearTimeout(wake);
      wake = setTimeout(() => invalidate(), 2150);
    };
    const onScroll = () => {
      scrollClockRef.current = performance.now();
      invalidate();
      scheduleWake();
    };
    const onSoft = () => invalidate();
    const unsub = progress.on("change", onSoft);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    if (tier !== "mobile") {
      window.addEventListener("pointermove", onSoft, { passive: true });
    }
    scheduleWake();
    return () => {
      if (wake) clearTimeout(wake);
      unsub();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("pointermove", onSoft);
    };
  }, [active, progress, invalidate, scrollClockRef, tier]);

  useEffect(() => {
    let alive = true;
    const count = tier === "mobile" ? 24 : 60;
    const fontsReady =
      document.fonts?.ready ?? Promise.resolve<unknown>(undefined);

    Promise.race([
      fontsReady,
      new Promise<void>((r) => setTimeout(r, 800)),
    ]).then(() => {
      if (!alive) return;
      const { texture, cells } = buildAtlas();
      const geometry = buildGeometry(cells, count, tier);
      const uniforms = makeUniforms(texture, tier);
      const common = {
        uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      };
      const bodyMat = new THREE.ShaderMaterial({
        ...common,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        blending: THREE.NormalBlending,
      });
      const haloMat = new THREE.ShaderMaterial({
        ...common,
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        blending: THREE.AdditiveBlending,
      });
      const built: SceneObjects = { geometry, bodyMat, haloMat, texture, uniforms };
      sceneRef.current = built;
      setScene(built);
    });

    return () => {
      alive = false;
      const s = sceneRef.current;
      if (s) {
        s.geometry.dispose();
        s.bodyMat.dispose();
        s.haloMat.dispose();
        s.texture.dispose();
      }
      sceneRef.current = null;
    };
  }, [tier]);

  useFrame((state, delta) => {
    const s = sceneRef.current;
    if (!s) return;
    const dt = Math.min(delta, 0.05);
    const u = s.uniforms;

    u.uProgress.value = THREE.MathUtils.damp(
      u.uProgress.value,
      progress.get(),
      6,
      dt,
    );
    u.uTime.value += dt;
    // Density step: full field through the hero + helix acts, recede a touch
    // behind the dense lower copy (kept high so the spindle stays dramatic).
    u.uFade.value = THREE.MathUtils.damp(
      u.uFade.value,
      u.uProgress.value < 0.5 ? 1.0 : 0.72,
      4,
      dt,
    );

    // ── Idle auto-dim ── after 2s without scrolling, fade the field to a faint
    // residual (kept slightly visible, paired with a CSS blur) so copy stays
    // readable; ramp back up over ~2s on the next scroll.
    const idleElapsed = (performance.now() - scrollClockRef.current) / 1000;
    const idleTarget = idleElapsed > 2 ? 0.12 : 1.0;
    idleTargetRef.current = idleTarget;
    const idleDur = idleVal.current < idleTarget ? 2.0 : 1.0; // reappear ~2s / dim ~1s
    const idleStep = dt / idleDur;
    idleVal.current =
      idleVal.current < idleTarget
        ? Math.min(idleTarget, idleVal.current + idleStep)
        : Math.max(idleTarget, idleVal.current - idleStep);
    u.uIdle.value = idleVal.current;
    const nowDimmed = idleVal.current < 0.5;
    if (nowDimmed !== dimmedRef.current) {
      dimmedRef.current = nowDimmed;
      onIdleChange?.(nowDimmed);
    }

    // Halo is invisible during the chaos act — skip its draw call then.
    s.haloMat.visible = u.uProgress.value > 0.3;

    if (tier !== "mobile") {
      const p = state.pointer;
      mouse.current.x += (p.x - mouse.current.x) * 0.05;
      mouse.current.y += (p.y - mouse.current.y) * 0.05;
      u.uMouse.value.copy(mouse.current);
    }

    // ── Scroll-driven cinematic camera (dolly-through + orbit + roll) ──
    const cam = state.camera as THREE.PerspectiveCamera;
    const p = u.uProgress.value;
    const pA = THREE.MathUtils.smoothstep(p, 0.16, 0.44);
    const pB = THREE.MathUtils.smoothstep(p, 0.44, 0.72);

    if (tier === "mobile") {
      const targetZ = 6.2 - 1.8 * pA + 1.2 * pB;
      cam.position.x = THREE.MathUtils.damp(cam.position.x, 0, 5, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, 0, 5, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 5, dt);
      cam.lookAt(0, 0, 0);
    } else {
      const targetZ = 6.2 - 4.2 * pA + 4.0 * pB; // 6.2 → 2.0 → 6.0
      cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 5, dt);

      const bell = 4.0 * pA * (1.0 - pA);
      const targetFov = 35 + 14 * bell * (1.0 - pB);
      cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 5, dt);
      if (Math.abs(cam.fov - lastFov.current) > 0.01) {
        cam.updateProjectionMatrix();
        lastFov.current = cam.fov;
      }

      const decay = 1 - pB;
      const yaw = Math.sin(u.uTime.value * 0.06) * 0.07 * decay;
      const tilt = Math.sin(u.uTime.value * 0.05) * 0.035 * decay;
      cam.position.x = THREE.MathUtils.damp(
        cam.position.x,
        Math.sin(yaw) * targetZ * 0.12 + mouse.current.x * 0.4 * (1 - p * 0.6),
        5,
        dt,
      );
      cam.position.y = THREE.MathUtils.damp(
        cam.position.y,
        Math.sin(tilt) * targetZ * 0.12 + mouse.current.y * 0.25 * (1 - p * 0.6),
        5,
        dt,
      );
      cam.lookAt(0, 0, 0);
      // Roll only during the funnel (applied after lookAt so it survives).
      cam.rotation.z = THREE.MathUtils.damp(
        cam.rotation.z,
        Math.sin(u.uTime.value * 0.3) * 0.05 * pA * (1 - pB),
        5,
        dt,
      );
    }

    // Conservative runtime self-downgrade: only sustained, genuinely janky
    // frame rates (<~24fps) fall back to 2D. A background scene at 25–35fps
    // still reads as fluid, so a "capable but modest" GPU keeps the real 3D —
    // we drop it only when the hardware truly can't keep up.
    // `delta < 0.1` ignores the large gap of an on-demand resume after a pause.
    if (!degraded.current && onDegrade) {
      frames.current += 1;
      slow.current =
        delta > 0.042 && delta < 0.1 ? slow.current + 1 : Math.max(0, slow.current - 1);
      if (frames.current > 45 && slow.current > 30) {
        degraded.current = true;
        onDegrade();
      }
    }

    // Self-sustaining on-demand loop: keep requesting frames only while
    // something is still moving — the helix act (continuous spin), the
    // scroll/damp settle, or the idle-dim ramp. Otherwise the loop coasts to a
    // GPU-idle stop; a scroll/wake re-kicks it via the effect above.
    const pp = u.uProgress.value;
    const inHelix = pp > 0.16 && pp < 0.8;
    const progressSettling = Math.abs(progress.get() - pp) > 0.0006;
    const idleRamping = Math.abs(idleVal.current - idleTargetRef.current) > 0.001;
    if (active && (inHelix || progressSettling || idleRamping)) {
      invalidate();
    }
  });

  if (!scene) return null;

  return (
    <group>
      <mesh
        geometry={scene.geometry}
        material={scene.haloMat}
        renderOrder={0}
        frustumCulled={false}
      />
      <mesh
        geometry={scene.geometry}
        material={scene.bodyMat}
        renderOrder={1}
        frustumCulled={false}
      />
    </group>
  );
}
