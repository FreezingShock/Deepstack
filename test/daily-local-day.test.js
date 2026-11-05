import test from 'node:test';
import assert from 'node:assert/strict';
import {dayKey,msUntilNextDaily} from '../src/core/stats.js';
// Daily rolls over at local midnight, whatever the timezone.
test('dayKey follows the local calendar day',()=>{
  assert.equal(dayKey(new Date(2026,10,5,0,1).getTime()),'2026-11-05');
  assert.equal(dayKey(new Date(2026,10,5,23,59).getTime()),'2026-11-05');
  assert.equal(dayKey(new Date(2026,10,6,0,0).getTime()),'2026-11-06');
});
test('countdown targets local midnight',()=>{
  assert.equal(msUntilNextDaily(new Date(2026,10,5,23,0).getTime()),3600e3);
});
