/* Fallen books: where the shelf has a gap, a book or two that came down lie on the plank in front of it.
   placeFallen() is pure geometry (seeded per row, never overlapping a standing book, a pillar, a crack or the
   slot a pulled book leaves); drawFallen() paints them with the one book-art routine, turned onto its side.
   Kinds: toppled (one book lying spine out), stack (two or three flat, each inside the one below),
   open (face down, a tent of covers resting on its two outer edges). */
import {bookArt, rgbs} from './bookArt.js';
import {lyingFootprint} from './physics.js';
import {mulberry} from '../core/daily.js';

const PAD = 2.5;        // clear air kept either side of a fallen book
const MIN_ROOM = 20;    // narrowest gap worth a fallen book
const PILLAR = 10;      // half-width kept clear around each pillar

/** The span [lo, hi] a standing or lying book really covers: a leaning book's top overhangs by h*sin(tilt). */
export function bookSpan(b) {
  if (b.lying) { const c = b.x + b.w / 2, f = lyingFootprint(b) / 2; return [c - f, c + f]; }
  const o = Math.sin(b.tilt || 0) * b.h;
  return [b.x + Math.min(0, o), b.x + b.w + Math.max(0, o)];
}

/** Free stretches of plank [lo, hi] along the row, after taking out books, pillars, the crack and `avoid` spans. */
export function freeSpans(bs, W, crack, avoid = []) {
  const taken = bs.map(bookSpan);
  for (let i = 0; i <= 3; i++) taken.push([i * W / 3 - PILLAR, i * W / 3 + PILLAR]);
  if (crack) taken.push([crack.x - 4, crack.x + crack.w + 4]);
  for (const s of avoid) taken.push(s);
  taken.sort((a, b) => a[0] - b[0]);
  const out = []; let at = 0;
  for (const [lo, hi] of taken) { if (lo - at >= MIN_ROOM) out.push([at, lo]); at = Math.max(at, hi); }
  if (W - at >= MIN_ROOM) out.push([at, W]);
  return out;
}

/** Fallen books for one row. o = {W, RH, a (decay 0..1), r (row), crack, avoid, paint(rng) -> {tier, col}}. */
export function placeFallen(bs, o) {
  const rng = mulberry(o.r * 6151 + 977), out = [], a = o.a || 0;
  for (const [lo, hi] of freeSpans(bs, o.W, o.crack, o.avoid)) {
    if (rng() > .5 + .3 * a) continue;            // a good share of gaps get something, more the deeper you go
    let at = lo + PAD;
    for (let guard = 0; guard < 3 && hi - PAD - at >= MIN_ROOM - 2 * PAD; guard++) {
      const room = hi - PAD - at, k = pickKind(rng, room, a), L = Math.min(room - rng() * Math.min(6, room * .2), o.RH * (.3 + rng() * .22));
      if (L < 14) break;
      const lead = rng() * Math.max(0, room - L) * .6, cx = at + lead + L / 2;
      const f = {k, x: cx, L, t: 6 + rng() * 6, ...o.paint(rng), seed: (rng() * 65536) | 0};
      if (k === 'stack') { f.n = 2 + (rng() < .45 ? 1 : 0); f.off = Array.from({length: f.n}, (_, i) => i ? (rng() - .5) * L * .16 : 0); f.shr = [1, .86 + rng() * .1, .72 + rng() * .1]; f.layers = Array.from({length: f.n}, () => o.paint(rng)); }
      if (k === 'open') f.apex = L * (.26 + rng() * .1);
      f.lo = cx - L / 2; f.hi = cx + L / 2; out.push(f);
      at = f.hi + PAD + 3 + rng() * 10;
      if (rng() < .45) break;
    }
  }
  return out;
}

function pickKind(rng, room, a) {
  const x = rng(), openOK = room >= 26, wOpen = openOK ? .18 + .22 * a : 0;
  if (x < wOpen) return 'open';
  return x < wOpen + .38 ? 'stack' : 'toppled';
}

/** One book lying flat, spine toward you: the standing art turned a quarter, its foot on the plank at y=0. */
function flat(c, L, t, o, dust, tm) {
  c.save(); c.translate(L / 2, -t / 2); c.rotate(-Math.PI / 2);
  bookArt(c, {w: t, h: L, tier: o.tier, col: o.col, seed: o.seed, dust}, tm);
  c.restore();
  c.fillStyle = 'rgba(255,232,190,.5)'; c.fillRect(L - 1.5, -t + 1.5, 1.5, t - 3); // the paper block shows at the open end
}

/** Paint one fallen item; the origin is the plank under its centre. */
export function drawFallen(c, f, dust = 0, tm = 0) {
  c.save(); c.translate(f.x, 0);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, 1, f.L * .52, 2.4, 0, 0, 6.3); c.fill(); // contact shadow
  if (f.k === 'toppled') { c.translate(-f.L / 2, 0); flat(c, f.L, f.t, f, dust, tm); }
  else if (f.k === 'stack') {
    let y = 0;
    for (let i = 0; i < f.n; i++) {
      const L = f.L * f.shr[i], t = f.t * (.85 + (i % 2) * .25);
      c.save(); c.translate(f.off[i] - L / 2, y); flat(c, L, t, {...f, ...f.layers[i], seed: f.seed + i * 977}, dust, tm); c.restore();
      y -= t;
    }
  } else { // open, face down: two covers meet at the spine on top, pages fan between
    const h = f.apex, hw = f.L / 2, col = rgbs(f.col || [80, 50, 36]);
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,232,190,.55)'; c.lineWidth = f.t * .5; c.beginPath(); c.moveTo(-hw + 2, -1); c.lineTo(0, -h + 2); c.lineTo(hw - 2, -1); c.stroke();
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(-hw, 0); c.lineTo(0, -h); c.lineTo(hw, 0); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-1.5, -h - 1.5, 3, 4); // the cracked spine
  }
  c.restore();
}
