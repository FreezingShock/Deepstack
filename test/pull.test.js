import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pullX, PULL_MIN, PULL_SPAN} from '../src/core/pull.js';

// Pins #21/#42: the descent book is pulled from a varied spot, never a fixed or centred one.
test('pulled-book placement varies from row to row', () => {
  const W = 1200, xs = Array.from({length: 200}, (_, r) => pullX(r, W));
  assert.ok(new Set(xs.map(Math.round)).size > 150, 'nearly every row gets its own spot');
  const mean = xs.reduce((a, b) => a + b) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  assert.ok(sd > W * .15, 'spread across the shelf, not clustered at the middle: sd=' + sd);
  assert.ok(xs.some(x => x < W * .3) && xs.some(x => x > W * .7), 'reaches both sides');
});
test('pulled-book spot stays on the shelf, is stable per row and scales with width', () => {
  for (let r = 0; r < 300; r++) {
    const x = pullX(r, 1000);
    assert.ok(x >= 1000 * PULL_MIN && x <= 1000 * (PULL_MIN + PULL_SPAN), String(x));
    assert.equal(pullX(r, 1000), x);
    assert.ok(Math.abs(pullX(r, 500) * 2 - x) < 1e-9);
  }
});
