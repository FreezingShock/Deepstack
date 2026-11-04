// The one way to draw a book spine. Used by the canvas world (shelves, ledge, held book) and by the DOM spine
// images (menu shelf, recents, results). Each tier has its own cover material, drawn from the tier colour
// (src/theme/colors.js) with variety coming from value (darker edges, stripes, sheen), never from muted hues:
//   0 Pamphlet  card, stapled        1 Paperback cloth, woven      2 Hardbound board, headbands, hinge grooves
//   3 Folio     vellum, laced edges  4 Codex       gilt, tooled      5 Grimoire runed leather, strap and seal
//   6 Apocrypha glowing veins and aura
// bookArt(c, o, t): o = {w,h,tier(-1 filler),col,seed,word,fit,ribbon,dust}; origin is bottom-centre; t is seconds.
import {PALETTE} from '../theme/colors.js';
import {TIERS} from '../core/tiers.js';
import {mulberry} from '../core/daily.js';
import {spineFont} from './spineLabel.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
export const mixc = (c, t, f) => c.map((v, i) => Math.round(v + (t[i] - v) * f));
export const rgbs = c => `rgb(${c[0]},${c[1]},${c[2]})`;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const BLACK = [0, 0, 0], PAPER = [255, 232, 190], WHITE = [255, 255, 255];
const TIERRGB = TIERS.map(t => hex(t.spine));
// the real tier hue, only a little darker so it still reads in a dark library
export function tierBase(t) { return mixc(TIERRGB[t], BLACK, t >= 4 ? .24 : .3); }
export const LEATHER = [[70, 38, 26], [92, 30, 32], [38, 58, 44], [34, 44, 74], [96, 70, 34], [56, 50, 46], [82, 52, 34], [64, 36, 56]];
export const RIBBONS = [PALETTE.bloodA3202a, PALETTE.bronze47, PALETTE.bronze2d6a4f, PALETTE.steel36, PALETTE.bronze7a2a7a];
export const TIER_MATERIALS = ['card', 'cloth', 'board', 'vellum', 'gilt', 'runed leather', 'glow'];

