/* The brass lift between words. While the camera glides down to the next word, a small brass cage
   with a lantern rides the screen centre, hung on a rope that runs up the wall to a pulley on an oak
   beam. The rope and the beam are fixed in the world, so they scroll away exactly with the shared
   camera; the wheel turns with it. When the glide ends the cage dips and rebounds and its latch
   clunks open, then the cage fades as the book is pulled.

   Geometry and the phase envelope are pure (and tested). drawLift only paints into a given 2D context.
   Cost: nothing is drawn outside a descent, and `low` quality draws nothing at all.
   Reduced motion: no cage, rope or pulley, only a brass latch on the shelf lip that clunks open. */
import {PALETTE} from '../theme/colors.js';
import {cageFire} from '../ui/roomRun.js';
import {glowSprite, stampGlow} from '../ui/glowSprite.js';
import {liftGlow} from '../ui/glowDefs.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export const ROPE_STEP = 14;   // spacing of the rope's twist marks, in world px
export const WHEEL_R = 24;

/** Size and place of the cage for a screen: centred on the lamp, narrower than the alcove. */
export function liftGeom(W, H, alcoveW = 760) {
  const cw = Math.round(Math.min(W - 40, Math.max(220, Math.min(340, alcoveW * 0.5))));
  const ch = Math.round(Math.min(260, H * 0.44));
  const cx = W / 2, cy = H * 0.5;
  const top = Math.round(cy - ch / 2), bot = top + ch;
  const ring = top - 34;                // where the two bridle ropes meet the main rope
  const wheel = ring - 96;              // wheel centre, at the start of the glide
  return {cx, cy, cw, ch, x0: Math.round(cx - cw / 2), x1: Math.round(cx + cw / 2), top, bot, ring, wheel};
}

/** What the lift shows for a descent state. phase: 'down' | 'settle' | 'pull' | 'hold'.
 *  u: glide progress 0..1; settle/pull: 0..1 progress of those phases. Returns {alpha, latch, dip, full}. */
export function liftEnvelope({phase, u = 0, settle = 0, pull = 0, rm = false, quality = 'high'}) {
  const none = {alpha: 0, latch: 0, dip: 0, full: false, latchOnly: false};
  if (quality === 'low' || phase === 'hold' || !phase) return none;
  if (rm) { // only the latch, once the book has landed
    if (phase === 'down') return none;
    const latch = phase === 'settle' ? latchOpen(settle) : 1;
    return {alpha: phase === 'pull' ? 1 - smooth(pull) : 1, latch, dip: 0, full: false, latchOnly: true};
  }
  if (phase === 'down') return {alpha: smooth(u / 0.1), latch: 0, dip: 0, full: true, latchOnly: false};
  if (phase === 'settle') return {alpha: 1, latch: latchOpen(settle), dip: landDip(settle), full: true, latchOnly: false};
  return {alpha: 1 - smooth(pull), latch: 1, dip: 0, full: true, latchOnly: false};
}

/** The latch holds for the first beat after landing, then snaps open (fast, with a little overshoot). */
export function latchOpen(s) {
  const t = clamp((s - 0.25) / 0.35, 0, 1);
  return t >= 1 ? 1 : 1 - Math.pow(1 - t, 3) * Math.cos(t * 5) ;
}

/** The cage sinks a few px as it lands and springs back; px, positive is down. */
export function landDip(s) { return Math.sin(clamp(s, 0, 1) * Math.PI * 2.4) * Math.exp(-3.2 * s) * 6; }

/** Wheel angle for a camera position: the rope runs over the rim, so rim speed equals camera speed. */
export const wheelAngle = (cam, cam0) => (cam - cam0) / WHEEL_R;

/** y positions (screen) of the rope's twist marks between y0 and y1 for a camera; stable per world position. */
export function ropeMarks(cam, y0, y1) {
  const out = [], k0 = Math.ceil((y0 + cam) / ROPE_STEP), k1 = Math.floor((y1 + cam) / ROPE_STEP);
  for (let k = k0; k <= k1; k++) out.push(k * ROPE_STEP - cam);
  return out;
}

const P = PALETTE;

function bolt(ctx, x, y, r = 1.8) {
  ctx.fillStyle = P.bronze35; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
  ctx.fillStyle = P.brassF6d98a; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .45, 0, 6.3); ctx.fill();
}

