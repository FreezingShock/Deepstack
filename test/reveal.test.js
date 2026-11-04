import {test} from 'node:test';
import assert from 'node:assert/strict';
import {revealPlan} from '../src/ui/reveal.js';

test('reveal effects escalate monotonically with tier', () => {
  const p = [0,1,2,3,4,5,6].map(revealPlan);
  for (let i = 1; i < p.length; i++) {
    assert.ok(p[i].vignette >= p[i-1].vignette);
    assert.ok(p[i].rays >= p[i-1].rays);
    assert.ok(p[i].embers >= p[i-1].embers);
    assert.ok(p[i].hold >= p[i-1].hold);
  }
  assert.equal(p[0].rays + p[0].embers + p[2].rays, 0);
  assert.ok(p[6].rays > p[3].rays && p[6].rune && !p[4].rune);
});
