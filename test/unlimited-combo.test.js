import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCombo} from '../src/core/combo.js';

test('applyCombo tolerates a missing chain (Unlimited runs once started without one, giving DEPTH NaN)', () => {
  for (const chain of [undefined, null, NaN]) {
    const r = applyCombo(chain, 6, 5);
    assert.ok(Number.isFinite(r.rows) && r.rows >= 5, `rows finite for chain=${chain}`);
    assert.equal(r.chain, 1);
  }
  assert.equal(applyCombo(undefined, 0, 4).rows, 4);
});
