import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verdictFor} from '../src/core/verdict.js';
import {tierOf} from '../src/core/tiers.js';

const prose = {id: 1, w: 'prose', def: 'Language, particularly written language, not intended as poetry.'};
test('a few points never says nothing matched', () => {
  const v = verdictFor({score: 5}, tierOf(5), prose);
  assert.doesNotMatch(v, /Nothing here/);
  assert.match(v, /misses the core/);
  assert.match(v, /language, particularly written language/);
});
test('zero keeps the tier-0 lines; long definitions drop the gist', () => {
  assert.doesNotMatch(verdictFor({score: 0}, 0, prose), /Close in spirit/);
  assert.match(verdictFor({score: 8}, 0, {id: 2, w: 'x', def: 'a'.repeat(90)}), /core meaning\.$/);
});
test('higher tiers and edge cases are unchanged', () => {
  assert.equal(verdictFor({empty: true}, 0, prose), 'Nothing written.');
  assert.match(verdictFor({score: 50, opposite: true}, 3, prose), /other way/);
});
