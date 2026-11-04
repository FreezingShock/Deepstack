import test from 'node:test';
import assert from 'node:assert/strict';
import {placeFallen, freeSpans, bookSpan, drawFallen} from '../src/ui/fallenBooks.js';

const W = 900, RH = 150;
const paint = g => ({tier: -1, col: [70 + (g() * 20 | 0), 40, 30]});
function row(seed) { // a shelf with gaps
  const bs = []; let x = -6, s = seed;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  while (x < W + 40) { const w = 10 + rnd() * 22; if (rnd() < .3) { x += w * (.5 + rnd()) * 2.2; continue; } bs.push({x, w, h: 100, tilt: (rnd() - .5) * .2, lying: rnd() < .06}); x += w + 1; }
  return bs;
}
const opts = (r, bs) => ({W, RH, a: .7, r, crack: null, avoid: [], paint});

test('fallen books are seeded: the same row gives the same books', () => {
  const bs = row(5);
  assert.deepEqual(placeFallen(bs, opts(9, bs)), placeFallen(bs, opts(9, bs)));
  assert.notDeepEqual(placeFallen(bs, opts(9, bs)), placeFallen(bs, opts(10, bs)));
});

test('no fallen book overlaps a standing one, a pillar, a crack or an avoided span', () => {
  let total = 0, kinds = new Set();
  for (let r = 1; r < 60; r++) {
    const bs = row(r * 31), crack = r % 3 ? null : {x: 300, w: 60}, avoid = [[400, 480]];
    const fs = placeFallen(bs, {...opts(r, bs), crack, avoid});
    total += fs.length;
    const spans = bs.map(bookSpan); for (let i = 0; i <= 3; i++) spans.push([i * W / 3 - 7, i * W / 3 + 7]);
    if (crack) spans.push([crack.x, crack.x + crack.w]); spans.push(avoid[0]);
    for (const f of fs) {
      kinds.add(f.k);
      for (const [lo, hi] of spans) assert.ok(f.hi <= lo || f.lo >= hi, `row ${r}: ${f.k} ${f.lo}-${f.hi} hits ${lo}-${hi}`);
    }
    fs.sort((p, q) => p.lo - q.lo); fs.forEach((f, i) => i && assert.ok(f.lo >= fs[i - 1].hi, 'fallen overlap'));
  }
  assert.ok(total > 40, 'broadly present: ' + total);
  assert.deepEqual([...kinds].sort(), ['open', 'stack', 'toppled']);
});

test('narrow gaps get nothing and freeSpans ignores them', () => {
  const bs = [{x: 0, w: 20, h: 90, tilt: 0}, {x: 30, w: 20, h: 90, tilt: 0}];
  assert.ok(!freeSpans(bs, 60, null).some(([lo, hi]) => lo >= 20 && hi <= 30));
});

test('every kind draws on the plank without throwing', () => {
  const ops = []; const ctx = new Proxy({}, {get: (t, k) => String(k).startsWith('create') ? () => ({addColorStop() {}}) : (...a) => { ops.push(k); }, set: () => true});
  const bs = row(3);
  for (let r = 1; r < 30; r++) for (const f of placeFallen(bs, opts(r, bs))) drawFallen(ctx, f, .5, 0);
  assert.ok(ops.length > 0);
});
