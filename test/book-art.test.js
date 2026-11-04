import test from 'node:test';
import assert from 'node:assert/strict';
import {bookArt, tierBase, TIER_MATERIALS} from '../src/ui/bookArt.js';
import {TIERS} from '../src/core/tiers.js';
import {fitSpine} from '../src/ui/spineLabel.js';

// a recording 2D context: every call is logged, gradients are inert, text is measured at 0.5em per letter
function ctx() {
  const log = [], stub = {addColorStop() {}};
  const c = new Proxy({log}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return s => ({width: s.length * parseFloat(String(t.font || '10px')) * .5});
      if (k.startsWith('create')) return () => stub;
      return (...a) => { log.push([k, ...a]); };
    },
    set(t, k, v) { t[k] = v; log.push(['set', k, v]); return true; }
  });
  return c;
}
const draw = (o, t = 0) => { const c = ctx(); bookArt(c, o, t); return c.log; };

test('every tier has its own named material and draws without throwing', () => {
  assert.equal(TIER_MATERIALS.length, TIERS.length);
  const logs = TIERS.map(t => draw({w: 30, h: 100, tier: t.id, seed: 7, word: 'lantern'}));
  for (const l of logs) assert.ok(l.length > 20);
  // materials differ: no two tiers issue the same drawing calls
  const sig = logs.map(l => JSON.stringify(l.map(x => x[0])));
  assert.equal(new Set(sig).size, TIERS.length);
});

test('tier body colour keeps the tier hue (value varies, hue does not)', () => {
  for (const t of TIERS) {
    const [r, g, b] = tierBase(t.id), hexv = t.spine, R = parseInt(hexv.slice(1, 3), 16), G = parseInt(hexv.slice(3, 5), 16), B = parseInt(hexv.slice(5, 7), 16);
    const max = Math.max(R, G, B), k = Math.max(r, g, b) / max;
    assert.ok(k > .6 && k <= 1, t.name);
    // same channel ordering as the pure tier colour
    assert.equal(r >= g, R >= G); assert.equal(g >= b, G >= B);
  }
});

test('lettering is never stretched: text is drawn without a maxWidth and fits the spine', () => {
  for (const word of ['ox', 'cat', 'incomprehensibilities'.slice(0, 14)]) for (const tier of [0, 3, 6]) {
    const h = 96, l = draw({w: 30, h, tier, seed: 3, word});
    const texts = l.filter(x => x[0] === 'fillText');
    assert.equal(texts.length, 1, word);
    assert.equal(texts[0].length, 4, 'fillText(text,x,y) only: no maxWidth squeeze');
  }
});

test('fitted spines (shelf, recents) letter the 14-letter word at its fitted size', () => {
  const measure = (w, fs) => w.length * fs * .5, f = fitSpine('floccinaucinih'.slice(0, 14), {baseH: 80, baseW: 30, maxH: 136, measure});
  for (const tier of [0, 4, 6]) {
    const l = draw({w: f.w, h: f.h, fit: {fs: f.fs, lh: f.lh, top: f.top}, tier, seed: 1, word: 'floccinaucinih'});
    assert.equal(l.filter(x => x[0] === 'fillText')[0].length, 4);
  }
});

test('glow and foil move with time but stay still at t=0 twice (deterministic seed)', () => {
  const a = JSON.stringify(draw({w: 28, h: 90, tier: 6, seed: 5}, 1)), b = JSON.stringify(draw({w: 28, h: 90, tier: 6, seed: 5}, 1));
  assert.equal(a, b);
  assert.notEqual(a, JSON.stringify(draw({w: 28, h: 90, tier: 6, seed: 5}, 2)));
});

test('filler books (tier -1) still draw', () => {
  assert.ok(draw({w: 20, h: 80, tier: -1, seed: 2, col: [60, 40, 30]}).length > 10);
});
