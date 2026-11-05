// A sigil for every book: a small emblem (rings, runes, knots) drawn deterministically from the word, so the same
// word always stamps the same mark and two Codex books never match. Stroked in the tier's hue, pressed into the
// cover like a seal. `sigilSpec(word)` is pure data; `drawSigil` blits a cached bitmap (one per word and tier),
// so a shelf full of spines costs one drawImage each.
import {TIERS} from '../core/tiers.js';
import {mulberry, hashStr} from '../core/daily.js';
import {SETS} from '../sets/sets.js';

const PAPER = [255, 232, 190];
const mix = (c, t, f) => c.map((v, i) => Math.round(v + (t[i] - v) * f));
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const BMP = 64, CAP = 600;

export const RINGS = ['single', 'double', 'dotted', 'ticked', 'broken'];
export const CORES = ['runes', 'star', 'knot', 'petals'];

/** The set a word belongs to (or null). Set members share one ring so a complete set reads as a family. */
export const setIndexOf = word => { const w = String(word || '').toLowerCase().trim(); const i = SETS.findIndex(s => s.words.includes(w)); return i < 0 ? -1 : i; };
/** The ring that marks set number i: every set gets its own (ring, second ring) pair, so no two sets match. */
export const setRing = i => ({ring: RINGS[i % RINGS.length], ring2: Math.floor(i / RINGS.length) % 2 === 1});

/** Pure description of the sigil for a word. Same word, same spec. Words in a book set take the set's ring but keep their own core. */
export function sigilSpec(word) {
  const w = String(word || '').toLowerCase().trim(), rng = mulberry(hashStr('sigil|' + w));
  const pick = a => a[Math.floor(rng() * a.length)];
  const n = 3 + Math.floor(rng() * 6);                       // 3..8-fold symmetry
  const core = pick(CORES);
  const arm = [];                                             // a random polyline for one arm, mirrored n times
  for (let i = 0, k = 2 + Math.floor(rng() * 3); i < k; i++) arm.push([+(.18 + .62 * (i + 1) / k + (rng() - .5) * .1).toFixed(3), +((rng() - .3) * .5).toFixed(3)]);
  const spec = {
    ring: pick(RINGS), ring2: rng() < .45, n, core, arm,
    skip: 2 + Math.floor(rng() * Math.max(1, Math.floor((n - 1) / 2))), // star polygon {n/skip}
    mirror: rng() < .5, pip: pick(['dot', 'diamond', 'ring', 'none']), rot: Math.floor(rng() * 360)
  };
  const si = setIndexOf(w);
  if (si >= 0) { Object.assign(spec, setRing(si)); spec.set = SETS[si].id; }   // drawn after the rng, so cores stay unchanged
  return spec;
}

