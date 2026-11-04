import {test} from 'node:test';
import assert from 'node:assert';
import {FLOORS} from '../src/core/floors.js';
import {KINDS, DEFS, MAX_LIVE, GAP, blocked, updateAmbient, resetAmbient, liveCount, ambientEnabled} from '../src/ui/ambient.js';

const seeded = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const env = (o = {}) => ({W: 1280, H: 800, RH: 176, camNow: 0, top: 0, bot: 6, excl: [], rm: false, low: false, quiet: false, busy: false, ...o});

test('every floor hosts 2 or 3 known creatures', () => {
  for (const f of FLOORS) { const k = KINDS[f.key]; assert.ok(k && k.length >= 2 && k.length <= 3, f.key); for (const x of k) assert.ok(DEFS[x], x); }
});

test('off in reduced motion, low quality, and under a covering page', () => {
  assert.equal(ambientEnabled({rm: true}), false);
  assert.equal(ambientEnabled({low: true}), false);
  for (const o of [{rm: true}, {low: true}, {quiet: true}]) {
    resetAmbient(); const rng = seeded(3);
    for (let i = 0; i < 4000; i++) assert.equal(updateAmbient(.05, env({camNow: 12000, top: 60, bot: 66, rng, ...o})).length, 0);
    assert.equal(liveCount(), 0);
  }
});

test('spawn rate is capped and nothing ever paints over an exclusion rect', () => {
  resetAmbient(); const rng = seeded(11);
  // exclusion: the alcove in the middle and the top bar
  const excl = [{x: 260, y: 70, w: 760, h: 520}, {x: 0, y: 0, w: 1280, h: 70}];
  let spawns = 0, seen = new Set(), t = 0;
  for (let i = 0; i < 20000; i++) { // ~1000s at 20 ms
    const items = updateAmbient(.05, env({camNow: 12000, top: 68, bot: 74, excl, rng}));
    t += .05; assert.ok(liveCount() <= MAX_LIVE);
    for (const it of items) { seen.add(it.id); assert.ok(!blocked(it.box, excl), `${it.kind} overlaps`); }
  }
  spawns = seen.size;
  assert.ok(spawns > 0, 'something appears');
  assert.ok(spawns <= Math.ceil(t / GAP[0]) + 1, 'rate cap');
});

test('creatures shown belong to the floor under the lamp', () => {
  const row = FLOORS[3].row + 4; // Sunken Vault
  resetAmbient(); const rng = seeded(5), kinds = new Set();
  for (let i = 0; i < 20000; i++) for (const it of updateAmbient(.05, env({camNow: row * 176 - 300, top: row - 3, bot: row + 3, rng}))) kinds.add(it.kind);
  for (const k of kinds) assert.ok(KINDS.vault.includes(k), k);
});
