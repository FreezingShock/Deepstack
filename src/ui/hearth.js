/* The hearth: a stone fireplace at the back of the home niche, on a brick back wall, lit like a room at night where
   the fire is the main light (nate picked mockup "B on C's background", 2026-11-05).
   - One layer inside #home, under every home element (z-index -1 in #ui), holding two canvases: the static room
     (brick wall, stone chimney and surround, firebox, mantel corbels, book piles) drawn once per layout, and the
     live one (fire, logs, grate, sparks, embers in the air) drawn each frame. The structure is also pre-rendered
     "lit"; each frame only fades that copy in over the hearth's own box, so the flicker costs one drawImage.
   - Room light: three fixed layers (.hearth-light) between the world canvas and #ui. They blend with the shelves only;
     the UI keeps its own colours so every label stays readable. They fade out when home is not showing.
   - Wide rooms (cabinet and Librarian's Card on the walls): the fire stands between the two book stacks, which move
     to the niche walls, Descend moves up into the space the streak mantel left, and the streak candles stand on the
     fireplace mantel. Narrower rooms: the fireplace sits in the flow under the streak mantel, above Descend.
   - Interaction: flames lean away from a nearby cursor and stir when it hovers the fire; clicking the fire stokes it
     (flare, spark burst, a soft whoosh).
   - Budget: low quality runs at 30 fps with fewer flames and no embers in the air; reduced motion draws one still
     frame. Nothing animates while home is hidden, in the attic, or the tab is hidden. The fire keeps burning behind
     an open menu book (#home.book-opening), so the room stays lit around it; clicks there don't stoke it. */
