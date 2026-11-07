import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANDINGS, PATHS, RELICS, newDescent, isLanding, isFailure, pathOptions, takePath, relicChoices,
  takeRelic, limitBonusMs, rowsWithPath, endWord, resolveFailure, descentSummary, WICK_BONUS_MS, DEEPER_MULT
} from '../src/core/descent.js';
import {nextWord, newRating} from '../src/core/unlimited.js';
import {WORDS} from '../src/core/words.js';
import {mulberry} from '../src/core/daily.js';

test('landings open before words 3, 5 and 7 only, never before the first word', () => {
  assert.deepEqual(LANDINGS, [2, 4, 6]);
  assert.equal(isLanding(0), false);
  assert.equal(isLanding(2), true);
  assert.equal(isLanding(3), false);
});

test('a failed word is a skip or Pamphlet, nothing else', () => {
  assert.equal(isFailure(0, false), true);
  assert.equal(isFailure(0, true), true);
  assert.equal(isFailure(1, false), false);
  assert.equal(isFailure(6, true), true);
});

test('the Hard room multiplies the next word only, and asks a harder word', () => {
  const d = takePath(newDescent(), 'deeper');
  assert.equal(d.pathMult, DEEPER_MULT);
  assert.equal(rowsWithPath(d, 2, false, 10), 15);
  assert.equal(rowsWithPath(endWord(d), 2, false, 10), 10);
  const rating = {...newRating(), placed: true, L: 5};
  const plain = [], hard = [];
  for (let i = 0; i < 40; i++) {
    plain.push(nextWord(rating, 1, 7, [], mulberry(i), WORDS, 0).d);
    hard.push(nextWord(rating, 1, 7, [], mulberry(i), WORDS, d.bump).d);
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(mean(hard) > mean(plain));
});

test('Rest alcove carries one Spare breath at most, and then the door is shut', () => {
  let d = takePath(newDescent(), 'rest');
  assert.equal(d.spare, 1);
  d = takePath(d, 'rest');
  assert.equal(d.spare, 1);
  const rest = pathOptions(d).find(p => p.id === 'rest');
  assert.equal(rest.enabled, false);
  assert.match(rest.reason, /Spare breath/);
});

test('the curio door closes only when every relic is already kept', () => {
  let d = newDescent();
  assert.equal(pathOptions(d).find(p => p.id === 'curio').enabled, true);
  for (const r of RELICS) d = takeRelic(d, r.id);
  assert.equal(pathOptions(d).find(p => p.id === 'curio').enabled, false);
});

test('the shopkeeper lays out two different relics the player does not own', () => {
  let d = takeRelic(newDescent(), 'wick');
  for (let s = 0; s < 20; s++) {
    const c = relicChoices(d, mulberry(s));
    assert.equal(c.length, 2);
    assert.notEqual(c[0].id, c[1].id);
    assert.ok(c.every(r => r.id !== 'wick'));
  }
  assert.equal(relicChoices(takeRelic(d, 'index'), mulberry(1)).length, 1);
});

test('relics are kept once and do what their card says', () => {
  let d = takeRelic(newDescent(), 'index');
  assert.equal(d.freeExtra, 1);
  assert.equal(takeRelic(d, 'index'), d);
  assert.equal(limitBonusMs(d), 0);
  assert.equal(limitBonusMs(takeRelic(d, 'wick')), WICK_BONUS_MS);
});

test('Folio double doubles Folio and better answers, never a skip, before the combo', () => {
  const d = takeRelic(newDescent(), 'folio');
  assert.equal(rowsWithPath(d, 2, false, 10), 10);
  assert.equal(rowsWithPath(d, 3, false, 10), 20);
  assert.equal(rowsWithPath(d, 6, true, 2), 2);
  assert.equal(rowsWithPath(takePath(d, 'deeper'), 3, false, 10), 30);
});

test('a failure spends Spare breath first, and ends the run only without it', () => {
  let d = takePath(newDescent(), 'rest');
  d = resolveFailure(d, true, 3);
  assert.equal(d.ended, false);
  assert.equal(d.spare, 0);
  assert.equal(d.spent, 1);
  d = resolveFailure(d, true, 4);
  assert.equal(d.ended, true);
  assert.equal(d.endedAt, 4);
  assert.equal(resolveFailure(newDescent(), false, 2).ended, false);
});

test('the final page summary names what was carried and how the run ended', () => {
  let d = takeRelic(takePath(newDescent(), 'deeper'), 'folio');
  d = resolveFailure(d, true, 5);
  const s = descentSummary(d, 7);
  assert.equal(s.ended, true);
  assert.equal(s.endedAt, 5);
  assert.deepEqual(s.relics, ['Folio double']);
  assert.equal(descentSummary(null, 7), null);
});

test('every door and relic has a name and a one-line effect', () => {
  for (const p of [...PATHS, ...RELICS]) {
    assert.ok(p.name && p.fx && p.line, p.id);
    assert.ok(p.fx.length <= 40, p.id);
  }
});
