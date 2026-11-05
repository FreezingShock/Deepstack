/* Lit props (backlog LM1). Candle stubs and braziers on the deep ledges are real light sources: each lit one
   calls addLight() every frame it is on screen, so the dark pass (lighting.js) leaves a pool around it and a
   warm or cold glow is stamped on top. The Hollow gets a few cold violet candles, the Abyss a rare red-gold
   brazier, so there are islands to head for. Pure placement is tested; drawing is one cached glow + a few fills. */
import {addLight} from './lighting.js';
import {glowSprite, stampGlow} from './glowSprite.js';

const TAU = Math.PI * 2;

/** Which props burn: Hollow candles about one in three, every brazier. Deterministic from the prop's position. */
export function isLit(pr) {
  if (pr.k === 'brazier') return true;
  if (pr.k === 'candle') return ((Math.abs(pr.x * 7.31) | 0) % 3) === 0;
  return false;
}
/** Light profile: reach on the top floor (scaled down with depth by lighting.js), strength, glow colour. */
export function profile(pr) {
  return pr.k === 'brazier'
    ? {r: 560, k: 1, col: '255,150,70', glow: 190, h: 40}
    : {r: 300, k: .95, col: '170,150,255', glow: 90, h: 18};
}
/** Extra brazier props for the Abyss, appended after the floor's own so existing layouts do not move. */
export function brazierProps(fl, W, rng) {
  const out = [];
  if (fl.motif === 'abyss') for (let x = 160 + rng() * 200; x < W - 60; x += 420 + rng() * 520) out.push({k: 'brazier', x});
  return out;
}

export function drawBrazier(c, t, still, ph = 0) {
  c.fillStyle = '#1b1410'; c.beginPath(); c.moveTo(-9, -22); c.lineTo(9, -22); c.lineTo(5, -10); c.lineTo(2, -10); c.lineTo(3, 0); c.lineTo(-3, 0); c.lineTo(-2, -10); c.lineTo(-5, -10); c.closePath(); c.fill();
  c.fillStyle = '#4a3a22'; c.fillRect(-9, -23, 18, 2);
  const f = still ? 1 : 1 + .12 * Math.sin(t * 11 + ph) + .08 * Math.sin(t * 27 + ph * 2);
  c.fillStyle = '#ff8a3c'; c.beginPath(); c.moveTo(-6, -23); c.quadraticCurveTo(-5, -34 * f, 0, -40 * f); c.quadraticCurveTo(5, -34 * f, 6, -23); c.fill();
  c.fillStyle = '#ffd890'; c.beginPath(); c.moveTo(-3, -23); c.quadraticCurveTo(-2, -29 * f, 0, -32 * f); c.quadraticCurveTo(2, -29 * f, 3, -23); c.fill();
}
export function drawFlame(c, t, still, ph = 0) {
  const f = still ? 1 : 1 + .15 * Math.sin(t * 13 + ph) + .1 * Math.sin(t * 31 + ph);
  c.fillStyle = '#6a58a8'; c.fillRect(-3, -14, 6, 14);
  c.fillStyle = '#b9a6ff'; c.beginPath(); c.moveTo(-2.2, -14); c.quadraticCurveTo(0, -18 * f, 0, -23 * f); c.quadraticCurveTo(0, -18 * f, 2.2, -14); c.fill();
}

/** Called from the ledge-prop draw with the ctx already translated to the prop's foot. Registers the light at the prop's screen position. */
export function litProp(ctx, pr, dpr, t, still, H) {
  if (!isLit(pr)) return false;
  const m = ctx.getTransform(), sx = m.e / dpr, sy = m.f / dpr, p = profile(pr);
  if (sy < -300 || sy > H + 300) return false;
  const ph = pr.x * .013, fl = still ? 1 : 1 + .06 * Math.sin(t * 9 + ph) + .04 * Math.sin(t * 23 + ph * 2);
  addLight(sx, sy - p.h, p.r, p.k);
  ctx.save(); ctx.scale(pr.k === 'brazier' ? 1.5 : 1.3, pr.k === 'brazier' ? 1.5 : 1.3);
  if (pr.k === 'brazier') drawBrazier(ctx, t, still, ph); else drawFlame(ctx, t, still, ph);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  stampGlow(ctx, glowSprite('lit' + p.col, [[0, `rgba(${p.col},.8)`], [.4, `rgba(${p.col},.22)`], [1, `rgba(${p.col},0)`]]), 0, -p.h, p.glow * fl, 1);
  ctx.restore();
  return true;
}
