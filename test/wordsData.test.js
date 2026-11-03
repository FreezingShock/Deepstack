import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseFreq, fitDifficulty, difficultyOf, collect, makeHint} from '../scripts/lib/wordsData.mjs';

const entries = readFileSync(new URL('./fixtures/kaikki-sample.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const freq = parseFreq('walked 9000\nephemeral 256\nquixotic 76\nzzyzx 1\nParis 500\ndiligent 784\nabandon 9208\npulchritude 50\n');

test('collect keeps usable senses and drops forms, names, obsolete and rare words', () => {
  const r = collect(entries, freq);
  assert.deepEqual([...r.keys()].sort(), ['ephemeral', 'quixotic']);
  assert.equal(r.get('quixotic').def, 'Exceedingly idealistic; unrealistic and impractical.');
});
test('hint blanks the word and skips missing examples', () => {
  const r = collect(entries, freq);
  assert.match(r.get('ephemeral').hint, /^The beauty of cherry blossoms is ___ and falls/);
  assert.equal(r.get('quixotic').hint, null);
  assert.equal(makeHint('x', [{text: 'short'}]), null);
});
test('difficulty falls as frequency rises, anchored to hand-tuned values', () => {
  const anchors = [{w: 'abandon', d: 1.2}, {w: 'diligent', d: 2.0}, {w: 'ephemeral', d: 3.8}, {w: 'quixotic', d: 8.3}, {w: 'pulchritude', d: 9.0}];
  const fit = fitDifficulty(anchors, freq);
  assert.ok(fit.b < 0);
  assert.ok(difficultyOf(fit, freq, 'abandon') < difficultyOf(fit, freq, 'quixotic'));
  assert.ok(Math.abs(difficultyOf(fit, freq, 'quixotic') - 8.3) < 1.5);
});
