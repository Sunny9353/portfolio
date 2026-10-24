/**
 * Typographic portrait: GLSL.
 *
 * Layer 1 (default)  : the portrait rebuilt out of serif glyphs, chosen per cell from a
 *                      density-ordered atlas using a pre-tone-mapped luminance map.
 * Layer 2 (cursor)   : the original RGB photo, shown through a LIQUID glitch cloud driven by a
 *                      fluid simulation (see lib/liquidField.ts): it trails, pools and flows.
 *
 * The cloud has no shape and no outline:
 *   - there is no mask edge and no ring. A "density" falls off softly with distance from the
 *     cursor, and each fragment (blocks at three sizes + horizontal streaks) is switched on or
 *     off by a hash that is re-rolled ~14x a second, so the silhouette is different every frame,
 *   - each colour channel is evaluated at its own offset, so fragments fringe red / blue,
 *   - revealed fragments are individually displaced, torn, mixed with static snow and scanlines,
 *     and the odd frame inverts.
 *
 * Output is premultiplied alpha so the transparent area around the subject stays transparent.
 */

export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D u_image;      // original RGBA portrait
uniform sampler2D u_lum;        // tone-mapped luminance (rgb) + alpha
uniform sampler2D u_font;       // glyph strip, sparse -> dense
uniform sampler2D u_field;      // liquid glitch density (r), from the CPU fluid simulation
uniform vec2  u_resolution;     // drawing buffer, px
uniform vec2  u_cell;           // glyph cell size, buffer px
uniform float u_glyphCount;
uniform float u_lod;            // mip level that averages one cell
uniform vec2  u_mouse;          // buffer px, origin bottom-left
uniform float u_radius;         // cloud core radius, buffer px (0 = closed)
uniform float u_edge;           // fragment scale, buffer px
uniform float u_time;
uniform float u_vel;            // 0..1 cursor speed
uniform float u_glitch;         // master glitch strength
varying vec2 vUv;

// sin-free hashes (stable precision on mobile GPUs)
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 1 where a fragment of the glitch cloud is switched on at point p, 0 elsewhere.
// No distance threshold is used anywhere, only a soft probability, so there is no edge.
float cloud(vec2 p, float tqv, float G) {
  float dens = texture2D(u_field, p / u_resolution).r;      // liquid density from the simulation
  dens = pow(dens, 0.9) * clamp(0.75 + 0.4 * G, 0.0, 1.5);

  float v = 0.0;
  for (int i = 0; i < 3; i++) {                       // blocks at three sizes
    float fi = float(i);
    float bs = max(u_edge * (0.45 + fi * 0.85 + fi * fi * 0.3), 2.0);
    vec2  b  = floor(p / bs);
    float stable = step(0.45, hash21(b + vec2(fi * 13.0, 77.0)));     // ~55% of blocks hold longer
    float tb = mix(tqv, floor(tqv / 4.0), stable);                    // others flicker at full rate
    float h  = hash21(b + vec2(fi * 31.0, tb));
    v = max(v, step(h, dens * (1.12 - 0.08 * fi)));
  }

  float row = floor(p.y / (u_cell.y * 0.55));         // horizontal streaks: runs of random length
  float len = u_radius * (0.35 + hash21(vec2(row, tqv + 17.0)) * 1.2);
  float run = floor((p.x + hash21(vec2(row, tqv + 23.0)) * len) / len);
  float on  = step(0.7, hash21(vec2(row, tqv + 5.0))) * step(hash21(vec2(run, row + tqv)), dens * 1.5);
  v = max(v, on);
  return v;
}

