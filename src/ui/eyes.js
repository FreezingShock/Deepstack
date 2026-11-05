/* Something in the dark (backlog LM2). On the deep floors, rarely, a pair of eyes opens out past the lantern
   pools, only where nothing lights it and the pointer's light is nowhere near. They blink, watch, and when
   the cursor light arrives (or any light reaches them) they shut and slip away from it. Never over an alcove
   or the top bar / shelf strip, never in reduced motion or on the Low quality tier (no ambient life).
   The model (eyeStep, pickSpot) is pure and tested; drawEyes only stamps two cached glows. */
import {pointerLightState} from './cursorLight.js';
import {lightLevel} from './lighting.js';
import {glowSprite, stampGlow} from './glowSprite.js';
import {eyeGlow} from './glowDefs.js';

export const FLEE_R = 210;      // pointer light this close sends them away
export const SPAWN_FAR = 380;   // they only open when the pointer is at least this far
export const FADE_IN = 1.6, FADE_OUT = .4, WATCH_MAX = 9;
export const DARK_MAX = .03;    // light level above which a spot is not dark enough

/** Seconds to wait before the next pair opens on a floor of darkness `dark` (.14 Catacombs .. .4 Abyss): deeper means a little sooner, always rare. */
export function waitFor(dark, r) { return (150 - 250 * Math.min(.4, Math.max(0, dark))) * (.7 + .6 * r); }

/** A spot for eyes: dark, clear of alcoves and the HUD strips, away from the pointer. env: {W,H,top,bottom,rects,ptr,lit(x,y)}. null when none of 12 tries fits. */
export function pickSpot(rnd, env) {
  const {W, H, rects = [], ptr, lit} = env, top = env.top ?? 90, bottom = env.bottom ?? 170;
  for (let i = 0; i < 12; i++) {
    const x = W * (.08 + .84 * rnd()), y = top + (H - top - bottom) * rnd();
    if (rects.some(q => x > q.x - 50 && x < q.x + q.w + 50 && y > q.y - 50 && y < q.y + q.h + 50)) continue;
    if (ptr && ptr.on && Math.hypot(x - ptr.x, y - ptr.y) < SPAWN_FAR) continue;
    if (lit(x, y) > DARK_MAX) continue;
    return {x, y};
  }
  return null;
}

/** One step of the state machine. s: {phase:'wait'|'watch'|'flee', t, a (0..1 opacity), x, y, vx, vy, blink}. env as pickSpot plus {dark, rnd}. */
export function eyeStep(s, dt, env) {
  const {ptr, lit, rnd} = env;
  if (s.phase === 'wait') {
    s.a = 0; s.t -= dt;
    if (s.t <= 0) { const p = pickSpot(rnd, env); if (p) { Object.assign(s, {phase: 'watch', t: 0, a: 0, x: p.x, y: p.y, vx: 0, vy: 0, blink: 2 + rnd() * 3}); } else s.t = 4; }
    return s;
  }
  if (s.phase === 'watch') {
    s.t += dt; s.a = Math.min(1, s.a + dt / FADE_IN); s.blink -= dt;
    const near = ptr && ptr.on && Math.hypot(s.x - ptr.x, s.y - ptr.y) < FLEE_R;
    const bad = lit(s.x, s.y) > DARK_MAX * 3 || s.x < 0 || s.x > env.W || s.y < (env.top ?? 90) || s.y > env.H - (env.bottom ?? 170) || (env.rects || []).some(q => s.x > q.x - 20 && s.x < q.x + q.w + 20 && s.y > q.y - 20 && s.y < q.y + q.h + 20);
    if (near || bad || s.t > WATCH_MAX) {
      const dx = ptr && ptr.on ? s.x - ptr.x : 1, dy = ptr && ptr.on ? s.y - ptr.y : 0, d = Math.hypot(dx, dy) || 1;
      Object.assign(s, {phase: 'flee', t: 0, vx: dx / d * (near ? 140 : 30), vy: dy / d * (near ? 140 : 30)});
    }
    return s;
  }
  // flee: shut and slip away, then sleep a long while
  s.t += dt; s.a = Math.max(0, s.a - dt / FADE_OUT); s.x += s.vx * dt; s.y += s.vy * dt;
  if (s.a <= 0) Object.assign(s, {phase: 'wait', t: waitFor(env.dark, rnd()), a: 0});
  return s;
}

/** Eyes are an ambient extra: off with reduced motion and on Low quality. */
export const eyesAllowed = ({still, ambient, dark}) => !still && !!ambient && dark >= .1;

export function createEyes(rnd = Math.random) { return {phase: 'wait', t: 10 + rnd() * 20, a: 0, x: 0, y: 0, vx: 0, vy: 0, blink: 0}; }
export const eyes = createEyes();
export const eyesDebug = {now: false};

let last = 0;
/** Advance and draw. Call after drawLighting each frame. o: {W,H,atm,sc (light reach),rects,top,bottom,still,ambient,t,dt,camDy} */
export function drawEyes(ctx, o) {
  const dark = o.atm ? o.atm.dark : 0;
  if (!eyesAllowed({still: o.still, ambient: o.ambient, dark})) { eyes.phase = 'wait'; eyes.a = 0; eyes.t = Math.max(eyes.t, 8); return; }
  if (eyesDebug.now && eyes.phase === 'wait') { eyes.t = 0; eyesDebug.now = false; }
  const dt = Math.min(.1, o.dt || .016);
  eyes.y -= o.camDy || 0; // anchored to the shelves: they scroll with the world
  eyeStep(eyes, dt, {W: o.W, H: o.H, top: o.top, bottom: o.bottom, rects: o.rects, ptr: pointerLightState, lit: (x, y) => lightLevel(x, y, o.sc), dark, rnd: Math.random});
  if (eyes.a <= .01) return;
  const blinking = eyes.blink < 0 && eyes.blink > -.16; if (eyes.blink < -.16) eyes.blink = 3 + Math.random() * 5;
  const col = dark > .38 ? '255,70,60' : dark > .3 ? '200,150,255' : '150,230,230';
  const ey = blinking ? .12 : 1, gap = 9;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = eyes.a * .9;
  for (const sx of [-gap, gap]) {
    stampGlow(ctx, glowSprite(...eyeGlow(col)), eyes.x + sx, eyes.y, 9, 1);
    ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.ellipse(eyes.x + sx, eyes.y, 2.6, 1.7 * ey, 0, 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

// test/screenshot hook: open the page with ?eyes=now and call __deepEyes.now() to open a pair at the next dark spot
if (typeof location !== 'undefined' && /[?&]eyes=now/.test(location.search)) globalThis.__deepEyes = {state: eyes, now: () => { eyesDebug.now = true; }};