const TAU = Math.PI * 2;
function paths(c, s, R) {
  const arc = (r, a0 = 0, a1 = TAU) => { c.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); c.arc(0, 0, r, a0, a1); };
  // ring
  c.beginPath();
  if (s.ring === 'single' || s.ring === 'double') arc(R);
  if (s.ring === 'double') arc(R * .86);
  if (s.ring === 'broken') for (let i = 0; i < 4; i++) arc(R, i * TAU / 4 + .25, (i + 1) * TAU / 4 - .25);
  if (s.ring === 'ticked') { arc(R * .9); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; c.moveTo(Math.cos(a) * R * .9, Math.sin(a) * R * .9); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); } }
  if (s.ring === 'dotted') for (let i = 0; i < 18; i++) { const a = i * TAU / 18; c.moveTo(Math.cos(a) * R + R * .06, Math.sin(a) * R); c.arc(Math.cos(a) * R, Math.sin(a) * R, R * .06, 0, TAU); }
  if (s.ring2 && s.ring !== 'double') arc(R * .72);
  c.stroke();
  const r0 = R * .62;
  c.beginPath();
  if (s.core === 'star') {
    for (let i = 0; i <= s.n; i++) { const a = (i * s.skip % s.n) * TAU / s.n - Math.PI / 2; i ? c.lineTo(Math.cos(a) * r0, Math.sin(a) * r0) : c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); }
  } else if (s.core === 'knot') {   // overlapping circles around the centre, a rosette knot
    for (let i = 0; i < s.n; i++) { const a = i * TAU / s.n - Math.PI / 2, cx = Math.cos(a) * r0 * .42, cy = Math.sin(a) * r0 * .42; c.moveTo(cx + r0 * .5, cy); c.arc(cx, cy, r0 * .5, 0, TAU); }
  } else if (s.core === 'petals') {
    for (let i = 0; i < s.n; i++) { const a = i * TAU / s.n - Math.PI / 2; c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a - .5) * r0 * .9, Math.sin(a - .5) * r0 * .9, Math.cos(a) * r0, Math.sin(a) * r0); c.quadraticCurveTo(Math.cos(a + .5) * r0 * .9, Math.sin(a + .5) * r0 * .9, 0, 0); }
  } else {   // runes: the word's own arm polyline, n-fold, optionally mirrored
    for (let i = 0; i < s.n; i++) for (const m of s.mirror ? [1, -1] : [1]) {
      const a = i * TAU / s.n - Math.PI / 2; c.moveTo(0, 0);
      for (const [d, off] of s.arm) { const rr = d * r0 * 1.15, x = rr, y = off * r0 * m; c.lineTo(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)); }
    }
  }
  c.stroke();
  if (s.pip === 'dot') { c.beginPath(); c.arc(0, 0, R * .1, 0, TAU); c.fill(); }
  else if (s.pip === 'ring') { c.beginPath(); c.arc(0, 0, R * .14, 0, TAU); c.stroke(); }
  else if (s.pip === 'diamond') { const d = R * .13; c.beginPath(); c.moveTo(0, -d); c.lineTo(d, 0); c.lineTo(0, d); c.lineTo(-d, 0); c.closePath(); c.fill(); }
}

/** The tier's ink for a sigil: pale and warm so it reads on a dark cover. */
export function sigilColor(tier) {
  const base = hex((TIERS[tier] || TIERS[0]).spine);
  return tier >= 4 ? mix(base, PAPER, .45) : mix(base, PAPER, .6);
}

function render(word, tier, size = BMP) {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c = cv.getContext('2d'); if (!c) return null;
  const s = sigilSpec(word), col = sigilColor(tier), R = size / 2 - 4 * size / BMP, k = size / BMP;
  c.translate(size / 2, size / 2);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.rotate(s.rot * Math.PI / 180);
  c.translate(1.2 * k, 1.4 * k); c.strokeStyle = c.fillStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 3.2 * k; paths(c, s, R); c.restore();   // pressed shadow
  c.save(); c.rotate(s.rot * Math.PI / 180);
  c.strokeStyle = c.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; c.lineWidth = 2.6 * k; paths(c, s, R); c.restore();
  return cv;
}

const cache = new Map();
export const sigilCacheSize = () => cache.size;
export function sigilBitmap(word, tier, size = BMP) {
  const k = tier + '|' + size + '|' + String(word).toLowerCase();
  if (cache.has(k)) { const v = cache.get(k); cache.delete(k); cache.set(k, v); return v; }
  const v = render(word, tier, size);
  cache.set(k, v);
  if (cache.size > CAP) cache.delete(cache.keys().next().value);
  return v;
}

/** Stamp the word's sigil centred at (x, y) with radius r, on the cover. Returns false when it drew nothing. */
export function drawSigil(c, word, tier, x, y, r, alpha = .85, size = BMP) {
  if (!word || r < 2) return false;
  const b = sigilBitmap(word, tier, size); if (!b) return false;
  c.save(); c.globalAlpha = alpha; c.drawImage(b, x - r, y - r, r * 2, r * 2); c.restore();
  return true;
}
