/**
 * GLSL + token vocabulary for the full-page WebGL "code chaos → SEO clarity"
 * field.
 *
 * One InstancedMesh of textured SEO-token quads living a single continuous,
 * whole-page-scroll-driven story: a deep 3D chaos cloud (full 3-axis tumble)
 * is sucked into a slowly rotating DOUBLE-HELIX spindle, which then unwinds and
 * flattens onto a clean aligned grid. All three acts are derived in the vertex
 * shader from one `uProgress` uniform — zero per-instance CPU per frame, still
 * 2 draw calls. Tint ramps red/amber → electric ignition → cyan/signal. Colors
 * are the exact globals.css @theme tokens.
 */

export type GlyphTone = 0 | 0.5 | 1; // 0 = broken (red) · 0.5 = structural (amber→cyan) · 1 = resolved (green)

export interface GlyphToken {
  text: string;
  tone: GlyphTone;
}

/** Shared SEO vocabulary — mirrors the 2D field and the chaos-to-clarity section. */
export const TOKENS: GlyphToken[] = [
  { text: "<title> missing", tone: 0 },
  { text: 'alt=""', tone: 0 },
  { text: "canonical: ?", tone: 0.5 },
  { text: "og:image missing", tone: 0.5 },
  { text: "h1 × 3", tone: 0 },
  { text: "schema: missing", tone: 0.5 },
  { text: "sitemap 12/142", tone: 0.5 },
  { text: "noindex?", tone: 0 },
  { text: "robots.txt", tone: 1 },
  { text: "generateMetadata()", tone: 1 },
  { text: "/blog/[slug]", tone: 1 },
  { text: "PR #42 ready", tone: 1 },
];

const HELPERS = `
float easeOutExpo(float x) { return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x); }
// Rodrigues rotation of v around a (unit) axis by angle a.
vec3 rotAxis(vec3 v, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
`;

// Shared block: derive acts from uProgress and compute the instance world
// position (chaos → helix → grid) + the (possibly tumbling) quad corner.
const MORPH = `
  float localP = smoothstep(aStagger, aStagger + 0.55, uProgress);
  float stageA = easeOutExpo(smoothstep(0.16, 0.44, uProgress)); // suck into helix
  float stageB = easeOutExpo(smoothstep(0.44, 0.72, uProgress)); // unwind to grid
  float unwind = smoothstep(0.44, 0.72, uProgress);
  float settled = max(stageA, stageB);

  // Double-helix spindle (the dramatic intermediate formation).
  float taper = 0.55 + 0.45 * aHelixT;
  float R0 = 1.55 * taper;
  float theta = aHelixT * uTurns * 6.2831 + uTime * 0.22 + aStrand * 3.14159;
  float R = mix(R0, 0.0, unwind);
  float Y = (aHelixT - 0.5) * 5.6;
  vec3 helixPos = vec3(R * cos(theta), Y, R * sin(theta));
  helixPos = helixPos * uHelixOn + aChaosPos * (1.0 - uHelixOn);

  vec3 pCH = mix(aChaosPos, helixPos, stageA);
  vec3 ip = mix(pCH, aOrderPos, stageB);

  // Idle drift (calms to stillness) + depth-scaled mouse parallax.
  float idle = (1.0 - localP) * (1.0 - stageA);
  ip.xy += vec2(sin(uTime * 0.6 + aStagger * 6.2831),
                cos(uTime * 0.5 + aStagger * 6.2831)) * 0.05 * idle;
  ip.xy += uMouse * aDepth * 0.18 * (1.0 - uProgress * 0.6);

  // Quad corner: full 3-axis tumble in chaos → flat billboard when settled.
  float s = mix(aChaosScale, 0.16, settled) * uScale;
  vec3 corner = vec3(position.xy * vec2(aAspect, 1.0) * s, 0.0);
  float ang = aSpin * uTime * 1.2 * (1.0 - stageA);
  vec3 tumbled = rotAxis(corner, normalize(aSpinAxis), ang);
  corner = mix(tumbled, corner, settled);
`;

const ATTRS = `
attribute vec3 aChaosPos;
attribute vec3 aOrderPos;
attribute vec3 aSpinAxis;
attribute float aSpin;
attribute float aChaosScale;
attribute float aAspect;
attribute float aStagger;
attribute float aTone;
attribute float aDepth;
attribute float aHelixT;
attribute float aStrand;

uniform float uProgress;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHelixOn;
uniform float uTurns;
`;

export const VERTEX = /* glsl */ `
${ATTRS}
uniform float uScale;
attribute vec2 aUvOffset;
attribute vec2 aUvScale;

varying vec2 vUv;
varying float vStageA;
varying float vStageB;
varying float vTone;
varying float vViewZ;
${HELPERS}

void main() {
  ${MORPH}
  vec4 mv = modelViewMatrix * vec4(ip + corner, 1.0);
  vViewZ = -mv.z;
  vUv = aUvOffset + vec2(uv.x, 1.0 - uv.y) * aUvScale;
  vStageA = stageA;
  vStageB = stageB;
  vTone = aTone;
  gl_Position = projectionMatrix * mv;
}`;

export const FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D uAtlas;
uniform vec3 uColorBad;
uniform vec3 uColorWarn;
uniform vec3 uColorElectric;
uniform vec3 uColorCyan;
uniform vec3 uColorSignal;
uniform vec3 uColorBg;
uniform float uFade;
uniform float uIdle;

varying vec2 vUv;
varying float vStageA;
varying float vStageB;
varying float vTone;
varying float vViewZ;
${HELPERS}

void main() {
  float L = texture2D(uAtlas, vUv).a;
  if (L < 0.004) discard;

  vec3 chaosTint = mix(uColorBad, uColorWarn, step(0.25, vTone));
  vec3 orderTint = mix(uColorCyan, uColorSignal, vTone);
  float tintP = min(1.0, 0.5 * vStageA + vStageB);
  vec3 tint = mix(chaosTint, orderTint, easeOutExpo(tintP));

  // Electric ignition at the helix suck-in crossover.
  float ignite = smoothstep(0.35, 0.5, vStageA) * smoothstep(0.65, 0.5, vStageA);
  tint = mix(tint, uColorElectric, ignite * 0.85);

  // Depth recession into the page background.
  tint = mix(tint, uColorBg, smoothstep(2.5, 6.0, vViewZ));

  gl_FragColor = vec4(tint, L * uFade * uIdle);
}`;

export const HALO_VERTEX = /* glsl */ `
${ATTRS}
uniform float uScale;

varying vec2 vQuad;
varying float vStageA;
varying float vStageB;
varying float vTone;
${HELPERS}

void main() {
  ${MORPH}
  // Halo is a soft glow blob, scaled up around the resolved token.
  vec3 hcorner = corner * 1.7;
  vQuad = position.xy;
  vStageA = stageA;
  vStageB = stageB;
  vTone = aTone;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(ip + hcorner, 1.0);
}`;

export const HALO_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3 uColorCyan;
uniform vec3 uColorSignal;
uniform float uFade;
uniform float uIdle;

varying vec2 vQuad;
varying float vStageA;
varying float vStageB;
varying float vTone;

void main() {
  float d = length(vQuad * vec2(0.7, 1.7));
  float glow = smoothstep(0.5, 0.0, d);
  float resolve = max(vStageA * 0.5, vStageB);
  float a = glow * smoothstep(0.3, 1.0, resolve) * (0.16 + vTone * 0.3) * uFade * uIdle;
  vec3 tint = mix(uColorCyan, uColorSignal, vTone);
  gl_FragColor = vec4(tint, a);
}`;