// each material paints inside the clipped spine, before bands and lettering. m: {x0,y0,w,h,base,dark,light,rng,t,seed}
const MATERIAL = [
  // Pamphlet: thin card, paper fibres, a folded crease and two staples
  (c, m) => {
    c.globalAlpha = .16; c.strokeStyle = rgba(PAPER, 1); c.lineWidth = .8; c.beginPath();
    for (let i = 0; i < Math.max(6, m.w * m.h / 90); i++) { const x = m.x0 + m.rng() * m.w, y = m.y0 + m.rng() * m.h; c.moveTo(x, y); c.lineTo(x + (m.rng() - .5) * 4, y + 1 + m.rng() * 4); }
    c.stroke(); c.globalAlpha = 1;
    c.fillStyle = rgba(BLACK, .28); c.fillRect(m.x0 + m.w * .12, m.y0, 1.2, m.h);
    c.fillStyle = rgba(WHITE, .14); c.fillRect(m.x0 + m.w * .12 + 1.2, m.y0, 1, m.h);
    for (const p of [.2, .78]) { const y = m.y0 + m.h * p; c.fillStyle = PALETTE.steel36; c.fillRect(m.x0 + m.w * .12 - 2, y, 5, 1.6); c.fillStyle = rgba(WHITE, .5); c.fillRect(m.x0 + m.w * .12 - 2, y, 5, .5); }
  },
  // Paperback: woven cloth and a glued, creased spine
  (c, m) => {
    c.lineWidth = 1; c.strokeStyle = rgba(BLACK, .13); c.beginPath();
    for (let y = m.y0 + 1.5; y < m.y0 + m.h; y += 2.4) { c.moveTo(m.x0, y); c.lineTo(m.x0 + m.w, y); }
    c.stroke(); c.strokeStyle = rgba(WHITE, .07); c.beginPath();
    for (let x = m.x0 + 1.5; x < m.x0 + m.w; x += 2.4) { c.moveTo(x, m.y0); c.lineTo(x, m.y0 + m.h); }
    c.stroke();
    c.fillStyle = rgba(BLACK, .3); c.fillRect(m.x0 + m.w * .16, m.y0, 1.2, m.h);
    c.fillStyle = rgba(m.light, .22); c.fillRect(m.x0 + m.w * .16 + 1.2, m.y0, 1.4, m.h);
  },
  // Hardbound: smooth board, two hinge grooves, striped headbands top and bottom
  (c, m) => {
    c.fillStyle = rgba(BLACK, .4); c.fillRect(m.x0 + m.w * .14, m.y0, 1.4, m.h); c.fillRect(m.x0 + m.w * .86, m.y0, 1.4, m.h);
    c.fillStyle = rgba(WHITE, .1); c.fillRect(m.x0 + m.w * .14 + 1.4, m.y0, 1, m.h);
    const hb = Math.max(2, Math.min(4, m.w * .14));
    for (const y of [m.y0 + 1, m.y0 + m.h - hb - 1]) for (let i = 0; i * 2.5 < m.w; i++) { c.fillStyle = i % 2 ? rgba(PAPER, .75) : rgba(m.dark, 1); c.fillRect(m.x0 + i * 2.5, y, 2.5, hb); }
    const g = c.createLinearGradient(m.x0, 0, m.x0 + m.w, 0); g.addColorStop(.3, rgba(WHITE, 0)); g.addColorStop(.42, rgba(WHITE, .18)); g.addColorStop(.55, rgba(WHITE, 0));
    c.fillStyle = g; c.fillRect(m.x0, m.y0, m.w, m.h);
  },
  // Folio: mottled vellum with a sheen, laced edge stitches and raised cords
  (c, m) => {
    for (let i = 0; i < 5; i++) { c.globalAlpha = .12 + m.rng() * .1; c.fillStyle = rgba(m.rng() < .5 ? m.light : m.dark, 1); c.beginPath(); c.ellipse(m.x0 + m.rng() * m.w, m.y0 + m.rng() * m.h, m.w * (.25 + m.rng() * .4), 6 + m.rng() * 14, m.rng() * 3, 0, 6.3); c.fill(); }
    c.globalAlpha = 1;
    const g = c.createLinearGradient(m.x0, m.y0, m.x0 + m.w, m.y0 + m.h * .5); g.addColorStop(0, rgba(WHITE, 0)); g.addColorStop(.45, rgba(WHITE, .2)); g.addColorStop(.6, rgba(WHITE, 0));
    c.fillStyle = g; c.fillRect(m.x0, m.y0, m.w, m.h);
    c.fillStyle = rgba(PAPER, .6);
    for (let y = m.y0 + 5; y < m.y0 + m.h - 3; y += 6) { c.fillRect(m.x0 + 2.5, y, 1.4, 3); c.fillRect(m.x0 + m.w - 3.9, y, 1.4, 3); }
  },
  // Codex: gilt tooling, a double rule frame, fleurons and a foil streak that slowly crosses
  (c, m) => {
    const gold = mixc(TIERRGB[4], PAPER, .38);
    c.strokeStyle = rgba(gold, .85); c.lineWidth = 1;
    c.strokeRect(m.x0 + 3.5, m.y0 + 3.5, m.w - 7, m.h - 7); c.strokeStyle = rgba(gold, .45); c.strokeRect(m.x0 + 5.5, m.y0 + 5.5, m.w - 11, m.h - 11);
    c.fillStyle = rgba(gold, .9);
    for (const p of [.34, .72]) { c.save(); c.translate(0, m.y0 + m.h * p); c.rotate(.785); const r = Math.max(1.6, Math.min(3, m.w * .09)); c.fillRect(-r, -r, r * 2, r * 2); c.restore(); }
    const k = ((m.t * .22 + m.seed * .013) % 1.6) - .3, sx = m.x0 + m.w * k;
    const g = c.createLinearGradient(sx - m.w * .3, m.y0, sx + m.w * .3, m.y0 + m.h); g.addColorStop(0, rgba(WHITE, 0)); g.addColorStop(.5, rgba(WHITE, .22)); g.addColorStop(1, rgba(WHITE, 0));
    c.fillStyle = g; c.fillRect(m.x0, m.y0, m.w, m.h);
  },
  // Grimoire: cracked leather, rune glyphs that breathe, a buckled strap
  (c, m) => {
    c.strokeStyle = rgba(BLACK, .35); c.lineWidth = .8; c.beginPath();
    for (let i = 0; i < Math.max(5, m.w * m.h / 260); i++) { let x = m.x0 + m.rng() * m.w, y = m.y0 + m.rng() * m.h; c.moveTo(x, y); for (let j = 0; j < 3; j++) { x += (m.rng() - .5) * 6; y += 2 + m.rng() * 5; c.lineTo(x, y); } }
    c.stroke();
    const glow = .55 + Math.sin(m.t * 1.6 + m.seed) * .25, rune = mixc(TIERRGB[5], PAPER, .35);
    c.strokeStyle = rgba(rune, glow); c.lineWidth = 1; c.lineCap = 'round'; c.shadowColor = rgba(TIERRGB[5], 1); c.shadowBlur = 4;
    const rs = Math.min(m.w * .5, 7), n = Math.max(1, Math.floor(m.h * .5 / (rs * 2.4)));
    for (let i = 0; i < n; i++) {
      const cy = m.y0 + m.h * .66 + (i - (n - 1) / 2) * rs * 2.4 - m.h * .1, v = (m.seed + i * 7) % 5; c.beginPath();
      if (v === 0) { c.moveTo(0, cy - rs); c.lineTo(0, cy + rs); c.moveTo(0, cy - rs); c.lineTo(rs * .6, cy - rs * .2); }
      else if (v === 1) { c.moveTo(-rs * .5, cy - rs); c.lineTo(rs * .5, cy); c.lineTo(-rs * .5, cy + rs); }
      else if (v === 2) { c.moveTo(-rs * .5, cy + rs); c.lineTo(0, cy - rs); c.lineTo(rs * .5, cy + rs); c.moveTo(-rs * .3, cy + rs * .2); c.lineTo(rs * .3, cy + rs * .2); }
      else if (v === 3) { c.moveTo(-rs * .5, cy - rs); c.lineTo(rs * .5, cy + rs); c.moveTo(rs * .5, cy - rs); c.lineTo(-rs * .5, cy + rs); }
      else { c.moveTo(0, cy - rs); c.lineTo(rs * .5, cy); c.lineTo(0, cy + rs); c.lineTo(-rs * .5, cy); c.closePath(); }
      c.stroke();
    }
    c.shadowBlur = 0; c.lineCap = 'butt';
    const sy = m.y0 + m.h * .9; c.fillStyle = rgba(BLACK, .5); c.fillRect(m.x0, sy, m.w, 4); c.fillStyle = rgba(WHITE, .1); c.fillRect(m.x0, sy, m.w, 1);
    c.fillStyle = PALETTE.brass66; c.fillRect(-2, sy - .5, 4, 5);
    c.fillStyle = rgba(BLACK, .6); c.fillRect(-1, sy + 1, 2, 2);
  },
  // Apocrypha: pale core, drifting glowing veins
  (c, m) => {
    const g = c.createRadialGradient(0, m.y0 + m.h * .5, 0, 0, m.y0 + m.h * .5, m.h * .6);
    g.addColorStop(0, rgba(PAPER, .0)); g.addColorStop(0, rgba(WHITE, .32)); g.addColorStop(1, rgba(WHITE, 0)); c.fillStyle = g; c.fillRect(m.x0, m.y0, m.w, m.h);
    const vein = mixc(TIERRGB[6], WHITE, .45); c.lineWidth = 1; c.lineCap = 'round'; c.shadowColor = rgba(TIERRGB[6], 1); c.shadowBlur = 5;
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = rgba(vein, .35 + .3 * Math.sin(m.t * 1.4 + i * 2 + m.seed)); c.beginPath();
      let x = m.x0 + m.w * (.25 + .25 * i), y = m.y0 + 2; c.moveTo(x, y);
      while (y < m.y0 + m.h - 2) { y += 5 + m.rng() * 8; x = clamp(x + (m.rng() - .5) * m.w * .5, m.x0 + 2, m.x0 + m.w - 2); c.lineTo(x, y); }
      c.stroke();
    }
    c.shadowBlur = 0; c.lineCap = 'butt';
  }
];

