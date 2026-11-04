/* Things that live down here: rare, quiet ambient creatures and events on the shelves of each floor.
   Pure state machine plus a small canvas painter, stepped from the existing World frame (no extra rAF, no DOM).
   update() returns the visible items as screen boxes; an item whose box touches an exclusion rect (the alcove,
   the HUD band) is faded out and never painted, so nothing ever crosses text or panels. Off for reduced motion
   and low quality. Spawns are capped: at most MAX_LIVE at once and a long random gap between arrivals. */
import {FLOORS} from '../core/floors.js';

export const MAX_LIVE = 2;
export const GAP = [9, 24]; // seconds between spawns on the current floor
// Which creatures each floor can host (2 or 3 each).
export const KINDS = {
  stacks: ['spider', 'silverfish'],
  archive: ['silverfish', 'drip', 'spider'],
  catacombs: ['rat', 'drip', 'spider'],
  vault: ['fish', 'bubbles', 'drip'],
  hollow: ['ash', 'eyes'],
  abyss: ['eyes', 'tendril', 'ash'],
};
// Lifetime (s) and local box size (w, h) per kind. The box is the exact area the painter stays inside.
export const DEFS = {
  spider: {dur: 8, w: 14, h: 0},
  silverfish: {dur: 4.5, w: 16, h: 6},
  rat: {dur: 7, w: 34, h: 16},
  drip: {dur: 1.8, w: 10, h: 0},
  fish: {dur: 14, w: 44, h: 18},
  bubbles: {dur: 4.5, w: 22, h: 0},
  eyes: {dur: 5.5, w: 24, h: 10},
  ash: {dur: 7, w: 8, h: 8},
  tendril: {dur: 7, w: 26, h: 0},
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const blocked = (box, excl) => excl.some(e => hit(box, e));

/** Is ambient life allowed at all? Reduced motion and low-quality/data-saver turn it off. */
export function ambientEnabled({rm = false, low = false} = {}) { return !rm && !low; }

let live = [], cool = 6, nid = 1;
export function lowQuality() { try { return !!navigator.connection?.saveData; } catch (e) { return false; } }
export function resetAmbient() { live = []; cool = 6; }
export function liveCount() { return live.length; }

// Box of an item at its current life fraction u (0..1), in screen space.
function boxOf(c, camNow, RH) {
  const d = DEFS[c.kind], u = c.t / d.dur, by = c.wy - camNow, pad = 4;
  let x = c.x, y = by, w = d.w, h = d.h;
  switch (c.kind) {
    case 'spider': { const len = c.len * Math.sin(Math.PI * clamp(u, 0, 1)); x = c.x - w / 2; y = by; h = len + 9; break; }
    case 'silverfish': x = c.x + c.dir * c.v * c.t - w / 2; y = by - h; break;
    case 'rat': x = c.x + c.dir * ratX(c) - w / 2; y = by - h; break;
    case 'drip': { const f = clamp(u / .8, 0, 1); y = by + c.len * f * f - 4; h = 10; x = c.x - w / 2; break; }
    case 'fish': x = c.x + c.dir * c.v * c.t - w / 2; y = by - h / 2 + Math.sin(c.t * 1.3 + c.ph) * 10 - 10; break;
    case 'bubbles': x = c.x - w / 2; h = RH * .8 * u + 8; y = by - h; break;
    case 'eyes': x = c.x - w / 2; y = by - h / 2; break;
    case 'ash': x = c.x + Math.sin(c.t * .9 + c.ph) * 14 - w / 2; y = by + c.t * 14 - h / 2; break;
    case 'tendril': h = RH * .42 * Math.sin(Math.PI * clamp(u, 0, 1)) + 6; x = c.x - w / 2; y = by - h; break;
  }
  return {x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2};
}
// The rat dashes, stops to twitch, then dashes again.
function ratX(c) { const t = c.t; return t < 2 ? t * 70 : t < 3.6 ? 140 : 140 + (t - 3.6) * 90; }

/** Fade in/out over a life; touched by an exclusion rect it fades out fast instead. */
const envelope = u => clamp(Math.min(u / .12, (1 - u) / .18, 1), 0, 1);

/** Advance the world's ambient life by dt seconds and return what is visible.
 *  env: {W,H,RH,camNow,top,bot,excl:[{x,y,w,h}],rm,low,quiet,busy,rng}
 *  quiet = a panel/page covers the world; busy = a descent or glide is moving the camera. */
export function updateAmbient(dt, env) {
  const rng = env.rng || Math.random;
  if (!ambientEnabled(env) || env.quiet) { if (live.length) live = []; return []; }
  cool -= dt;
  if (!env.busy && cool <= 0 && live.length < MAX_LIVE) {
    spawn(env, rng);
    cool = GAP[0] + rng() * (GAP[1] - GAP[0]);
  }
  const out = [];
  for (const c of live) {
    c.t += dt;
    const d = DEFS[c.kind], u = c.t / d.dur, box = boxOf(c, env.camNow, env.RH);
    const offscreen = box.y > env.H + 40 || box.y + box.h < -40 || box.x > env.W + 40 || box.x + box.w < -40;
    const bad = blocked(box, env.excl);
    c.k = clamp(c.k + (bad ? -dt * 6 : dt * 3), 0, 1);
    if (u >= 1 || offscreen) { c.dead = true; continue; }
    const a = envelope(u) * c.k;
    if (a > .01 && !bad) out.push({id: c.id, kind: c.kind, c, box, a, u});
  }
  live = live.filter(c => !c.dead);
  return out;
}

function spawn(env, rng) {
  const rows = [];
  for (let r = env.top; r <= env.bot; r++) rows.push(r);
  // prefer the floor the lamp is on: rows whose floor matches the middle of the screen
  const midRow = Math.floor((env.camNow + env.H * .5) / env.RH);
  const fl = FLOORS.filter(f => f.row <= midRow).pop() || FLOORS[0];
  const kinds = KINDS[fl.key] || [];
  if (!kinds.length) return;
  for (let tries = 0; tries < 8; tries++) {
    const kind = kinds[(rng() * kinds.length) | 0];
    const r = rows[(rng() * rows.length) | 0];
    if (r < 1 || (FLOORS.filter(f => f.row <= r).pop() || FLOORS[0]).key !== fl.key) continue;
    const d = DEFS[kind], x = 40 + rng() * (env.W - 80), dir = rng() < .5 ? -1 : 1;
    const base = r * env.RH + env.RH - 12;
    const c = {id: nid++, kind, t: 0, k: 1, x: dir > 0 ? x * .6 : env.W * .4 + x * .6, dir, ph: rng() * 9, v: 24 + rng() * 22, len: 36 + rng() * env.RH * .4, wy: base, dead: false};
    if (kind === 'spider' || kind === 'drip') c.wy = r * env.RH + 8;
    if (kind === 'eyes' || kind === 'fish') c.wy = base - env.RH * (.25 + rng() * .3);
    if (kind === 'ash') c.wy = base - env.RH * (.6 + rng() * .3);
    if (kind === 'fish') c.x = dir > 0 ? -d.w : env.W + d.w;
    const box = boxOf({...c, t: d.dur * .4}, env.camNow, env.RH);
    if (blocked(box, env.excl) || blocked(boxOf(c, env.camNow, env.RH), env.excl)) continue;
    live.push(c); return;
  }
}

/** Paint items. layer 'body' goes under the darkness (so the lamp dims it), 'glow' goes on top, additive. */
export function drawAmbient(ctx, items, t, layer, lamp = [255, 190, 110]) {
  for (const it of items) {
    const {c, box, a, u} = it, d = DEFS[c.kind];
    const cx = box.x + box.w / 2, left = box.x + 4, top = box.y + 4, w = box.w - 8, h = box.h - 8;
    ctx.save();
    if (layer === 'body') {
      ctx.globalAlpha = a * .8;
      switch (c.kind) {
        case 'spider': {
          ctx.strokeStyle = 'rgba(210,205,190,.5)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, top + h - 6); ctx.stroke();
          ctx.fillStyle = 'rgba(8,6,5,.95)'; ctx.beginPath(); ctx.arc(cx, top + h - 4, 2.6, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(8,6,5,.9)'; for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx, top + h - 4); ctx.lineTo(cx + i * (4 + k), top + h - 8 + k * 3); ctx.stroke(); }
          break; }
        case 'silverfish': {
          const wig = Math.sin(t * 22 + c.ph) * 1.2; ctx.fillStyle = 'rgba(200,205,205,.85)';
          ctx.beginPath(); ctx.ellipse(left + w / 2, top + h / 2 + wig * .3, w / 2, h / 2.4, 0, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(200,205,205,.6)'; ctx.beginPath(); const hx = c.dir > 0 ? left + w : left; ctx.moveTo(hx, top + h / 2); ctx.lineTo(hx + c.dir * 5, top + h / 2 - 3 + wig); ctx.stroke();
          break; }
        case 'rat': {
          const moving = c.t < 2 || c.t > 3.6, s = c.dir, rx = s > 0 ? left : left + w;
          ctx.fillStyle = 'rgba(10,8,7,.95)'; ctx.beginPath(); ctx.ellipse(left + w * .5, top + h * .62, w * .36, h * .34, 0, 0, 6.3); ctx.fill();
          ctx.beginPath(); ctx.ellipse(left + w * (s > 0 ? .86 : .14), top + h * .66, w * .13, h * .24, 0, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(10,8,7,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(rx, top + h * .7);
          ctx.quadraticCurveTo(rx - s * w * .25, top + h * (moving ? .4 : .2 + Math.sin(t * 6) * .12), rx - s * w * .38, top + h * .8); ctx.stroke();
          break; }
        case 'drip': {
          const y = top + 2;
          if (u < .8) { ctx.fillStyle = 'rgba(150,200,210,.7)'; ctx.beginPath(); ctx.ellipse(cx, y + h * .5, 1.6, 3, 0, 0, 6.3); ctx.fill(); }
          else { ctx.strokeStyle = 'rgba(150,200,210,.5)'; ctx.beginPath(); ctx.ellipse(cx, top + h - 3, 2 + (u - .8) * 22, 1 + (u - .8) * 5, 0, 0, 6.3); ctx.stroke(); }
          break; }
        case 'fish': {
          const s = c.dir, sw = Math.sin(t * 3 + c.ph) * 2; ctx.fillStyle = 'rgba(120,175,185,.55)';
          ctx.beginPath(); ctx.moveTo(left + (s > 0 ? w : 0), top + h / 2); ctx.quadraticCurveTo(left + w * .5, top - 2, left + (s > 0 ? 10 : w - 10), top + h / 2 + sw);
          ctx.quadraticCurveTo(left + w * .5, top + h + 2, left + (s > 0 ? w : 0), top + h / 2); ctx.fill();
          ctx.beginPath(); const tx = left + (s > 0 ? 0 : w); ctx.moveTo(tx + s * 12, top + h / 2 + sw); ctx.lineTo(tx, top + h / 2 - 5 + sw); ctx.lineTo(tx, top + h / 2 + 5 + sw); ctx.fill();
          break; }
        case 'bubbles': {
          ctx.strokeStyle = 'rgba(170,225,235,.6)'; for (let i = 0; i < 4; i++) { const f = clamp(u * 1.2 - i * .12, 0, 1); if (f <= 0) continue; ctx.beginPath(); ctx.arc(cx + Math.sin(t * 2 + i * 2) * 3, top + h - 3 - f * (h - 6), 1.5 + i * .5, 0, 6.3); ctx.stroke(); }
          break; }
        case 'tendril': {
          ctx.strokeStyle = 'rgba(6,3,6,.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, top + h);
          ctx.bezierCurveTo(cx + Math.sin(t * .9 + c.ph) * 9, top + h * .66, cx - Math.sin(t * .7 + c.ph) * 9, top + h * .33, cx + Math.sin(t * 1.1) * 6, top); ctx.stroke();
          break; }
      }
    } else { // glow layer (additive): eyes, ash, ember
      if (c.kind === 'eyes') {
        const blink = (Math.sin(t * .9 + c.ph) > .92) ? .1 : 1, col = lamp[0] > 200 && lamp[1] < 100 ? '255,70,80' : '190,150,255';
        ctx.globalAlpha = a * .75 * blink; ctx.fillStyle = `rgb(${col})`;
        ctx.beginPath(); ctx.ellipse(left + w * .22, top + h / 2, 2.6, 1.8, 0, 0, 6.3); ctx.ellipse(left + w * .78, top + h / 2, 2.6, 1.8, 0, 0, 6.3); ctx.fill();
      } else if (c.kind === 'ash') {
        ctx.globalAlpha = a * .6; ctx.fillStyle = lamp[0] > 200 && lamp[1] < 100 ? 'rgb(255,110,70)' : 'rgb(190,180,200)';
        ctx.beginPath(); ctx.arc(left + w / 2, top + h / 2, 1.5, 0, 6.3); ctx.fill();
      }
    }
    ctx.restore();
  }
}
