/* The run-screen candle as a real light. The old glow was a CSS gradient inside the answer box, and that box clips
   (overflow:auto), so the light ended in a hard vertical line at the alcove edge and never touched the frame,
   shelves or books. Now the glow lives on the world canvas: one additive warm falloff stamped around the flame
   (it spills over the frame, ledge and the books beside the alcove, fading with distance) and the same light is
   registered with lighting.js so the deeper floors keep a readable pool around it. The flame position is read
   from the DOM only on the 100 ms timer tick (paintRun), never per frame.
   Strength follows the flame (flameState): it shrinks with the wax, gutters at the end, is gone when snuffed. */
import {addLight} from './lighting.js';
import {glowSprite, stampGlow} from './glowSprite.js';
import {flameState} from './candle.js';

const st = {on: false, x: 0, y: 0, k: 0, r: 0, at: 0};
/** Strength now: the timer feeds us every 100 ms; when it stops (answer sent, left the run) the light fades out over half a second. */
const live = () => { if (!st.on) return 0; const age = performance.now() - st.at; return age < 350 ? 1 : Math.max(0, 1 - (age - 350) / 500); };

/** Pure: how strong (0..1) and how far (px on the top floor) the candle lights for the time left. */
export function candleLightModel(left, limit) {
  const f = flameState(left, limit);
  if (!f.lit) return {k: 0, r: 0};
  const fr = Math.max(0, Math.min(1, left / limit));
  return {k: +(.35 + .65 * f.scale * (.55 + .45 * fr)).toFixed(3), r: Math.round(300 + 170 * f.scale)};
}

/** Falloff of the stamped glow: warm core, long soft tail, zero slope at the edge so there is no visible rim. */
export const GLOW_STOPS = [[0, 'rgba(255,176,72,.62)'], [.14, 'rgba(255,160,58,.40)'], [.38, 'rgba(240,128,40,.16)'], [.7, 'rgba(200,90,24,.05)'], [1, 'rgba(160,70,16,0)']];

/** Called from the run timer tick with the flame element and the time left; measures it once. */
export function updateCandleLight(flameEl, left, limit) {
  const m = candleLightModel(left, limit);
  const r = flameEl && flameEl.isConnected ? flameEl.getBoundingClientRect() : null;
  if (!r || !r.width || !m.k) { st.on = false; return; }
  st.on = true; st.at = performance.now(); st.k = m.k; st.r = m.r; st.x = r.left + r.width / 2; st.y = r.top + r.height * .6;
}
export const clearCandleLight = () => { st.on = false; };

/** Register with the dark pass (before drawLighting). */
export function registerCandleLight(t, still) {
  const lv = live(); if (!lv) return;
  addLight(st.x, st.y, st.r * .85, lv * st.k * .9 * (still ? 1 : 1 + .03 * Math.sin(t * 9) + .02 * Math.sin(t * 23)));
}

/** Stamp the warm light on the world (ctx already in 'lighter'). tier 'low' skips the wide tail's second pass. */
export function drawCandleGlow(ctx, t, still, tier) {
  const lv = live(); if (!lv) return;
  const fl = still ? 1 : 1 + .05 * Math.sin(t * 9) + .035 * Math.sin(t * 23) + .02 * Math.sin(t * 41);
  const sp = glowSprite('candle-light', GLOW_STOPS), a = ctx.globalAlpha;
  ctx.globalAlpha = a * lv * st.k * fl;
  const r = st.r * (1 + (still ? 0 : .015 * Math.sin(t * 5)));
  ctx.drawImage(sp, st.x - r, st.y - r, r * 2, r * 2);
  if (tier !== 'low') { ctx.globalAlpha = a * lv * st.k * fl * .5; const c = r * .42; ctx.drawImage(sp, st.x - c, st.y - c, c * 2, c * 2); } // tight core on the ledge and wax
  ctx.globalAlpha = a;
}
