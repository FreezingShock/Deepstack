import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRating, newRating, lexicon, kFactor, targetFor, applyResult, finishRating, nextWord, PLACEMENT_WORDS} from '../src/core/unlimited.js';
import {WORDS} from '../src/core/words.js';
import {mulberry} from '../src/core/daily.js';

test('tolerates missing or damaged saves', () => {
  assert.deepEqual(loadRating(undefined), newRating());
  assert.equal(loadRating({L: 'x', seen: 5}).L, newRating().L);
  assert.equal(loadRating({L: 99}).L, 9.8);
});
test('K shrinks during placement and is small once placed', () => {
  assert.ok(kFactor(false, 0) > kFactor(false, 7));
  assert.ok(kFactor(true, 0) < kFactor(false, 0));
});
test('good answers raise the rating, poor ones lower it', () => {
  const w = {id: 1, d: 5}, r = {...newRating(), L: 5};
  assert.ok(applyResult(r, w, 95, 0).L > 5);
  assert.ok(applyResult(r, w, 5, 0).L < 5);
  assert.ok(applyResult(r, w, 50, 0).seen.includes(1));
});
test('placement converges toward a strong player', () => {
  let r = newRating();
  const rng = mulberry(7), used = [];
  for (let i = 0; i < PLACEMENT_WORDS; i++) { const w = nextWord(r, i, PLACEMENT_WORDS, used, rng); used.push(w.id); r = applyResult(r, w, 90, i); }
  assert.ok(lexicon(r.L) > 55);
  assert.equal(finishRating(r, 90).placed, true);
});
test('ramps targets across a run and never repeats a word within it', () => {
  assert.ok(targetFor(5, 6, 7) > targetFor(5, 0, 7));
  const r = {...newRating(), placed: true, L: 5}, used = [];
  for (let i = 0; i < 7; i++) { const w = nextWord(r, i, 7, used, mulberry(i)); assert.ok(!used.includes(w.id)); used.push(w.id); }
  assert.ok(WORDS.length > 7);
});