import {Quality} from './quality.js';
import {reducedMotion} from './settings.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
/* smooth noise in about [-1.75, 1.75] */
const S = x => Math.sin(x) + .5 * Math.sin(2.17 * x + 1.3) + .25 * Math.sin(4.31 * x + 2.1);
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const rgba = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`;

/* ---------- geometry (pure; tested) ---------- */
export const WIDE_MIN = 1000;
/** Wide rooms. W,H: the niche box. tagBottom/taglineBottom/descendTop: home-local y of the Daily caption, tagline and
    plaque top. Returns the stacks' width, how far Descend moves up, and the surround and mantel boxes. */
export function planWide({W, H, taglineBottom, descendTop, tagBottom}) {
  const FW = clamp(W * .36, 250, 330), inner = W - 28;
  const shelfW = Math.min(228, (inner - FW - 20) / 2);
  const lift = clamp(descendTop - (taglineBottom + 44), 0, 80);
  const floorY = H - 2, beamTop0 = tagBottom - lift + 52;
  const beamTop = Math.max(beamTop0, floorY - FW * 1.3 - 10);
  const mantel = {x: W / 2 - FW * .57, y: beamTop, w: FW * 1.14, h: 12};
  const top = beamTop + mantel.h - 2;
  return {mode: 'wide', shelfW, lift, mantel, SR: {x: W / 2 - FW / 2, y: top, w: FW, h: floorY - top}};
}
/** Narrow rooms: the fireplace hangs under the streak mantel's beam (home-local box) and is `h` tall. */
export function planFlow({W, beam, h}) {
  if (!beam || h < 42) return null;
  const FW = Math.min(W * .66, h * 1.55, 340);
  const mantel = {x: W / 2 - FW * .57, y: beam.y, w: FW * 1.14, h: Math.max(9, beam.h)};
  return {mode: 'flow', mantel, SR: {x: W / 2 - FW / 2, y: mantel.y + mantel.h - 1, w: FW, h}};
}
/** Opening, hearth slab, fire and light point from the surround. */
export function deriveHearth(SR) {
  const w = SR.w * .64, h = Math.min(SR.h * .7, w * .95);
  const OP = {x: SR.x + (SR.w - w) / 2, y: SR.y + SR.h - h - SR.h * .07, w, h, arch: h * .16};
  OP.b = OP.y + OP.h; OP.cx = OP.x + OP.w / 2;
  const HEARTH = {x: SR.x - SR.w * .06, y: OP.b, w: SR.w * 1.12, h: SR.y + SR.h - OP.b + 3};
  const FIRE = {cx: OP.cx, base: OP.b - OP.h * .2, w: OP.w * .8};
  const LIGHT = {x: FIRE.cx, y: FIRE.base - OP.h * .18};
  return {OP, HEARTH, FIRE, LIGHT};
}
/** Fire intensity: base flicker, + hover warmth, + a stoke flare that decays. */
export function fireIntensity(t, hover = 0, flare = 0) {
  return 1 + S(t * 4.3) * .045 + S(t * 9.7 + 3) * .025 + hover * .08 + flare * .7;
}

/* ---------- small helpers ---------- */
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function archPath(g, o) {
  const a = o.arch;
  g.beginPath(); g.moveTo(o.x, o.b); g.lineTo(o.x, o.y + a);
  g.quadraticCurveTo(o.x + o.w / 2, o.y - a * .95, o.x + o.w, o.y + a); g.lineTo(o.x + o.w, o.b); g.closePath();
}
function sprite(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d')); return c; }
let EMBER, LICK;
function sprites() {
  if (EMBER) return;
  EMBER = sprite(32, 32, g => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, rgba(255, 240, 200)); r.addColorStop(.18, rgba(255, 190, 90, .9)); r.addColorStop(.5, rgba(255, 110, 30, .25)); r.addColorStop(1, rgba(255, 80, 20, 0)); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
  LICK = sprite(16, 40, g => { const r = g.createRadialGradient(8, 26, 0, 8, 26, 14); r.addColorStop(0, rgba(255, 200, 90)); r.addColorStop(.5, rgba(255, 120, 30, .6)); r.addColorStop(1, rgba(200, 50, 10, 0)); g.fillStyle = r; g.beginPath(); g.ellipse(8, 22, 7, 18, 0, 0, 7); g.fill(); });
}
/** A spark sprite in the given tint (white-hot core, tint through the body); null keeps the warm default. */
const emberCache = new Map();
function emberSprite(tint) {
  if (!tint) return EMBER;
  const key = tint.join();
  if (!emberCache.has(key)) emberCache.set(key, sprite(32, 32, g => {
    const [r, gg, b] = tint, lift = v => Math.round(v + (255 - v) * .78), r0 = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r0.addColorStop(0, rgba(lift(r), lift(gg), lift(b))); r0.addColorStop(.18, rgba(r, gg, b, .92)); r0.addColorStop(.5, rgba(r, gg, b, .26)); r0.addColorStop(1, rgba(r, gg, b, 0));
    g.fillStyle = r0; g.fillRect(0, 0, 32, 32);
  }));
  return emberCache.get(key);
}
const BOOKCOL = [[222, 40, 30], [355, 42, 30], [140, 30, 24], [38, 50, 34], [205, 22, 34], [20, 35, 26]];

/* ---------- the room light (one per page) ---------- */
let lightEls = null;
/* Three fixed layers placed right before #ui: each must be a direct child of the page (no wrapper), or its blend
   would only see the wrapper and not the shelves. */
function roomLight() {
  if (lightEls && lightEls[0].isConnected) return lightEls;
  const ui = document.getElementById('ui');
  lightEls = ['shade', 'glow', 'cool'].map(k => {
    const el = document.createElement('i'); el.className = 'hearth-light hl-' + k; el.setAttribute('aria-hidden', 'true');
    if (ui && ui.parentNode) ui.parentNode.insertBefore(el, ui); else document.body.appendChild(el);
    return el;
  });
  return lightEls;
}

/* ---------- mount ---------- */
let current = null;
/** Build the hearth into #home (call after every home render). Returns {destroy, stoke}. */
export function mountHearth(home, {sfx, mood} = {}) {
  if (current) current.destroy();
  if (!home || typeof document === 'undefined') return null;
  current = createHearth(home, sfx, mood);
  return current;
}

function createHearth(home, sfx, mood) {
  sprites();
  const MH = mood && mood.h > 0 ? mood.h : 1, SPARK = emberSprite(mood && mood.tint);
  const doc = document, root = doc.documentElement;
  const layer = doc.createElement('div'); layer.className = 'hearth'; layer.setAttribute('aria-hidden', 'true');
  const cStatic = doc.createElement('canvas'), cAnim = doc.createElement('canvas');
  layer.append(cStatic, cAnim); home.prepend(layer);
  const lights = roomLight(), glowEl = lights[1];
  const setVar = (k, v) => { for (const el of lights) el.style.setProperty(k, v); };
  let G = null, W = 0, H = 0, DPR = 1, cLit = null, cLogsB = null, cLogsF = null, cF = null, gF = null, BB = null, FB = null;
  let raf = 0, dead = false, seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, rr = (a, b) => a + (b - a) * rnd();
  const touched = [];
  // custom properties (--x) go through setProperty; undo puts back whatever was there (the home tier's own --hz-* values)
  const setStyle = (el, k, v) => { if (!el) return; const cp = k[0] === '-'; touched.push([el, k, cp ? el.style.getPropertyValue(k) : '']); if (cp) el.style.setProperty(k, v); else el.style[k] = v; };
  const undo = () => { for (const [el, k, was] of touched.splice(0).reverse()) { if (k[0] === '-') { if (was) el.style.setProperty(k, was); else el.style.removeProperty(k); } else el.style[k] = ''; } home.classList.remove('hearth-wide', 'hearth-flow', 'hearth-narrow', 'hearth-compact', 'hearth-bare', 'hearth-tiny'); };

  /* ----- layout ----- */
  function layout() {
    if (dead) return;
    undo();
    const hr = home.getBoundingClientRect();
    W = Math.round(hr.width); H = Math.round(hr.height);
    G = null;
    if (home.hidden || W < 200 || H < 260) { layer.hidden = true; return; }
    const loc = el => { const r = el.getBoundingClientRect(); return {x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height, b: r.bottom - hr.top, r: r.right - hr.left}; };
    const q = s => home.querySelector(s);
    const tagline = q('.tagline'), descend = q('#bPlay') || q('#bNext') || q('#bRes') || q('.hz-plaque .row button'), row = q('.hz-plaque .row'), tag = q('.hz-plaque .next'), mantelEl = q('.mantel');
    const beamEl = q('.mantel-beam'), shelves = [...home.querySelectorAll('.hshelf')];
    if (!tagline || !descend || !mantelEl || !beamEl) { layer.hidden = true; return; }
    const wide = innerWidth >= WIDE_MIN && getComputedStyle(mantelEl).position === 'absolute';
    let plan;
    if (wide) {
      home.classList.add('hearth-wide');
      plan = planWide({W, H, taglineBottom: loc(tagline).b, descendTop: loc(descend).y, tagBottom: loc(tag || descend).b});
      home.classList.add('hearth-narrow');
      for (const s of shelves) setStyle(s, 'width', plan.shelfW + 'px');
      if (shelves.length === 2) {
        const a = loc(shelves[0]), b = loc(shelves[1]);
        setStyle(shelves[0], 'translate', `${14 - a.x}px 0`);
        setStyle(shelves[1], 'translate', `${W - 14 - b.r}px 0`);
      }
      for (const r of home.querySelectorAll('.hz-plaque .row')) setStyle(r, 'translate', `0 ${-plan.lift}px`); setStyle(tag, 'translate', `0 ${-plan.lift}px`);
      const beam = loc(beamEl);
      setStyle(mantelEl, 'translate', `0 ${plan.mantel.y - beam.y}px`);
    } else {
      // short rooms hide the streak mantel (data-room=tight); the fireplace still gets its beam, just without candles
      const candles = q('.mantel-row');
      if (getComputedStyle(mantelEl).display === 'none') { setStyle(mantelEl, 'display', 'block'); setStyle(candles, 'display', 'none'); }
      home.classList.add('hearth-flow');
      // room under the mantel: the mantel's own headroom plus whatever is left above the stacks, at most 230
      const stacksTop = () => shelves.length ? Math.min(...shelves.map(s => loc(s).y)) : H;
      const bottom = () => loc(tag && tag.style.display !== 'none' ? tag : descend).b;
      const stacksBottom = () => shelves.length ? Math.max(...shelves.map(s => loc(s).b)) : 0;
      const floorY = H - (parseFloat(getComputedStyle(home).paddingBottom) || 0); // the ledge the stacks stand on
      const sink0 = 0; // nothing may sink behind the ledge: shrink the fire instead
      const solve = () => {
        setStyle(mantelEl, 'marginBottom', '0px');
        const pad = parseFloat(getComputedStyle(mantelEl).paddingTop) || 0;
        const column = bottom() - loc(mantelEl).y - pad; // candles, beam, Descend and caption
        setStyle(mantelEl, 'paddingTop', home.classList.contains('hearth-compact') ? '0px' : '6px');
        let h = clamp(stacksTop() - 14 - (loc(tagline).b + 8) - column - 16, 0, Math.min(230, W * .5));
        setStyle(mantelEl, 'marginBottom', (h + 10) + 'px');
        // the column is centred in its zone, so check both ends and give back what overlaps
        // (shrinking the fire moves the centred column, so measure again until nothing overlaps or sinks)
        for (let i = 0; i < 4; i++) {
          const over = Math.max(bottom() + 10 - stacksTop(), loc(tagline).b + 4 - loc(mantelEl).y, stacksBottom() - floorY - sink0, home.scrollHeight - home.clientHeight);
          if (over <= .5) break;
          h -= over; setStyle(mantelEl, 'marginBottom', Math.max(0, h + 10) + 'px');
        }
        return h;
      };
      let h = solve();
      // not enough room for a fireplace worth seeing: give up the candles (the streak stays on the plaque) for height
      if (h < 100 && getComputedStyle(candles).display !== 'none') { setStyle(candles, 'display', 'none'); h = solve(); }
      // short phones (375x667) and portrait tablets with no spare height: a compact room (stacks and gaps a size down)
      if (h < 76) { home.classList.add('hearth-compact'); setStyle(home, '--hz-book', '24px'); setStyle(home, '--hz-g', '3px'); h = solve(); }
      // very short: the "Daily No. N" caption under Descend repeats the book titles, so it gives way too
      if (h < 76 && tag) { setStyle(tag, 'display', 'none'); h = solve(); }
      // still too small for a fire worth drawing: shrink the title, caption and spines (see fit.css) so a small fireplace stays instead of going
      if (h < 60) { const h0 = h; home.classList.add('hearth-tiny'); setStyle(home, '--hz-book', '22px'); h = solve(); if (h < h0) { home.classList.remove('hearth-tiny'); setStyle(home, '--hz-book', '24px'); h = solve(); } }
      plan = home.scrollHeight - home.clientHeight > 1 ? null : planFlow({W, beam: loc(beamEl), h}); // still overflowing after every squeeze: go without the fire
      if (!plan) { undo(); home.classList.add('hearth-bare'); layer.hidden = true; return; } // no room for a fire worth drawing: drop the empty mantel too so the room still fits
    }
    layer.hidden = false;
    G = {...plan, ...deriveHearth(plan.SR), wide, TLB: loc(tagline).b, hr};
    DPR = Math.min(devicePixelRatio || 1, Quality.params().dprMax || 2);
    for (const c of [cStatic, cAnim]) { c.width = Math.ceil(W * DPR); c.height = Math.ceil(H * DPR); c.style.width = W + 'px'; c.style.height = H + 'px'; }
    const off = () => { const c = doc.createElement('canvas'); c.width = Math.ceil(W * DPR); c.height = Math.ceil(H * DPR); const g = c.getContext('2d'); g.scale(DPR, DPR); return [c, g]; };
    let gS = cStatic.getContext('2d'); gS.setTransform(DPR, 0, 0, DPR, 0, 0);
    let gL; [cLit, gL] = off();
    seed = 7; drawStatic(gS, false); seed = 7; drawStatic(gL, true);
    let gB, gFr; [cLogsB, gB] = off(); [cLogsF, gFr] = off(); drawLogs(gB, gFr);
    const fw = Math.ceil(G.OP.w / 2) + 4, fh = Math.ceil((G.OP.h + G.OP.arch) / 2) + 4;
    cF = doc.createElement('canvas'); cF.width = fw * DPR; cF.height = fh * DPR; gF = cF.getContext('2d'); gF.scale(DPR, DPR); G.fw = fw; G.fh = fh;
    const {OP, HEARTH, mantel} = G;
    const x0 = Math.max(0, Math.floor(Math.min(mantel.x, HEARTH.x) - 4)), x1 = Math.min(W, Math.ceil(Math.max(mantel.x + mantel.w, HEARTH.x + HEARTH.w) + 4));
    const y0 = Math.max(0, Math.floor(wide ? G.TLB : mantel.y - 40)), y1 = Math.min(H, Math.ceil(HEARTH.y + HEARTH.h + 2));
    BB = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    FB = {x: Math.floor(OP.x), y: Math.floor(OP.y - OP.arch), w: Math.ceil(OP.w) + 1, h: Math.ceil(OP.h + OP.arch) + 1};
    buildFire();
    paintLight();
    kick();
  }

  /* ----- static room ----- */
  const lightAt = (x, y, k = 1) => { const {LIGHT, SR} = G; const dx = (x - LIGHT.x) / (SR.w * 1.1 * k), dy = (y - LIGHT.y) / (SR.w * .95 * k); return 1 / (1 + (dx * dx + dy * dy) * 2.4); };
  function wall(g, rect, lit, o = {}) {
    const {course = 15, hue = 24, sat = 14, base = 17, fadeTop = 0, brick = false, far = 0} = o;
    if (rect.w <= 0 || rect.h <= 0) return;
    g.save(); g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
    g.fillStyle = hsl(hue, sat, 5); g.fillRect(rect.x, rect.y, rect.w, rect.h);
    let row = 0;
    for (let y = rect.y + rect.h; y > rect.y - course; y -= course, row++) {
      const ch = course * (brick ? 1 : rr(.86, 1.12));
      let x = rect.x - (row % 2 ? rr(.3, .7) : rr(0, .3)) * course * (brick ? 2.2 : 2.6);
      while (x < rect.x + rect.w) {
        const bw = brick ? course * 2.2 : course * rr(1.5, 3.1), bx = x + 1, by = y - ch + 1, bww = bw - 2, bh = ch - 2;
        const L = lightAt(bx + bww / 2, by + bh / 2, far ? 1.6 : 1);
        const dark = far ? (1 - far * clamp(1 - L * 2, 0, 1)) : 1;
        const l0 = (base + rr(-3, 3) + (lit ? L * 30 : L * 6)) * dark;
        const hh = hue + (lit ? -10 * L : 0) + rr(-4, 4), ss = sat + (lit ? L * 34 : 0) + rr(-3, 3);
        const gg = g.createLinearGradient(bx, by, bx, by + bh);
        gg.addColorStop(0, hsl(hh, ss, l0 + 4)); gg.addColorStop(1, hsl(hh, ss, Math.max(2, l0 - 3)));
        g.fillStyle = gg; roundRect(g, bx, by, bww, bh, brick ? 1 : 2.2); g.fill();
        for (let i = 0; i < bww * bh / 30; i++) { g.fillStyle = hsl(hh, ss, Math.max(2, l0 + rr(-7, 6)), rr(.15, .4)); g.fillRect(bx + rnd() * bww, by + rnd() * bh, rr(.6, 1.6), rr(.6, 1.4)); }
        g.fillStyle = rgba(255, lit ? 170 : 210, lit ? 90 : 170, (lit ? .18 + L * .4 : .07) * (by > G.LIGHT.y ? .5 : 1) * dark);
        g.fillRect(bx + 1, by + bh - 1.2, bww - 2, 1.2);
        g.fillStyle = rgba(0, 0, 0, .35); g.fillRect(bx + 1, by, bww - 2, 1);
        x += bw;
      }
    }
    if (!brick) {
      const sg = g.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
      sg.addColorStop(0, rgba(0, 0, 0, .45)); sg.addColorStop(.12, rgba(0, 0, 0, 0)); sg.addColorStop(.88, rgba(0, 0, 0, 0)); sg.addColorStop(1, rgba(0, 0, 0, .45));
      g.fillStyle = sg; g.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    if (fadeTop) { // fade into the niche wood above, rather than ending on a hard line
      g.globalCompositeOperation = 'destination-out';
      const f = g.createLinearGradient(0, rect.y, 0, rect.y + fadeTop);
      f.addColorStop(0, rgba(0, 0, 0, 1)); f.addColorStop(.35, rgba(0, 0, 0, .75)); f.addColorStop(1, rgba(0, 0, 0, 0));
      g.fillStyle = f; g.fillRect(rect.x, rect.y, rect.w, fadeTop); g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }
  function firebox(g, lit) {
    const o = G.OP, d = o.w * .17, top = o.y + o.arch * .4, FIRE = G.FIRE;
    const back = {x: o.x + d, y: top + o.h * .1, w: o.w - d * 2, b: o.b - o.h * .1};
    const brickRow = G.wide ? 8 : 6;
    g.save(); archPath(g, o); g.clip();
    g.fillStyle = hsl(10, 40, 3); g.fillRect(o.x, o.y - o.arch, o.w, o.h + o.arch);
    for (let y = back.b, r = 0; y > o.y - o.arch; y -= brickRow, r++) {
      for (let x = back.x - (r % 2) * brickRow * 1.1; x < back.x + back.w; x += brickRow * 2.2) {
        const L = lit ? clamp(1.25 - Math.hypot((x - FIRE.cx) / (o.w * .55), (y - FIRE.base) / (o.h * .8)), 0, 1) : .04;
        g.fillStyle = hsl(12 + rr(-3, 3), 40 + L * 20, 7 + L * 34 + rr(-2, 2));
        g.fillRect(Math.max(back.x, x) + .6, y - brickRow + .6, brickRow * 2.2 - 1.2, brickRow - 1.2);
      }
    }
    const span = o.b - o.y + o.arch, bspan = back.b - o.y + o.arch;
    for (const side of [-1, 1]) {
      const ox = side < 0 ? o.x : o.x + o.w, bx = side < 0 ? back.x : back.x + back.w;
      const n = Math.ceil(bspan / brickRow);
      for (let i = 0; i < n; i++) {
        const y1 = back.b - i * brickRow, y0 = y1 - brickRow;
        const oy1 = o.b - i * brickRow * span / bspan, oy0 = oy1 - brickRow * span / bspan;
        const L = lit ? clamp(1.1 - Math.abs(y1 - FIRE.base) / (o.h * .9), 0, 1) * .8 : .03;
        g.fillStyle = hsl(12, 38 + L * 15, 5 + L * 26 + rr(-2, 2));
        g.beginPath(); g.moveTo(bx, y0 + .6); g.lineTo(ox, oy0 + .6); g.lineTo(ox, oy1 - .6); g.lineTo(bx, y1 - .6); g.closePath(); g.fill();
      }
    }
    g.fillStyle = lit ? hsl(20, 70, 27, .9) : hsl(15, 45, 5);
    g.beginPath(); g.moveTo(back.x, back.b); g.lineTo(back.x + back.w, back.b); g.lineTo(o.x + o.w, o.b); g.lineTo(o.x, o.b); g.closePath(); g.fill();
    for (let i = 0; i < 60; i++) { g.fillStyle = lit ? rgba(255, 150, 70, rr(.1, .4)) : rgba(70, 50, 40, rr(.1, .4)); const t = rnd(); const y = mix(back.b, o.b, t), x = mix(mix(back.x, o.x, t), mix(back.x + back.w, o.x + o.w, t), rnd()); g.fillRect(x, y, rr(1, 2.4), 1); }
    const sg = g.createLinearGradient(0, o.y - o.arch, 0, o.y + o.h * .55);
    sg.addColorStop(0, rgba(0, 0, 0, .92)); sg.addColorStop(1, rgba(0, 0, 0, 0));
    g.fillStyle = sg; g.fillRect(o.x, o.y - o.arch, o.w, o.h);
    g.restore();
    // voussoirs round the arch, keystone in the middle, quoins down the jambs
    const ring = G.wide ? 11 : 7, n = 13;
    const q = t => { const x0 = o.x, y0 = o.y + o.arch, cx = o.x + o.w / 2, cy = o.y - o.arch * .95, x1 = o.x + o.w, u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y0, 2 * u * (cx - x0) + 2 * t * (x1 - cx), 2 * u * (cy - y0) + 2 * t * (y0 - cy)]; };
    const outer = (t, k) => { const [x, y, dx, dy] = q(t), l = Math.hypot(dx, dy); return [x + dy / l * ring * k, y - dx / l * ring * k]; };
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, k = i === n >> 1 ? 1.45 : 1;
      const [ax, ay] = q(t0), [bx, by] = q(t1), [cx, cy] = outer(t1, k), [dx, dy] = outer(t0, k);
      const L = lit ? clamp(1 - Math.abs(t0 + .5 / n - .5) * .5, 0, 1) : .1;
      const gg = g.createLinearGradient(ax, ay, dx, dy);
      gg.addColorStop(0, hsl(26, 14 + L * 30, 24 + L * 26 + rr(-3, 3))); gg.addColorStop(1, hsl(26, 12 + L * 20, 16 + L * 12));
      g.fillStyle = gg; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.lineTo(dx, dy); g.closePath(); g.fill();
      g.strokeStyle = rgba(0, 0, 0, .55); g.lineWidth = 1; g.stroke();
    }
    for (const side of [0, 1]) for (let y = o.y + o.arch, j = 0; y < o.b - 2; j++) {
      const hh = Math.min(o.b - y, ring * (j % 2 ? 1.3 : 1.7)), ww = ring * (j % 2 ? 1 : 1.5), x = side ? o.x + o.w : o.x - ww;
      const L = lit ? clamp(1 - Math.abs(y - FIRE.base) / (o.h * 1.2), .2, 1) : .1;
      const gg = g.createLinearGradient(side ? x : x + ww, 0, side ? x + ww : x, 0);
      gg.addColorStop(0, hsl(26, 14 + L * 30, 22 + L * 28 + rr(-3, 3))); gg.addColorStop(1, hsl(26, 12 + L * 18, 15 + L * 10));
      g.fillStyle = gg; g.fillRect(x, y, ww, hh); g.strokeStyle = rgba(0, 0, 0, .55); g.strokeRect(x + .5, y + .5, ww - 1, hh - 1);
      y += hh;
    }
    g.save(); archPath(g, o); g.strokeStyle = lit ? rgba(255, 170, 90, .6) : rgba(0, 0, 0, .6); g.lineWidth = 1.4; g.stroke(); g.restore();
  }
  function mantel(g, lit) {
    const m = G.mantel;
    for (const s of [0, 1]) {
      const cx = s ? m.x + m.w * .94 : m.x + m.w * .06, cw = m.w * .05;
      const cg = g.createLinearGradient(cx - cw, 0, cx + cw, 0);
      cg.addColorStop(0, hsl(25, 50, 9)); cg.addColorStop(.5, lit ? hsl(23, 55, 31) : hsl(26, 48, 16)); cg.addColorStop(1, hsl(25, 55, 7));
      g.fillStyle = cg; g.beginPath(); g.moveTo(cx - cw, m.y + m.h); g.lineTo(cx + cw, m.y + m.h); g.lineTo(cx + cw * .55, m.y + m.h * 2.9); g.quadraticCurveTo(cx, m.y + m.h * 4.1, cx - cw * .55, m.y + m.h * 2.9); g.closePath(); g.fill();
    }
    const bg = g.createLinearGradient(0, m.y, 0, m.y + m.h);
    if (lit) { bg.addColorStop(0, hsl(25, 50, 15)); bg.addColorStop(.55, hsl(24, 58, 26)); bg.addColorStop(1, hsl(24, 63, 46)); }
    else { bg.addColorStop(0, hsl(26, 48, 19)); bg.addColorStop(.5, hsl(26, 50, 15)); bg.addColorStop(1, hsl(26, 55, 9)); }
    g.fillStyle = bg; roundRect(g, m.x, m.y, m.w, m.h, 2); g.fill();
    g.fillStyle = rgba(255, 214, 150, .22); g.fillRect(m.x + 2, m.y, m.w - 4, 1);
    g.save(); roundRect(g, m.x, m.y, m.w, m.h, 2); g.clip();
    for (let i = 0; i < 22; i++) { g.strokeStyle = rgba(0, 0, 0, rr(.08, .22)); g.lineWidth = rr(.4, 1); const y = m.y + rr(2, m.h - 2); g.beginPath(); g.moveTo(m.x, y); g.bezierCurveTo(m.x + m.w * .3, y + rr(-2, 2), m.x + m.w * .7, y + rr(-2, 2), m.x + m.w, y + rr(-1, 1)); g.stroke(); }
    g.restore();
    for (const f of [.04, .96]) { const x = m.x + m.w * f, y = m.y + m.h / 2, sg = g.createRadialGradient(x - 1, y - 1, .5, x, y, 3); sg.addColorStop(0, hsl(43, 82, 79)); sg.addColorStop(1, hsl(36, 58, 26)); g.fillStyle = sg; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
    g.fillStyle = rgba(0, 0, 0, .5); g.fillRect(m.x + 3, m.y + m.h, m.w - 6, 3);
  }
  function bookPile(g, x, y, n, maxW, lit) {
    let yy = y;
    for (let i = 0; i < n; i++) {
      const [h, s, l] = BOOKCOL[(i * 3 + Math.floor(x)) % BOOKCOL.length];
      const bw = maxW * rr(.72, 1), bh = G.wide ? rr(5.5, 8) : rr(4, 5.5), bx = x + rr(-3, 3) - bw / 2;
      yy -= bh;
      const L = lit ? lightAt(bx + bw / 2, yy, .8) : .15;
      const gg = g.createLinearGradient(0, yy, 0, yy + bh);
      gg.addColorStop(0, hsl(h, s, l * (.5 + L * .9) + 6)); gg.addColorStop(1, hsl(h, s, l * (.35 + L * .7)));
      g.fillStyle = gg; roundRect(g, bx, yy, bw, bh, 1.4); g.fill();
      g.fillStyle = rgba(240, 225, 190, .55 + L * .3); g.fillRect(bx + bw - 2.5, yy + 1, 1.6, bh - 2);
      g.fillStyle = rgba(230, 190, 110, .25 + L * .4); g.fillRect(bx + 3, yy + 1, 1, bh - 2); g.fillRect(bx + 6, yy + 1, 1, bh - 2);
    }
  }
  function hearthSlab(g, lit) {
    const h = G.HEARTH, gg = g.createLinearGradient(0, h.y, 0, h.y + h.h);
    if (lit) { gg.addColorStop(0, hsl(25, 65, 57)); gg.addColorStop(.25, hsl(20, 56, 31)); gg.addColorStop(1, hsl(22, 55, 11)); }
    else { gg.addColorStop(0, hsl(24, 20, 24)); gg.addColorStop(.25, hsl(24, 22, 14)); gg.addColorStop(1, hsl(24, 30, 7)); }
    g.fillStyle = gg; roundRect(g, h.x, h.y, h.w, h.h, 2); g.fill();
    g.fillStyle = rgba(0, 0, 0, .35); for (let i = 1; i < 5; i++) g.fillRect(h.x + h.w * i / 5, h.y + 2, 1, h.h - 2);
  }
  function drawStatic(g, lit) {
    g.clearRect(0, 0, W, H);
    const {SR, mantel: m, HEARTH} = G, s = G.wide ? 1 : .6;
    // C's back wall: brick across the niche, fading out under the lanterns; darker away from the fire
    const wy = Math.round(H * (G.wide ? .2 : .16));
    wall(g, {x: 6, y: wy, w: W - 12, h: H - 2 - wy}, lit, {base: 12, fadeTop: (H - wy) * .3, brick: true, course: G.wide ? 12 : 9, hue: 18, sat: 20, far: .55});
    // stone chimney breast rising from the mantel and fading out under the tagline, then the surround
    const cw = SR.w * .78, top = G.wide ? G.TLB + 10 : Math.max(G.TLB + 4, m.y - SR.h * .9);
    if (m.y - top > 20) wall(g, {x: SR.x + (SR.w - cw) / 2, y: top, w: cw, h: m.y - top + 2}, lit, {fadeTop: (m.y - top) * .85, base: 13, course: G.wide ? 15 : 11});
    wall(g, {x: SR.x, y: m.y + m.h - 2, w: SR.w, h: SR.y + SR.h - m.y - m.h + 2}, lit, {base: 18, course: G.wide ? 15 : 11});
    firebox(g, lit); hearthSlab(g, lit); mantel(g, lit);
    // books around the fire: a pile at each end of the mantel, two on the hearth corners
    bookPile(g, m.x + m.w * .13, m.y, G.wide ? 3 : 2, 26 * s, lit);
    bookPile(g, m.x + m.w * .87, m.y, G.wide ? 4 : 2, 24 * s, lit);
    bookPile(g, HEARTH.x + 22 * s, HEARTH.y + 3, G.wide ? 4 : 2, 30 * s, lit);
    bookPile(g, HEARTH.x + HEARTH.w - 22 * s, HEARTH.y + 3, G.wide ? 5 : 3, 32 * s, lit);
  }
  /* ----- logs ----- */
  let LOGS = [];
  function drawLogs(gB, gFr) {
    const {FIRE, OP} = G, b = FIRE.base, w = FIRE.w, r = Math.max(4, OP.h * .07);
    LOGS = [
      {x0: FIRE.cx - w * .46, y0: b + r * .2, x1: FIRE.cx + w * .2, y1: b - r * 1.4, r: r * .95},
      {x0: FIRE.cx + w * .46, y0: b + r * .3, x1: FIRE.cx - w * .15, y1: b - r * 1.2, r: r * .9},
      {x0: FIRE.cx - w * .42, y0: b + r * 1.3, x1: FIRE.cx + w * .42, y1: b + r * 1.25, r},
    ];
    for (const L of LOGS) {
      const g = L === LOGS[2] ? gFr : gB;
      const a = Math.atan2(L.y1 - L.y0, L.x1 - L.x0), len = Math.hypot(L.x1 - L.x0, L.y1 - L.y0);
      g.save(); g.translate(L.x0, L.y0); g.rotate(a);
      const lg = g.createLinearGradient(0, -L.r, 0, L.r);
      lg.addColorStop(0, hsl(22, 48, 24)); lg.addColorStop(.35, hsl(23, 56, 11)); lg.addColorStop(1, hsl(22, 50, 3));
      g.fillStyle = lg; roundRect(g, 0, -L.r, len, L.r * 2, L.r * .9); g.fill();
      for (let i = 0; i < len / 3; i++) { g.strokeStyle = rgba(0, 0, 0, rr(.2, .5)); g.lineWidth = rr(.5, 1.2); const x = rr(2, len - 2); g.beginPath(); g.moveTo(x, -L.r * .9); g.lineTo(x + rr(-3, 3), L.r * .9); g.stroke(); }
      const eg = g.createRadialGradient(len, 0, 0, len, 0, L.r);
      eg.addColorStop(0, hsl(28, 50, 55)); eg.addColorStop(.6, hsl(26, 48, 36)); eg.addColorStop(1, hsl(25, 56, 15));
      g.fillStyle = eg; g.beginPath(); g.ellipse(len, 0, L.r * .45, L.r * .95, 0, 0, 7); g.fill();
      g.restore();
    }
  }

  /* ----- fire state ----- */
  let TONGUES = [], sparks = [], licks = [], motes = [], QK = 1, lowFps = 0;
  function buildFire() {
    const p = Quality.params();
    QK = p.particles; lowFps = p.frameMs || 0;
    const NT = p.name === 'low' ? 6 : 10;
    seed = 11; TONGUES = [];
    for (let i = 0; i < NT; i++) {
      const u = i / (NT - 1) - .5, inner = i % 3 === 1 && Math.abs(u) < .34;
      TONGUES.push({x: u * .8 + rr(-.05, .05), h: .22 + Math.exp(-u * u * 7) * rr(.62, 1.05), w: rr(.12, .19) * (inner ? .62 : 1), sp: rr(.9, 1.6), ph: rr(0, 100), inner, dy: rr(-.02, .03)});
    }
    TONGUES.sort((a, b) => a.inner - b.inner);
    sparks = []; licks = [];
    const n = p.ambient ? Math.round(30 * QK * (G.wide ? 1 : .5)) : 0;
    motes = []; for (let i = 0; i < n; i++) motes.push({x: rnd() * W, y: rnd() * H, vx: rr(-6, 6), vy: -rr(4, 14), r: rr(.5, 1.4), ph: rr(0, 9)});
  }
  let t = 0, last = 0, lastDraw = 0, flare = 0, hover = 0, lean = 0, px = -1e4, py = -1e4, I = 1;
  function spawn(burst) {
    if (sparks.length > 140 * QK) return;
    const {FIRE, OP} = G, a = rr(-1, 1);
    sparks.push({x: FIRE.cx + a * FIRE.w * .35, y: FIRE.base - rr(0, OP.h * .2), vx: rr(-14, 14) + (burst ? a * 30 : 0), vy: -rr(36, 80) * (burst ? 2.1 : 1) * (OP.h / 140) * (.75 + .25 * MH), life: 0, max: rr(.8, burst ? 2.6 : 2.2), r: rr(.6, 1.6), ph: rr(0, 9), esc: G.wide && QK > .5 && rnd() < .4});
  }
  function stoke() {
    if (!G) return;
    flare = 1;
    if (sfx && sfx.whoosh) try { sfx.whoosh(.35); } catch (e) {}
    if (reducedMotion()) { kick(); return; }
    for (let i = 0; i < 46 * QK; i++) spawn(true);
    kick();
  }
  /* a quiet pop of the fire for the idle room: a few sparks and a small flare, no whoosh */
  function pop(n = 6, lift = 0) {
    if (!G || reducedMotion()) return;
    flare = Math.max(flare, lift);
    for (let i = 0; i < n * QK; i++) spawn(false);
    kick();
  }
  function tongue(g, T, time, ox, base, sw, sh) {
    const h = T.h * sh * I * (.78 + .22 * S(time * T.sp * 1.9 + T.ph) / 1.75) * (T.inner ? .62 : 1);
    const w = T.w * sw * (T.inner ? 1 : 1.1), x0 = ox + T.x * sw;
    base += T.dy * sh;
    const K = 14, Lp = [], Rp = [];
    for (let k = 0; k <= K; k++) {
      const u = k / K, y = base - u * h;
      const sway = S(time * 2.3 * T.sp + T.ph - u * 3.2) * sw * .045 * u + lean * Math.pow(u, 1.6) * h * .55 + S(time * 5.1 + T.ph * 2 - u * 7) * sw * .012 * u;
      let half = w * .5 * Math.pow(1 - u, .75) * (1 + .22 * S(time * 3.1 + T.ph + u * 5) / 1.75);
      if (u < .14) half *= .55 + u / .14 * .45;
      Lp.push([x0 + sway - half, y]); Rp.push([x0 + sway + half, y]);
    }
    const gg = g.createLinearGradient(0, base, 0, base - h);
    if (T.inner) { gg.addColorStop(0, rgba(255, 252, 225, .95)); gg.addColorStop(.3, rgba(255, 220, 120, .85)); gg.addColorStop(.7, rgba(255, 150, 45, .35)); gg.addColorStop(1, rgba(255, 120, 30, 0)); }
    else { gg.addColorStop(0, rgba(255, 190, 80, .85)); gg.addColorStop(.3, rgba(255, 125, 30, .62)); gg.addColorStop(.72, rgba(200, 52, 12, .28)); gg.addColorStop(1, rgba(140, 25, 5, 0)); }
    g.fillStyle = gg; g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]);
    for (let k = 1; k < Lp.length; k++) { const p = Lp[k - 1], q = Lp[k]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    for (let k = Rp.length - 1; k >= 0; k--) g.lineTo(Rp[k][0], Rp[k][1]);
    g.closePath(); g.fill();
  }
  function grate(g) {
    const {FIRE, OP} = G, b = FIRE.base, w = FIRE.w * 1.02, x0 = FIRE.cx - w / 2, r = Math.max(4, OP.h * .07);
    const railY = b + r * 2.6, barH = r * 2.3, nb = G.wide ? 8 : 6, bw = G.wide ? 3 : 2;
    const iron = (x, y, ww, hh) => { const gg = g.createLinearGradient(x, 0, x + ww, 0); gg.addColorStop(0, hsl(15, 20, 4)); gg.addColorStop(.5, hsl(18, 18, 14)); gg.addColorStop(1, hsl(15, 20, 4)); g.fillStyle = gg; g.fillRect(x, y, ww, hh); };
    for (let i = 0; i <= nb; i++) { const x = x0 + i * w / nb - bw / 2; iron(x, railY - barH, bw, barH + r * .8); g.fillStyle = rgba(255, 150 + I * 40 | 0, 70, .35 + .3 * I); g.fillRect(x, railY - barH, bw, 1.2); }
    for (const [yy, hh] of [[railY - barH * .55, bw * .9], [railY, bw * 1.4]]) {
      const gg = g.createLinearGradient(0, yy, 0, yy + hh); gg.addColorStop(0, rgba(255, 150, 70, .25 + .25 * I)); gg.addColorStop(.35, hsl(18, 20, 13)); gg.addColorStop(1, hsl(15, 25, 3));
      g.fillStyle = gg; roundRect(g, x0 - 2, yy, w + 4, hh, 1); g.fill();
    }
    for (const sx of [x0 - 4, x0 + w + 4]) {
      iron(sx - bw, railY - barH * 1.35, bw * 2, barH * 1.35 + r * 1.2);
      const fy = railY - barH * 1.35 - 3, fr = G.wide ? 3.8 : 2.6, fg = g.createRadialGradient(sx - 1, fy - 1, .4, sx, fy, fr);
      fg.addColorStop(0, hsl(48, 100, 86)); fg.addColorStop(.5, hsl(39, 56, 52)); fg.addColorStop(1, hsl(36, 62, 19));
      g.fillStyle = fg; g.beginPath(); g.arc(sx, fy, fr, 0, 7); g.fill();
      g.fillStyle = hsl(15, 20, 3); g.fillRect(sx - bw * 2, OP.b - r * .7, bw * 4, r * .7);
    }
  }

  /* ----- frame ----- */
  const visible = () => !dead && G && !home.hidden && home.isConnected && !home.classList.contains('attic-away') && !doc.hidden;
  function kick() { if (!raf && visible()) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    if (!visible()) return;
    const rm = reducedMotion();
    const gap = lowFps || (home.classList.contains('book-opening') ? 33 : 0); /* half rate while a book is on screen: it frees the main thread for the book's motion */
    if (gap && now - lastDraw < gap - 2) { raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; lastDraw = now; t += dt;
    const {OP, FIRE, mantel} = G;
    const dx = px - FIRE.cx, dy = py - (FIRE.base - OP.h * .3), dist = Math.hypot(dx, dy), near = clamp(1 - dist / (OP.w * 1.6), 0, 1);
    lean += (-clamp(dx / (OP.w * .6), -1, 1) * .42 * near - lean) * Math.min(1, dt * 3.2);
    hover += ((dist < OP.w * .6 ? 1 : 0) - hover) * Math.min(1, dt * 2);
    flare = Math.max(0, flare - dt * .55);
    I = rm ? 1 + flare * .4 : fireIntensity(t, hover, flare);
    const g = cAnim.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    g.globalAlpha = clamp(.5 + .42 * (I - .85) / .5, .3, 1);
    g.drawImage(cLit, BB.x * DPR, BB.y * DPR, BB.w * DPR, BB.h * DPR, BB.x, BB.y, BB.w, BB.h);
    g.globalAlpha = 1;
    g.drawImage(cLogsB, FB.x * DPR, FB.y * DPR, FB.w * DPR, FB.h * DPR, FB.x, FB.y, FB.w, FB.h);
    g.globalCompositeOperation = 'lighter';
    for (const L of LOGS) for (let k = 0; k <= 4; k++) { const u = k / 4, x = mix(L.x0, L.x1, u), y = mix(L.y0, L.y1, u) + L.r * .6; g.globalAlpha = clamp((.18 + .14 * S(t * 3 + k * 1.7 + L.x0) / 1.75) * I, 0, 1); g.drawImage(EMBER, x - L.r * 2.4, y - L.r * 1.6, L.r * 4.8, L.r * 3.2); }
    g.globalAlpha = clamp(.55 * I * (.7 + .3 * MH), 0, 1); g.drawImage(EMBER, FIRE.cx - FIRE.w * .7, FIRE.base - OP.h * .32, FIRE.w * 1.4, OP.h * (.3 + .32 * MH));
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // flames: drawn at half resolution, then scaled up (soft edges for free), clipped to the opening
    gF.clearRect(0, 0, G.fw, G.fh); gF.globalCompositeOperation = 'lighter';
    const ox = (FIRE.cx - OP.x) / 2 + 2, base = (FIRE.base - (OP.y - OP.arch)) / 2 + 2 + OP.h * .01;
    for (const T of TONGUES) tongue(gF, T, t, ox, base, FIRE.w / 2, OP.h * 1.02 / 2 * MH);
    if (!rm && QK > .5 && Math.random() < dt * 9 * I) { const T = TONGUES[(Math.random() * TONGUES.length) | 0]; licks.push({x: ox + T.x * FIRE.w / 2 + lean * 8, y: base - T.h * OP.h * .4 * rr(.55, .85), life: 0, max: rr(.22, .42), w: rr(3, 6) * FIRE.w / 220, vy: -rr(28, 50) * OP.h / 300}); }
    for (let i = licks.length - 1; i >= 0; i--) { const k = licks[i]; k.life += dt; if (k.life > k.max) { licks.splice(i, 1); continue; } k.y += k.vy * dt; k.x += lean * 20 * dt; const f = 1 - k.life / k.max; gF.globalAlpha = f * .8; gF.drawImage(LICK, k.x - k.w * f, k.y - k.w * 2.6 * f, k.w * 2 * f, k.w * 5.2 * f); }
    gF.globalAlpha = 1; gF.globalCompositeOperation = 'source-over';
    g.save(); archPath(g, OP); g.clip(); g.globalCompositeOperation = 'lighter';
    g.drawImage(cF, OP.x - 4, OP.y - OP.arch - 4, G.fw * 2, G.fh * 2);
    g.restore(); g.globalCompositeOperation = 'source-over';
    g.drawImage(cLogsF, FB.x * DPR, FB.y * DPR, FB.w * DPR, FB.h * DPR, FB.x, FB.y, FB.w, FB.h);
    g.globalCompositeOperation = 'lighter';
    { const L = LOGS[2]; for (let k = 1; k < 6; k++) { const x = mix(L.x0, L.x1, k / 6), y = L.y0 - L.r * .7; g.globalAlpha = clamp((.22 + .16 * S(t * 2.6 + k * 2.3) / 1.75) * I, 0, 1); g.drawImage(EMBER, x - L.r * 2, y - L.r * 1.1, L.r * 4, L.r * 2.2); } }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    grate(g);
    // sparks from the fire; a few escape into the room, and embers drift in the air
    if (!rm) {
      if (Math.random() < (14 * MH * MH + flare * 30) * QK * dt) spawn(false);
      g.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]; p.life += dt;
        if (p.life > p.max) { sparks.splice(i, 1); continue; }
        p.vy -= 8 * dt; p.vx += S(t * 2 + p.ph) * 20 * dt + lean * 30 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt;
        if (!p.esc && !(p.y > OP.y && p.x > OP.x && p.x < OP.x + OP.w)) { sparks.splice(i, 1); continue; }
        const k = 1 - p.life / p.max, s = p.r * (4 + 3 * k) * (G.wide ? 1 : .7);
        g.globalAlpha = clamp(k * 1.3, 0, 1) * (.6 + .4 * Math.sin(t * 20 + p.ph)); g.drawImage(SPARK, p.x - s, p.y - s, s * 2, s * 2);
      }
      for (const m of motes) {
        m.x += (m.vx + S(t * .6 + m.ph) * 5 + lean * 6) * dt; m.y += m.vy * dt;
        if (m.y < 20) { m.y = H - rr(0, 60); m.x = FIRE.cx + rr(-W * .45, W * .45); }
        if (m.x < 0) m.x += W; if (m.x > W) m.x -= W;
        const s = m.r * 4; g.globalAlpha = clamp((.18 + lightAt(m.x, m.y, 2.6) * .8) * (.55 + .45 * Math.sin(t * 2.3 + m.ph * 3)), 0, 1);
        g.drawImage(EMBER, m.x - s, m.y - s, s * 2, s * 2);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    void mantel;
    if (glowEl) glowEl.style.setProperty('--hl-k', clamp((.7 + .08 * MH) + (I - 1) * 1.6, .5, 1).toFixed(3));
    try { Quality.sample(now); } catch (e) {}
    if (!rm || flare > 0) raf = requestAnimationFrame(frame);
  }

  /* ----- room light ----- */
  function paintLight() {
    const {LIGHT, HEARTH, SR, hr} = G, vw = innerWidth, vh = innerHeight;
    const lx = hr.left + LIGHT.x, ly = hr.top + LIGHT.y, gr = Math.max(vw, vh) * (G.wide ? .62 : .9);
    setVar('--hl-x', lx + 'px'); setVar('--hl-y', ly + 'px'); setVar('--hl-r', gr + 'px');
    setVar('--hl-fx', (hr.left + SR.x + SR.w / 2) + 'px'); setVar('--hl-fy', (hr.top + HEARTH.y + HEARTH.h) + 'px');
    setVar('--hl-fw', SR.w * 1.3 + 'px'); setVar('--hl-fh', SR.w * .26 + 'px');
    syncLit();
  }
  const syncLit = () => root.classList.toggle('hearth-lit', !!(G && !home.hidden && home.isConnected && !home.classList.contains('attic-away')));

  /* ----- events ----- */
  const toLocal = e => { const r = home.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const inFire = (x, y) => G && x > G.OP.x - 10 && x < G.OP.x + G.OP.w + 10 && y > G.OP.y - G.OP.arch && y < G.OP.b + 14;
  // the fire sits under the home's empty space, where the pointer lands on the world canvas, so listen on the window
  const busy = e => !visible() || home.classList.contains('book-opening') || (e.target && e.target.closest && e.target.closest('button,a,[role=button],input,textarea,.bk-spread'));
  const onMove = e => { [px, py] = toLocal(e); root.classList.toggle('hearth-hover', !busy(e) && inFire(px, py)); kick(); };
  const onLeave = () => { px = py = -1e4; root.classList.remove('hearth-hover'); };
  const onDown = e => { if (busy(e)) return; const [x, y] = toLocal(e); if (inFire(x, y)) stoke(); };
  addEventListener('pointermove', onMove, {passive: true}); doc.addEventListener('pointerleave', onLeave); addEventListener('pointerdown', onDown, {passive: true});
  let pend = 0; const relayout = () => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; layout(); }); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(relayout) : null; if (ro) ro.observe(home);
  addEventListener('resize', relayout);
  const mo = new MutationObserver(() => { syncLit(); if (!layer.hidden && !G && !home.hidden) relayout(); kick(); });
  mo.observe(home, {attributes: true, attributeFilter: ['hidden', 'class']});
  // the hearth pops now and then (sound palette: fire); stops with the hearth, quiet in a hidden tab
  let crackleT = 0;
  const crackle = () => { if (dead) return; if (sfx && sfx.cue && !doc.hidden) try { sfx.cue('crackle'); } catch (e) {} crackleT = setTimeout(crackle, rr(900, 4200)); };
  crackleT = setTimeout(crackle, 1500);
  const onVis = () => kick(); doc.addEventListener('visibilitychange', onVis);
  const unQ = Quality.subscribe(() => relayout());
  // fonts and the home's own tiering settle over the first frames: lay out once now and again when fonts are ready
  layout();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!dead) relayout(); });

  return {
    stoke,
    pop,
    layout,
    get geom() { return G; },
    destroy() {
      dead = true; clearTimeout(crackleT); cancelAnimationFrame(raf); raf = 0; if (pend) cancelAnimationFrame(pend);
      if (ro) ro.disconnect(); mo.disconnect(); unQ && unQ(); removeEventListener('resize', relayout); doc.removeEventListener('visibilitychange', onVis);
      removeEventListener('pointermove', onMove); doc.removeEventListener('pointerleave', onLeave); removeEventListener('pointerdown', onDown); root.classList.remove('hearth-hover');
      undo(); layer.remove(); root.classList.remove('hearth-lit');
    },
  };
}
