import test from 'node:test';
import assert from 'node:assert/strict';
import {candleLightModel, GLOW_STOPS} from '../src/ui/candleLight.js';

const L = 45000;
test('a fresh candle lights widest and brightest, and the light shrinks with the wax', () => {
  const full = candleLightModel(L, L), half = candleLightModel(L / 2, L), low = candleLightModel(3000, L);
  assert.ok(full.k <= 1 && full.k > half.k && half.k > low.k);
  assert.ok(full.r > half.r && half.r > low.r && low.r > 0);
});
test('a snuffed candle throws no light', () => {
  assert.deepEqual(candleLightModel(0, L), {k: 0, r: 0});
});
test('the glow fades to fully transparent at its edge, so there is no rim', () => {
  const last = GLOW_STOPS[GLOW_STOPS.length - 1];
  assert.equal(last[0], 1); assert.match(last[1], /,0\)$/);
});
