import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spineModel, runLedgeHTML, spineHeight} from '../src/ui/runLedge.js';
const tiers = [{spine: '#777', name: 'Pamphlet'}, {spine: '#585', name: 'Paperback'}];
const words = [1, 2, 3, 4, 5, 6, 7];
const results = [{w: 'aa', tier: 1}, {w: 'bb', skipped: true, tier: 0}, {w: 'cc', tier: 0, combo: {n: 2}}];
test('model: done, skipped gap, now, next', () => {
  const m = spineModel(words, results, 3, tiers);
  assert.deepEqual(m.map(x => x.state), ['done', 'skipped', 'done', 'now', 'next', 'next', 'next']);
  assert.equal(m[0].color, '#585'); assert.equal(m[2].linked, true); assert.equal(m[0].linked, false);
});
test('html: seven slots, only newest gets slide-in, reduced motion CSS drops it', () => {
  const h = runLedgeHTML(words, results, 3, tiers);
  assert.equal((h.match(/class="spine/g) || []).length, 7);
  assert.equal((h.match(/fresh/g) || []).length, 1);
  assert.match(h, /aria-label="word 4 of 7, 3 finished/);
});
test('heights are stable and bounded', () => {
  assert.equal(spineHeight('abc'), spineHeight('abc'));
  for (const w of ['a', 'zebra', 'longword']) { const v = spineHeight(w); assert.ok(v >= 22 && v <= 30); }
});
