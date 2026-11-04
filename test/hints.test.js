import test from 'node:test';
import assert from 'node:assert/strict';
import {hintLadder, synonymClue, sentenceClue, openingClue, rowsAfterHints, HINT_COST} from '../src/core/hints.js';
import {WORDS} from '../src/core/words.js';
import {templateHint} from '../src/core/wordPool.js';

const gen = (o) => ({w: 'quixotic', pos: 'adjective', def: 'Exceedingly idealistic; unrealistic and impractical.', hint: null, concepts: [], ...o});

test('sentence leads when real; missing or templated sentences fall back to meaning hints', () => {
  const withSent = gen({hint: 'He was ___ to the end.', def: 'Exceedingly idealistic and unrealistic in pursuit of noble goals.'});
  assert.equal(hintLadder(withSent)[0].kind, 'sentence');
  const templated = gen({hint: templateHint({pos: 'adjective', w: 'quixotic'})});
  assert.equal(sentenceClue(templated), null);
  assert.ok(!hintLadder(templated).some(h => h.kind === 'sentence'));
});
test('no hint ever reveals spelling', () => {
  for (const w of [gen({}), ...WORDS]) for (const h of hintLadder(w)) {
    assert.doesNotMatch(h.text, /begins with|letters/i, w.w);
  }
});
test('synonym falls back to a short gloss fragment and is withheld for a lone gloss', () => {
  assert.ok(['Exceedingly idealistic', 'unrealistic and impractical'].includes(synonymClue(gen({}))));
  assert.equal(synonymClue(gen({def: 'Showing great attention to detail and care.'})), null);
});
test('opening clue is a partial definition, withheld when short', () => {
  const c = openingClue(gen({def: 'Showing great attention to detail and care.'}));
  assert.equal(c, 'Showing great…');
  assert.equal(openingClue(gen({def: 'Very idealistic.'})), null);
  for (const w of WORDS) {
    const o = openingClue(w);
    if (o) assert.ok(o.length < w.def.length && !o.toLowerCase().includes(w.w.toLowerCase()), w.w);
  }
});
test('curated words never leak the word in a synonym', () => {
  for (const w of WORDS) {
    const s = synonymClue(w);
    assert.ok(s, w.w);
    assert.ok(!s.toLowerCase().includes(w.w.toLowerCase()), w.w);
  }
});
test('hint cost shrinks the descent but keeps a floor', () => {
  assert.equal(rowsAfterHints(20, HINT_COST.sentence + HINT_COST.synonym), 17);
  assert.equal(rowsAfterHints(4, 6), 2);
  assert.equal(rowsAfterHints(2, 3), 2);
  assert.equal(rowsAfterHints(1, 3), 1);
});
