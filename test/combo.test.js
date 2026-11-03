import test from 'node:test';
import assert from 'node:assert/strict';
import {comboMultiplier, applyCombo, extendsCombo, COMBO_MAX} from '../src/core/combo.js';

test('multiplier ramps and caps', () => {
  assert.equal(comboMultiplier(1), 1);
  assert.equal(comboMultiplier(2), 1.25);
  assert.equal(comboMultiplier(3), 1.5);
  assert.equal(comboMultiplier(20), COMBO_MAX);
});
test('only Folio+ extends, skips never do', () => {
  assert.equal(extendsCombo(2), false);
  assert.equal(extendsCombo(3), true);
  assert.equal(extendsCombo(6, true), false);
});
test('first link has no bonus, later links add rows', () => {
  let r = applyCombo(0, 4, 20);
  assert.deepEqual([r.chain, r.rows, r.bonus], [1, 20, 0]);
  r = applyCombo(r.chain, 5, 20);
  assert.deepEqual([r.chain, r.rows, r.bonus], [2, 25, 5]);
});
test('a weak answer breaks the chain and reports it', () => {
  const r = applyCombo(3, 1, 10);
  assert.deepEqual([r.chain, r.rows, r.bonus, r.broke], [0, 10, 0, true]);
  assert.equal(applyCombo(1, 1, 10).broke, false);
});
test('deterministic: same tiers and rows give same depth', () => {
  const run = seq => { let c = 0, t = 0; for (const [tier, rows] of seq) { const r = applyCombo(c, tier, rows); c = r.chain; t += r.rows; } return t; };
  const s = [[4, 18], [3, 12], [1, 6], [5, 20]];
  assert.equal(run(s), run(s));
});
