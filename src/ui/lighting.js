/* Light as the mystery (backlog 2). Deeper floors lose their general light: the shelves fall to silhouette and
   only pools around real light sources stay readable: the lamp at the middle of the screen, alcove lanterns,
   glowing lore books and the pointer's light (cursorLight.js). Alcoves are never darkened.
   How it is made cheap: lights register themselves each frame (addLight); one low-resolution offscreen map
   (1/4 size, 1/6 in saver mode) is filled with the floor's dark colour, each light punches a hole with one
   drawImage of a cached falloff sprite, and the map is composited over the world with a single scaled
   drawImage. No per-pixel work, no gradients created per frame. Skipped entirely on the top floor.
   Flicker follows the floor (Catacombs and Hollow gutter, the Vault is steady, the Abyss breathes) and is off
   in reduced motion. */
import {pointerLightState} from './cursorLight.js';

const MAX_LIGHTS = 24;
const lights = [];
let n = 0;

/** Falloff of a light at u = distance / radius (0 centre .. 1 edge): 1 = fully lit, 0 = unlit. Smooth, zero slope at both ends. */
export const falloff = u => (u >= 1 ? 0 : (1 - u * u) * (1 - u * u));

/** How dark the unlit world is on this floor atmosphere, 0 (top floor, no pass at all) .. .9 (Abyss). */
export const darkness = atm => Math.max(0, Math.min(.9, (atm && atm.dark || 0) * 2.2));
/** How far lights reach relative to the top floor: shrinks with depth (Abyss about .4). */
export const reach = atm => { const l = atm && atm.lampR != null ? atm.lampR : 1; return l * l; };
/** Per-floor flicker multiplier for one light: Hollow gutters, Vault is steady, Abyss breathes slowly. */
export function flickerAt(atm, t, ph, still) {
  if (still) return 1;
  const f = atm.flick || 0, p = atm.pulse || 0;
  return 1 + .03 * f * (Math.sin(t * 9 + ph) * .6 + Math.sin(t * 23 + ph * 2.1) * .4) + p * .07 * Math.sin(t * 1.1 + ph);
}

/** Register a light for this frame, in screen px. r = reach on the top floor, k = strength 0..1. Cheap; extra lights beyond the cap are ignored. */
export function addLight(x, y, r, k = 1) {
  if (n >= MAX_LIGHTS) return;
  const l = lights[n] || (lights[n] = {x: 0, y: 0, r: 0, k: 0});
  l.x = x; l.y = y; l.r = r; l.k = k; n++;
}

/** Pure model of the dark at a point, 0 (lit) .. 1 (full dark). Mirrors what the renderer composites; used by tests. */
export function darkAt(x, y, {lights: ls, rects = [], scale = 1}) {
  for (const q of rects) if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) return 0;
  let rem = 1;
  for (const l of ls) rem *= 1 - l.k * falloff(Math.hypot(x - l.x, y - l.y) / (l.r * scale));
  return rem;
}

function sprite() {
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), d = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = Math.hypot(x + .5 - S / 2, y + .5 - S / 2) / (S / 2), i = (y * S + x) * 4;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.round(255 * falloff(u));
  }
  g.putImageData(d, 0, 0); return c;
}

let spr = null, map = null, mctx = null, mw = 0, mh = 0, ms = 4;

function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Composite the dark over the world. Call once per frame after the world is drawn and before additive glows.
   o: {W,H,atm,t,lx,ly,rects (alcoves),still (reduced motion),low (saver mode)} */
export function drawLighting(ctx, o) {
  const count = n; n = 0; // the registry is per frame
  const {W, H, atm} = o, dk = darkness(atm);
  if (dk < .03) return;
  const step = o.low ? 6 : 4, w = Math.ceil(W / step), h = Math.ceil(H / step);
  if (!map) { map = document.createElement('canvas'); spr = sprite(); }
  if (w !== mw || h !== mh || step !== ms) { mw = map.width = w; mh = map.height = h; ms = step; mctx = map.getContext('2d'); }
  const g = mctx, sc = reach(atm), t = o.t, still = o.still;
  // dark colour: near black, leaning toward the floor's own tint so the Abyss is red-black, not grey
  const tc = atm.tint, tw = (tc[3] || 0) * .5;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = `rgb(${(2 + tc[0] * tw) | 0},${(1 + tc[1] * tw) | 0},${(3 + tc[2] * tw) | 0})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r, k) => { g.globalAlpha = k; const d = 2 * r / step; g.drawImage(spr, x / step - d / 2, y / step - d / 2, d, d); };
  // the player's lamp: the middle of the screen
  punch(o.lx, o.ly, Math.max(W, H) * .5 * sc * flickerAt(atm, t, 0, still), 1);
  for (let i = 0; i < count; i++) { const l = lights[i]; punch(l.x, l.y, l.r * sc * flickerAt(atm, t, i * 1.7, still), l.k); }
  if (pointerLightState.on) punch(pointerLightState.x, pointerLightState.y, 130 + 60 * dk, .85); // the cursor's light reveals what is under it
  // alcoves stay fully readable: cleared with a soft shoulder so the edge is not a hard cut
  g.fillStyle = '#000';
  for (const q of o.rects || []) {
    for (const [grow, al] of [[26, .25], [14, .35], [0, 1]]) {
      g.globalAlpha = al; roundRect(g, (q.x - grow) / step, (q.y - grow) / step, (q.w + grow * 2) / step, (q.h + grow * 2) / step, (q.r + grow) / step); g.fill();
    }
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = dk; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(map, 0, 0, w, h, 0, 0, w * step, h * step); ctx.restore();
}