/** The latch: a brass plate with a hasp that swings up (open = 0..1). Pivot at (x, y). dir: 1 hasp points right, -1 left. */
export function drawLatch(ctx, x, y, open, dir = 1) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-9, -13, 18, 28);
  ctx.fillStyle = P.bronze41; ctx.fillRect(-8, -14, 16, 28);
  ctx.fillStyle = P.brass65; ctx.fillRect(-8, -14, 16, 2);
  bolt(ctx, 0, -9); bolt(ctx, 0, 9);
  ctx.save(); ctx.rotate(-open * 1.25 * dir); // hasp lifts off its staple
  ctx.fillStyle = P.brass; ctx.fillRect(dir > 0 ? -2 : -16, -2.5, 18, 5);
  ctx.fillStyle = P.brassF6d98a; ctx.fillRect(dir > 0 ? -2 : -16, -2.5, 18, 1.3);
  ctx.restore();
  ctx.fillStyle = P.bronze35; ctx.fillRect(dir > 0 ? 12 : -17, -4, 5, 8); // the staple it sits in
  ctx.restore();
}

function rope(ctx, x, y0, y1, cam, w = 4.5) {
  if (y1 <= y0) return;
  ctx.fillStyle = P.bronze55; ctx.fillRect(x - w / 2, y0, w, y1 - y0);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + w / 2 - 1.2, y0, 1.2, y1 - y0);
  ctx.strokeStyle = P.bronze32; ctx.lineWidth = 1.2; ctx.beginPath();
  for (const y of ropeMarks(cam, y0, y1)) { ctx.moveTo(x - w / 2, y + 2); ctx.lineTo(x + w / 2, y - 2); }
  ctx.stroke();
}

function drawPulley(ctx, g, cam, cam0, W, H) {
  const wy = g.wheel + cam0 - cam; // fixed in the world: scrolls up as the camera goes down
  if (wy < -90 || wy > H + 90) return;
  const r = WHEEL_R, x = g.cx + r + 2; // the wheel sits just right of the rope so the rope runs up its left rim
  // oak beam across the shaft, with two brass brackets
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 118, wy - 18, 236, 22);
  ctx.fillStyle = P.bronze6a4a30; ctx.fillRect(x - 120, wy - 22, 240, 20);
  ctx.fillStyle = P.bronze32; ctx.fillRect(x - 120, wy - 22, 240, 3);
  for (const bx of [x - 100, x + 100]) { ctx.fillStyle = P.bronze41; ctx.fillRect(bx - 7, wy - 24, 14, 24); bolt(ctx, bx, wy - 18); bolt(ctx, bx, wy - 6); }
  // a yoke carries the wheel
  ctx.fillStyle = P.bronze41; ctx.fillRect(x - 3, wy - 3, 6, 5);
  ctx.strokeStyle = P.bronze41; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - r - 4, wy - 3); ctx.lineTo(x - r - 4, wy + r + 2); ctx.moveTo(x + r + 4, wy - 3); ctx.lineTo(x + r + 4, wy + r + 2); ctx.stroke();
  const cy = wy + r + 2;
  // the wheel turns with the camera
  const a = wheelAngle(cam, cam0);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x + 1.5, cy + 2, r + 2, 0, 6.3); ctx.fill();
  ctx.strokeStyle = P.brass; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, cy, r - 1, 0, 6.3); ctx.stroke();
  ctx.strokeStyle = P.brass65; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, cy, r - 3, 0, 6.3); ctx.stroke();
  ctx.strokeStyle = P.bronze41; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const t = a + i * Math.PI / 3; ctx.moveTo(x, cy); ctx.lineTo(x + Math.cos(t) * (r - 3), cy + Math.sin(t) * (r - 3)); }
  ctx.stroke();
  bolt(ctx, x, cy, 3);
  // the rope comes up the left of the rim, over the top and away right to the winch off screen
  ctx.strokeStyle = P.bronze55; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(x, cy, r + 2, Math.PI, Math.PI * 1.5); ctx.stroke();
  ctx.fillStyle = P.bronze55; ctx.fillRect(x, cy - r - 4.25, W - x, 4.5);
}

