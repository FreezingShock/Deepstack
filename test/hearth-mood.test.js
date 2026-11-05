import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flameHeight, sparkTint, hearthMood} from '../src/ui/hearthMood.js';
import {TIER_COLORS} from '../src/theme/colors.js';

test('flame height grows with the streak: low at 0, roaring after weeks, never past the cap', () => {
  assert.ok(flameHeight(0) < .6);
  for (let n = 0; n < 60; n++) assert.ok(flameHeight(n + 1) > flameHeight(n) - 1e-9);
  assert.ok(Math.abs(flameHeight(6) - 1) < .05, 'about a week is the classic fire');
  assert.ok(flameHeight(30) > 1.2 && flameHeight(500) <= 1.26);
  assert.equal(flameHeight(-3), flameHeight(0));
});
test('spark tint follows the last book tier, default warm without a book', () => {
  assert.equal(sparkTint(null), null);
  assert.deepEqual(sparkTint(6), [0x55, 0xff, 0xff]);
  assert.deepEqual(sparkTint(5), [0xff, 0x55, 0x55]);
  assert.deepEqual(sparkTint(4), [0xff, 0xaa, 0x00]);
  assert.ok(TIER_COLORS.apocrypha);
});
test('mood reads the save without new fields and tolerates missing ones', () => {
  assert.deepEqual(hearthMood({}, 0).tint, null);
  assert.equal(hearthMood({shelf: [{tier: 1}, {tier: 6}]}, 3).tier, 6);
  assert.equal(hearthMood(null, 2).tier, null);
  assert.equal(hearthMood({shelf: [{}]}, 0).tint, null);
});