export function bookArt(c, o, t = 0) {
  const rng = mulberry(o.seed | 0), w = o.w, h = o.h, x0 = -w / 2, y0 = -h, T = o.tier;
  const base = o.col || tierBase(T), dark = mixc(base, BLACK, .5), light = mixc(base, PAPER, .22);
  const worn = T <= 1;
  c.save();
  // Apocrypha's aura is drawn first so it blooms around the finished edge
  if (T === 6) { c.save(); c.shadowColor = rgba(TIERRGB[6], .9); c.shadowBlur = 9 + Math.sin(t * 1.4 + o.seed) * 3; c.fillStyle = rgbs(base); c.fillRect(x0, y0, w, h); c.restore(); }
  c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0, y0 + (worn ? rng() * 5 : 1));
  if (worn) { const n = Math.max(3, (w / 4) | 0); for (let i = 1; i <= n; i++) c.lineTo(x0 + w * i / n, y0 + rng() * (T === 0 || T === -1 && rng() < .4 ? 8 : 3.5)); } else c.lineTo(x0 + w, y0 + (T >= 4 ? 0 : 1.5));
  c.lineTo(x0 + w, 0); c.closePath();
  const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, rgbs(dark)); g.addColorStop(.2, rgbs(base)); g.addColorStop(.55, rgbs(light)); g.addColorStop(.86, rgbs(base)); g.addColorStop(1, rgbs(dark));
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  // grain + scuffs
  c.globalAlpha = .12; for (let i = 0; i < Math.max(8, w * h / 110); i++) { c.fillStyle = rng() < .5 ? PALETTE.black : PALETTE.white; c.fillRect(x0 + rng() * w, y0 + rng() * h, 1, 1 + rng() * (T >= 4 ? 2 : 5)); }
  if (T <= 2) { c.globalAlpha = .16; for (let i = 0; i < 3; i++) { c.fillStyle = PALETTE.parchmentE9d8b0; c.beginPath(); c.ellipse(x0 + rng() * w, y0 + rng() * h, w * (.2 + rng() * .4), 3 + rng() * 8, rng() * 3, 0, 6.3); c.fill(); } }
  c.globalAlpha = 1;
  if (T >= 0 && w >= 12) MATERIAL[T](c, {x0, y0, w, h, base, dark, light, rng, t, seed: o.seed | 0});
  // raised bands
  const bands = T >= 3 ? [.1, .2, .5, .84] : [.12, .2, .84];
  for (const p of bands) { const yy = y0 + h * p; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x0, yy, w, 2); c.fillStyle = T >= 4 ? PALETTE.brass66 : 'rgba(255,230,180,.26)'; c.fillRect(x0, yy + 2, w, 1.4); if (T >= 4) { c.fillStyle = PALETTE.whiteAlpha66; c.fillRect(x0 + w * .2, yy + 2, w * .3, .8); } }
  // label / lettering. Without a precomputed fit the font shrinks to the word; glyphs are never squeezed
  const F = o.fit; let fs = 0, lh;
  if (F) { fs = F.fs; lh = F.lh; }
  else if (o.word) {
    fs = clamp(w * .46, 8, 13); c.font = spineFont(fs);
    const room = h * .8 - 12; while (fs > 6 && c.measureText(o.word).width > room) { fs -= .5; c.font = spineFont(fs); }
    lh = Math.min(h * .8, c.measureText(o.word).width + 12);
  } else lh = Math.min(h * .5, 28);
  const lw = w * (F ? .82 : .7), ly = F ? y0 + F.top + (h - F.top - lh) / 2 : y0 + h * .3;
  if (T <= 2 && (o.word || T >= 1)) { c.save(); c.translate(0, ly + lh / 2); c.rotate(((o.seed % 7) - 3) * .012); c.fillStyle = PALETTE.parchmentE6d8b2; c.globalAlpha = .94; c.fillRect(-lw / 2, -lh / 2, lw, lh); c.globalAlpha = .4; c.fillStyle = PALETTE.black; c.fillRect(-lw / 2, -lh / 2, lw, 1); c.fillRect(-lw / 2, lh / 2 - 1, lw, 1); c.restore(); }
  if (T === 0 || T === -1 && rng() < .3) { c.save(); c.globalAlpha = .7; c.fillStyle = PALETTE.brassD8cca8; c.translate(0, y0 + h * .58); c.rotate(-.5); c.fillRect(-w * .7, -3, w * 1.4, 6); c.restore(); }
  if (T >= 4) { c.fillStyle = PALETTE.brass67; c.globalAlpha = .85; c.fillRect(x0 + w * .14, ly - 6, w * .72, 1.4); c.fillRect(x0 + w * .14, ly + lh + 4, w * .72, 1.4); c.globalAlpha = 1; }
  // damage + shading
  if (worn || T < 0) { c.globalAlpha = .3; const sg = c.createRadialGradient(x0 + w * .7, y0 + h * .8, 0, x0 + w * .7, y0 + h * .8, w); sg.addColorStop(0, PALETTE.oak10); sg.addColorStop(1, PALETTE.blackAlpha00); c.fillStyle = sg; c.fillRect(x0, y0, w, h); c.globalAlpha = 1; }
  if (o.dust) { c.globalAlpha = Math.min(.55, o.dust); const dg = c.createLinearGradient(0, y0, 0, y0 + h * .5); dg.addColorStop(0, PALETTE.brassCfc5ae); dg.addColorStop(1, PALETTE.brassCfc5aeAlpha00); c.fillStyle = dg; c.fillRect(x0, y0, w, h * .5); c.globalAlpha = 1; }
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x0, y0, 1.4, h); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x0 + w - 1.6, y0, 1.6, h);
  c.restore();
  // word on spine
  if (o.word) {
    c.save(); c.translate(0, ly + lh / 2); c.rotate(-Math.PI / 2);
    c.font = spineFont(fs); c.textAlign = 'center'; c.textBaseline = 'middle';
    if (T >= 3) {
      if (F) { c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = PALETTE.blackAlpha99; c.strokeText(o.word, 0, 0); c.fillStyle = PALETTE.brassF6d98a; }
      else { c.fillStyle = PALETTE.brass67; c.shadowColor = PALETTE.black; c.shadowBlur = 2; }
    } else c.fillStyle = PALETTE.ink;
    c.fillText(o.word, 0, 0); c.restore();
  }
  // gems / seals
  if (T === 5) { c.fillStyle = PALETTE.blood40; c.beginPath(); c.arc(0, y0 + h * .14, Math.min(5, w * .2), 0, 6.3); c.fill(); c.fillStyle = PALETTE.blood78; c.fillRect(-1, y0 + h * .14 - 2, 1.5, 1.5); }
  if (T === 6) { c.save(); c.translate(0, y0 + h * .14); c.rotate(.785); const r = Math.min(5.5, w * .2); const gg = c.createLinearGradient(-r, -r, r, r); gg.addColorStop(0, PALETTE.teal96); gg.addColorStop(.55, PALETTE.aqua); gg.addColorStop(1, PALETTE.teal40); c.fillStyle = gg; c.shadowColor = PALETTE.aqua; c.shadowBlur = 10; c.fillRect(-r, -r, r * 2, r * 2); c.restore(); }
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0, y0); c.lineTo(x0 + w, y0); c.lineTo(x0 + w, 0); c.stroke();
  // bookmark ribbon (hangs out of the bottom)
  if (o.ribbon) { const rx = x0 + w * (.25 + rng() * .4), rl = 10 + rng() * 14, sw = Math.sin(t * 1.3 + o.seed) * 1.2; c.fillStyle = o.ribbon; c.beginPath(); c.moveTo(rx, -3); c.lineTo(rx + 3.6, -3); c.lineTo(rx + 3.6 + sw, rl); c.lineTo(rx + 1.8 + sw, rl - 3.5); c.lineTo(rx + sw, rl); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(rx, -3, 1, rl * .8); }
  c.restore();
}
