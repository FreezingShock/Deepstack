import test from 'node:test';
import assert from 'node:assert/strict';
import {worldDpr} from '../src/ui/dprCap.js';

test('phones and laptops keep their device ratio', () => {
  assert.equal(worldDpr(375, 667, 2), 2);
  assert.equal(worldDpr(1440, 900, 2), 2);
  assert.equal(worldDpr(1280, 800, 1), 1);
});
test('large screens are capped so the backing store stays near 6 MP', () => {
  const d = worldDpr(1920, 1080, 2);
  assert.ok(d < 2 && d > 1.5);
  assert.ok(1920 * 1080 * d * d <= 6.0001e6);
  assert.ok(worldDpr(3840, 2160, 2) <= 1);
});
test('never below the 1x cap formula nor above 2, tolerates bad ratio', () => {
  assert.equal(worldDpr(800, 600, 0), 1);
  assert.equal(worldDpr(800, 600, 3), 2);
});