void main() {
  vec2 frag = vUv * u_resolution;
  float tq  = floor(u_time * 14.0);     // fast stutter clock
  float tq2 = floor(u_time * 5.0);      // slower clock for bursts

  // ---------- layer 1: typographic portrait ----------
  vec2 cell = floor(frag / u_cell);
  vec2 loc  = fract(frag / u_cell);
  vec2 cuv  = (cell + 0.5) * u_cell / u_resolution;
  vec4 lm   = textureLod(u_lum, cuv, u_lod);
  float L   = clamp(lm.r + (vnoise(cell * 0.09 + u_time * 0.25) - 0.5) * 0.05, 0.0, 1.0);
  L = clamp((L - 0.05) / 0.88, 0.0, 1.0);
  L = mix(L, smoothstep(0.0, 1.0, L), 0.5);
  L = pow(L, 0.78);
  float gi  = floor(min(L, 0.999) * u_glyphCount);
  float cov = texture2D(u_font, vec2((gi + loc.x) / u_glyphCount, loc.y)).r;
  vec3  glyphCol = vec3(min(cov * 1.5, 1.0)) * mix(0.8, 1.0, L);
  float glyphA   = lm.a;

  // ---------- glitch strength: base + random bursts ----------
  // smooth, film-like envelope: random windows with a soft attack and a long decay, plus a slow breath
  float wv    = u_time * 2.0;
  float wi    = floor(wv);
  float wf    = fract(wv);
  float envOn = step(0.74, hash21(vec2(wi, 7.0)));
  float env   = envOn * smoothstep(0.0, 0.12, wf) * (1.0 - smoothstep(0.35, 1.0, wf));
  float breathe = 0.5 + 0.5 * vnoise(vec2(u_time * 0.9, 3.0));
  float G = u_glitch * (0.78 + 0.32 * breathe + 0.85 * env) * (0.85 + 0.5 * u_vel);

  // ---------- the liquid cloud, in colour ----------
  // One main cloud plus two ghost clouds at random offsets. Each ghost owns different colour
  // channels, so where it pokes out beyond the main cloud it shows as a red or a cyan fringe,
  // exactly like a real chromatic-aberration glitch.
  vec2 chroma = vec2(hash21(vec2(tq, 1.0)) - 0.5, hash21(vec2(tq, 2.0)) - 0.5) * u_edge * 3.0 * G;
  float vA   = cloud(frag, tq, G);
  float vRed = cloud(frag + chroma, tq + 1.0, G) * 0.6;
  float vCy  = cloud(frag - chroma, tq + 2.0, G) * 0.6;
  vec3  m3   = vec3(max(vA, vRed), max(vA, vCy), max(vA, vCy));   // R <- red ghost, G+B <- cyan ghost
  float inner = max(vA, max(vRed, vCy));

  // ---------- inside the fragments: disturbed photo ----------
  // Disturbance (shift, tear, RGB split, colour blocks, static, scanlines, cells flipping back to
  // glyphs) is strong in the outskirts of the cloud and gentle at its centre, so the part under
  // the cursor stays readable while the cloud as a whole stays noisy.
  vec2  dv    = frag - u_mouse;
  float dHere = texture2D(u_field, vUv).r;
  float core  = smoothstep(0.45, 0.95, dHere);                    // dense liquid -> calmer, readable photo
  float Dst   = mix(1.0, 0.3, core) * clamp(G, 0.0, 1.6);

  float row   = floor(frag.y / (u_cell.y * 0.55));
  float tearOn = step(0.5, hash21(vec2(row, tq + 11.0)));
  float tear   = (hash21(vec2(row, tq)) - 0.5) * 2.0 * tearOn;
  vec2  bm    = floor(frag / max(u_edge * 1.3, 2.0));                      // per-fragment id
  vec2  shift = (vec2(hash21(bm + tq), hash21(bm + tq + 9.0)) - 0.5) * u_edge * 1.6;
  vec2  off   = (vec2(tear * u_edge * 1.8, 0.0) + shift) * Dst / u_resolution * inner;
  off.x += sin(frag.y * 0.045 + u_time * 5.0) * u_edge * 0.7 * Dst / u_resolution.x * inner;   // signal wobble

  // real RGB channel separation of the photo itself
  vec2  dir   = dv / max(length(dv), 1.0);
  vec2  split = dir * u_edge * (0.6 + 0.8 * hash21(vec2(tq, 9.0))) * Dst / u_resolution * inner;
  vec2  uvS   = vUv + off;
  vec4  mid = texture2D(u_image, uvS);
  float rC  = texture2D(u_image, uvS + split).r;
  float bC  = texture2D(u_image, uvS - split).b;
  vec3  orig = vec3(rC, mid.g, bC);

  // colour flashes on random blocks: the same blue / red / cyan as the "AI" glitch
  float pick   = hash21(bm + tq + 3.0);
  float tintOn = step(0.9, hash21(bm + tq + 41.0)) * inner * step(0.3, Dst);
  vec3  tint   = pick < 0.34 ? vec3(0.17, 0.18, 1.0) : (pick < 0.67 ? vec3(1.0, 0.11, 0.18) : vec3(0.07, 0.91, 1.0));
  orig = mix(orig, min(orig * tint * 1.8, vec3(1.0)), tintOn * 0.9);

  // coloured static and scanlines
  float snow = hash21(frag + tq * 17.0);
  float sp = hash21(frag + tq * 17.0 + 7.0);
  vec3  snowC = snow * (sp < 0.34 ? vec3(0.17, 0.18, 1.0) : (sp < 0.67 ? vec3(1.0, 0.11, 0.18) : vec3(0.07, 0.91, 1.0)));
  orig = mix(orig, snowC, 0.10 * inner * Dst);
  orig *= 1.0 - 0.24 * step(0.5, fract(frag.y * 0.5)) * inner * Dst;

  // some cells keep flipping back to glyphs
  float cr = hash21(cell + tq);
  m3 = mix(m3, m3 * step(cr, 0.86), clamp(0.5 * Dst, 0.0, 0.7));

  vec3  col   = mix(glyphCol, orig, m3);
  float alpha = mix(glyphA, mid.a, max(m3.r, max(m3.g, m3.b)));

  // coloured snow also shows outside the silhouette, so the cloud reads on the black
  float snowA = snow * 0.2 * inner * (1.0 - mid.a) * clamp(G * 0.7, 0.0, 1.0);
  col   += snowC * snowA * 0.9;
  alpha  = max(alpha, snowA);

  vec3  pm = col * alpha;                                                     // premultiplied from here on
  float a2 = alpha;

  float haze = 0.0;

  // film grain inside the glitch
  float grain = (hash21(frag + tq * 11.0) - 0.5) * 0.10 * clamp(inner + haze, 0.0, 1.0);
  pm += vec3(grain) * a2;

  gl_FragColor = vec4(clamp(pm, 0.0, a2), a2);
}
`
