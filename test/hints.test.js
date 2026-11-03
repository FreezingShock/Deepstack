import test from 'node:test';
import assert from 'node:assert/strict';
import {hintLadder, lettersClue, synonymClue, sentenceClue, rowsAfterHints, HINT_COST} from '../src/core/hints.js';
import {WORDS} from '../src/core/words.js';
import {templateHint} from '../src/core/wordPool.js';

const gen = (o) => ({w: 'quixotic', pos: 'adjective', def: 'Exceedingly idealistic; unrealistic and impractical.', hint: null, concepts: [], ...o});

test('every word gets a letters hint, and sentence only when it is real', () => {
  assert.deepEqual(hintLadder(gen({})).map(h => h.kind), ['letters', 'synonym']);
  const withSent = gen({hint: 'He was ___ to the end.'});
  assert.deepEqual(hintLadder(withSent).map(h => h.kind), ['letters', 'sentence', 'synonym']);
  const templated = gen({hint: templateHint({pos: 'adjective', w: 'quixotic'})});
  assert.equal(sentenceClue(templated), null);
});
test('synonym falls back to a short gloss fragment and is withheld for a lone gloss', () => {
  assert.ok(['Exceedingly idealistic', 'unrealistic and impractical'].includes(synonymClue(gen({}))));
  assert.equal(synonymClue(gen({def: 'Showing great attention to detail and care.'})), null);
});
test('curated words use their concept terms, never the word itself', () => {
  for (const w of WORDS) {
    const s = synonymClue(w);
    assert.ok(s, w.w);
    assert.ok(!s.toLowerCase().includes(w.w.toLowerCase()), w.w);
  }
  assert.equal(lettersClue({w: 'abandon'}), 'Begins with “a” · 7 letters');
});
test('hint cost shrinks the descent but keeps a floor', () => {
  assert.equal(rowsAfterHints(20, HINT_COST.letters + HINT_COST.synonym), 16);
  assert.equal(rowsAfterHints(4, 6), 2);
  assert.equal(rowsAfterHints(2, 3), 2);
  assert.equal(rowsAfterHints(1, 3), 1);
});