/** Paint the lift. o: {W,H,cam,cam0,vt,env,geom,baseY,baseX}. Call before the pulled book and the darkness. */
export function drawLift(ctx, o) {
  const {env, geom: g, cam, cam0, W} = o;
  if (!env || env.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = env.alpha;
  if (env.latchOnly) { // reduced motion: the hasp on the shelf lip where the book sits, nothing moves but the latch
    drawLatch(ctx, o.baseX, o.baseY + 8, env.latch, 1);
    ctx.restore(); return;
  }
  const {cx, x0, x1, top, bot, ring} = g;
  // rope up the wall: two bridle ropes from the cage corners to a ring, one main rope to the pulley and beyond
  ctx.strokeStyle = P.bronze55; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(x0 + 10, top + env.dip); ctx.lineTo(cx, ring + env.dip * .4); ctx.lineTo(x1 - 10, top + env.dip); ctx.stroke();
  rope(ctx, cx, Math.max(-4, g.wheel + cam0 - cam + WHEEL_R + 2), ring - 1 + env.dip * .4, cam); // ends where it meets the wheel
  ctx.fillStyle = P.brass65; ctx.beginPath(); ctx.arc(cx, ring + env.dip * .4, 5, 0, 6.3); ctx.fill();
  ctx.strokeStyle = P.bronze35; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, ring + env.dip * .4, 5, 0, 6.3); ctx.stroke();
  drawPulley(ctx, g, cam, cam0, W, o.H);

  ctx.translate(0, env.dip);
  // cage: floor plate, posts, top frame, cross braces
  const post = (x) => {
    ctx.fillStyle = P.bronze41; ctx.fillRect(x - 3.5, top, 7, bot - top);
    ctx.fillStyle = P.brass65; ctx.fillRect(x - 3.5, top, 2, bot - top);
  };
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0 + 6, top + 6, x1 - x0, bot - top); // soft drop shadow on the shelves behind
  ctx.fillStyle = 'rgba(8,5,2,.42)'; ctx.fillRect(x0, top, x1 - x0, bot - top); // the cage's dim interior reads against the shelves
  cageFire(ctx, x0, top, x1, bot); // a topic room's fire in the cage
  ctx.strokeStyle = P.bronze41; ctx.lineWidth = 2.4; ctx.beginPath();
  for (const [ya, yb] of [[top + 8, top + 50], [bot - 62, bot - 14]]) { ctx.moveTo(x0, ya); ctx.lineTo(x1, yb); ctx.moveTo(x1, ya); ctx.lineTo(x0, yb); }
  ctx.stroke();
  post(x0); post(x1); post(cx - (x1 - x0) / 4); post(cx + (x1 - x0) / 4);
  ctx.fillStyle = P.bronze41; ctx.fillRect(x0 - 6, top - 6, x1 - x0 + 12, 8);
  ctx.fillStyle = P.brass65; ctx.fillRect(x0 - 6, top - 6, x1 - x0 + 12, 2);
  ctx.fillStyle = P.bronze41; ctx.fillRect(x0 - 8, bot - 6, x1 - x0 + 16, 12);
  ctx.fillStyle = P.brass; ctx.fillRect(x0 - 8, bot - 6, x1 - x0 + 16, 3);
  for (let x = x0 - 2; x <= x1 + 2; x += 22) bolt(ctx, x, bot + 1, 1.6);
  for (const x of [x0 - 6, x1 + 6]) { ctx.fillStyle = P.brass65; ctx.beginPath(); ctx.arc(x, top - 6, 3.2, 0, 6.3); ctx.fill(); }
  // the lantern hangs from the top frame on a short chain
  const lx = cx, ly = top + 44, sw = Math.sin(o.vt * 2.2) * (env.latch < 1 ? 2.2 : .8);
  ctx.strokeStyle = P.bronze35; ctx.lineWidth = 1.4; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(lx, top); ctx.lineTo(lx + sw * .5, ly - 14); ctx.setLineDash([]); ctx.stroke();
  ctx.save(); ctx.translate(lx + sw * .5, ly);
  ctx.fillStyle = P.bronze41; ctx.fillRect(-9, -14, 18, 3); ctx.fillRect(-9, 10, 18, 3);
  ctx.fillStyle = P.brassF6d98a; ctx.globalAlpha *= .85; ctx.fillRect(-6, -11, 12, 21); ctx.globalAlpha = env.alpha;
  ctx.strokeStyle = P.brass; ctx.lineWidth = 1.4; ctx.strokeRect(-6.5, -11, 13, 21);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  stampGlow(ctx, glowSprite(...liftGlow()), lx + sw * .5, ly, 90, .6 + .1 * Math.sin(o.vt * 9));
  ctx.restore();
  // the latch on the right post
  drawLatch(ctx, x1 + 10, bot - 30, env.latch, -1);
  ctx.restore();
}
