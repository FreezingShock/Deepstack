import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {curve, referenceTexts, prepareAnswer, scoreFromSims, cosine} from '../src/scorer/embedding.js';
import {buildPool, rejectReason, templateHint} from '../src/core/wordPool.js';
import {WORDS} from '../src/core/words.js';
import {dailyWords} from '../src/core/daily.js';

const w = n => WORDS.find(x => x.w === n);

test('calibration curve is monotonic and spans 0-100', () => {
  let prev = -1;
  for (let s = -0.2; s <= 1.01; s += .02) { const v = curve(s); assert.ok(v >= prev); prev = v; }
  assert.equal(curve(-1), 0); assert.equal(curve(1), 100);
});
test('reference texts include the definition, clauses and concept labels', () => {
  const t = referenceTexts({def: 'To go; to leave quickly.', concepts: [['depart', 1, '']]});
  assert.deepEqual(t, ['To go; to leave quickly.', 'To go', 'to leave quickly', 'depart']);
});
test('naming the target word earns nothing; "opposite of" is penalised', () => {
  const p = prepareAnswer('ephemeral means lasting briefly', w('ephemeral'));
  assert.ok(p.usedWord); assert.ok(!/ephemeral/i.test(p.text));
  const same = scoreFromSims([.8], p, 'lasting briefly');
  const opp = scoreFromSims([.8], p, 'the opposite of lasting briefly');
  assert.ok(opp.opposite && opp.score < same.score / 2);
});
test('cosine of unit vectors', () => assert.equal(cosine([1, 0], [1, 0]), 1));

const data = {words: [
  {w: 'abandon', pos: 'verb', def: 'x', d: 9, hint: null},
  {w: 'researcher', pos: 'noun', def: 'One who researches.', d: 3, hint: null},
  {w: 'salvage', pos: 'verb', def: 'To rescue goods from loss or destruction.', d: 4, hint: null},
  {w: 'grayish', pos: 'adjective', def: 'Of or relating to gray.', d: 3, hint: 'It was ___ outside, and dull.'},
]};
test('pool keeps curated bank entries, drops self-referential and relational glosses', () => {
  const pool = buildPool(data);
  const names = pool.map(x => x.w);
  assert.ok(names.includes('salvage') && names.includes('abandon'));
  assert.ok(!names.includes('researcher') && !names.includes('grayish'));
  assert.equal(pool.find(x => x.w === 'abandon').d, 1.2); // curated values win
  assert.equal(rejectReason({w: 'researcher', pos: 'noun', def: 'One who researches.'}), 'self');
  assert.match(templateHint({pos: 'adjective', w: 'sparse'}), /^An adjective of 6 letters/);
});
test('daily words from the real list are deterministic', () => {
  const pool = buildPool(JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url))));
  WORDS.length = 0; WORDS.push(...pool);
  const a = dailyWords('2026-11-03', 7), b = dailyWords('2026-11-03', 7);
  assert.deepEqual(a.map(x => x.w), b.map(x => x.w));
  assert.equal(new Set(a.map(x => x.w)).size, 7);
  assert.ok(pool.length > 5000);
});

import {contrary} from '../src/scorer/antonyms.js';
import {weakGloss, MIN_TRANSLATIONS} from '../src/core/wordPool.js';
test('antonym guard flags answers on the opposite side of the definition, not paraphrases or negated forms', () => {
  const e = w('ephemeral'), c = w('candid'), f = w('frugal');
  assert.ok(contrary('lasting forever and never fading', e.def, e));
  assert.ok(contrary('lying and hiding the truth', c.def, c));
  assert.ok(contrary('spending lavishly on luxuries', f.def, f));
  assert.ok(!contrary('telling it like it is without hiding anything', c.def, c));
  assert.ok(!contrary('not wasting money', f.def, f));
  assert.ok(!contrary('lasting a very short time', e.def, e));
  assert.ok(contrary('brave and bold in battle', 'Cowardly; lacking courage.', {w: 'pusillanimous'}));
  assert.ok(!contrary('cowardly, lacking the courage to act', 'Cowardly; lacking courage.', {w: 'pusillanimous'}));
});
test('a contrary answer is cut down and flagged', () => {
  const e = w('ephemeral'), raw = 'lasting forever and never fading', p = prepareAnswer(raw, e);
  const r = scoreFromSims([.64], p, raw, {word: e});
  assert.ok(r.opposite && r.score < 25);
});
test('a bare synonym is judged against the word itself, but a contrary one is not rescued', () => {
  const f = w('frugal'), p = prepareAnswer('thrifty', f);
  const without = scoreFromSims([.29], p, 'thrifty', {word: f}).score;
  const withWord = scoreFromSims([.29], p, 'thrifty', {word: f, wordSim: .47}).score;
  assert.ok(withWord >= without + 20);
  const lav = prepareAnswer('lavish', f);
  assert.ok(scoreFromSims([.29], lav, 'lavish', {word: f, wordSim: .5}).score < 20);
});
test('weak glosses and obscure words are kept out of the pool', () => {
  assert.ok(weakGloss('Indefinably large, countlessly great; immense.'));
  assert.ok(weakGloss('By surprise; startled; dumbfounded. (see usage).'));
  assert.ok(!weakGloss('Up to this or that time.'));
  assert.ok(MIN_TRANSLATIONS >= 25);
});
