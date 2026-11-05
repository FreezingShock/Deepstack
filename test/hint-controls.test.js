import test from 'node:test';
import assert from 'node:assert/strict';
import {hintButtonHtml, skipButtonHtml} from '../src/ui/hintSlips.js';
const words = h => h.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean);
test('hint control is one word plus a pip per clue, the free one drawn differently', () => {
  const h = hintButtonHtml(3, 0, true, false);
  assert.equal((h.match(/<i /g) || []).length, 3);
  assert.match(h, /class="free"/);
  assert.ok(words(h).length <= 3);
});
test('spent pips go hollow and the newest one snuffs', () => {
  const h = hintButtonHtml(3, 1, false, true);
  assert.match(h, /spent snuff/);
  assert.doesNotMatch(h, /free/);
});
test('no hints left reads in three words or fewer', () => {
  assert.ok(words(hintButtonHtml(3, 3, false, false)).length <= 3);
});
test('skip shows its cost as an object, not a sentence', () => {
  assert.doesNotMatch(skipButtonHtml(0, 0), /hs-cost/);
  assert.match(skipButtonHtml(2, 0), /hs-cost/);
  assert.match(skipButtonHtml(0, 1), /hs-cost/);
  assert.ok(words(skipButtonHtml(2, 1)).length <= 3);
});
