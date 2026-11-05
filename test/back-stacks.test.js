import test from 'node:test';
import assert from 'node:assert/strict';
import {backLayout, tileHeight, BACK_FACTOR} from '../src/world/backStacks.js';
import {FLOORS} from '../src/core/floors.js';
import {TIERS} from '../src/ui/quality.js';

test('layout is deterministic per floor and stays inside the tile', () => {
  for (const fl of FLOORS) {
    const a = backLayout(fl, 1280, 108), b = backLayout(fl, 1280, 108);
    assert.deepEqual(a, b);
    assert.ok(a.books.length > 10);
    for (const k of a.books) assert.ok(k.h > 0 && k.h < 108);
    assert.equal(a.pillars.length, 3);
    for (const p of a.pillars) assert.notEqual(p % Math.round(1280 / 3), 0); // never sits on a main pillar
  }
});

test('deeper floors lose more of their back books', () => {
  const n = i => backLayout(FLOORS[i], 1600, 108).books.length;
  assert.ok(n(5) < n(0));
});

test('parallax is slower than the camera and the tile is a fraction of a shelf', () => {
  assert.ok(BACK_FACTOR > 0 && BACK_FACTOR < 1);
  assert.ok(tileHeight(150) < 150);
});

test('low quality turns back stacks off', () => {
  assert.equal(TIERS.high.backStacks, true);
  assert.equal(TIERS.medium.backStacks, true);
  assert.equal(TIERS.low.backStacks, false);
});
