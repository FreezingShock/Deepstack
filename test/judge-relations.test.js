import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relate, setRelations, relationTexts} from '../src/scorer/relations.js';
import {prepareAnswer, scoreFromSims} from '../src/scorer/embedding.js';

const REL = {
  taciturn: {s: ['reticent', 'untalkative', 'yes man'], r: ['tacit', 'taciturnity'], a: ['talkative', 'loquacious'], n: ['guarded']},
  frugal: {s: ['thrifty', 'economical'], h: ['cautious', 'person'], a: ['lavish']},
  stingy: {s: ['miserly', 'tight']},
  sycophant: {s: ['yes-man', 'toady'], a: ['boss']},
};
const taciturn = {w: 'taciturn', def: 'Habitually not talkative; reserved in speech.'};
const frugal = {w: 'frugal', def: 'Sparing or economical with money, and stingy about it.'};
const sycophant = {w: 'sycophant', def: 'A person who flatters important people to gain advantage.'};
const score = (text, word, sims = [.1], ctx = {}) => scoreFromSims(sims, prepareAnswer(text, word), text, {word, hub: .25, wordSim: .1, rel: relate(text, word, REL), ...ctx});

test('relate finds synonyms, near synonyms and related terms of the target', () => {
  setRelations(REL);
  assert.deepEqual(relate('reticent', taciturn, REL).syn, ['reticent']);
  assert.deepEqual(relate('a guarded sort', taciturn, REL).near, ['guard']);
  assert.deepEqual(relate('tacit', taciturn, REL).rel, ['tacit'].filter(() => false)); // same family as the word: not evidence
  assert.equal(relate('a yes man', taciturn, REL).syn.length, 1); // two-word synonyms match
  assert.equal(relate('cheerful', taciturn, REL).syn.length, 0);
});
test('a bare synonym is forgiven even when the embedding sees nothing; a stray synonym in a long answer barely helps', () => {
  setRelations(REL);
  const bare = score('reticent', taciturn).score, buried = score('my reticent aunt visited the garden market on Sunday', taciturn).score;
  assert.ok(bare >= 46, `bare synonym ${bare}`);
  assert.ok(buried < 30, `buried synonym ${buried}`);
  assert.equal(score('cheerful', taciturn).score, 0);
});
test('negating an antonym counts as a synonym; negating a synonym points the wrong way', () => {
  setRelations(REL);
  assert.deepEqual(relate('not talkative', taciturn, REL).syn, ['talkativ']);
  assert.ok(score('not talkative', taciturn, [.1]).score >= 46);
  assert.ok(score('not reticent', taciturn, [.1]).score < 20);
  assert.ok(score('loquacious', taciturn, [.45]).opposite);
});
test('antonym lists are trusted for short answers only (boss is a noisy "antonym" of sycophant)', () => {
  setRelations(REL);
  const long = score('someone who butters up the boss to get ahead', sycophant, [.5]);
  assert.ok(!long.opposite);
});
test('words in the answer tied to words of the definition earn a small nudge, never past Paperback', () => {
  setRelations(REL);
  const a = relate('miserly with cash', frugal, REL);
  assert.deepEqual(a.links, ['miser']);
  const s = score('miserly with cash', frugal, [.1]).score;
  assert.ok(s > 0 && s < 30, `link nudge ${s}`);
});
test('vague hypernyms say nothing', () => {
  setRelations(REL);
  assert.equal(relate('a person', frugal, REL).hyp.length, 0);
  assert.deepEqual(relate('cautious', frugal, REL).hyp, ['cautiou']);
});
test('no relations loaded: relate is null and scoring falls back to the embedding alone', () => {
  assert.equal(relate('reticent', taciturn, null), null);
  assert.equal(scoreFromSims([.5], prepareAnswer('reticent', taciturn), 'reticent', {word: taciturn}).score, 61);
});
test('relationTexts gives the closest synonyms for embedding', () => {
  const t = relationTexts({w: 'frugal'}, REL);
  assert.deepEqual(t.singles, ['thrifty', 'economical']); assert.equal(t.group, 'thrifty, economical');
  assert.deepEqual(relationTexts({w: 'nothing'}, REL), {group: null, singles: []});
});
test('shipped relations.json: covers the curated words and stays a sane size', () => {
  const d = JSON.parse(readFileSync(new URL('../public/data/relations.json', import.meta.url)));
  assert.equal(d.version, 1);
  for (const w of ['taciturn', 'sycophant', 'frugal', 'ephemeral']) assert.ok(d.rel[w]?.s?.length >= 3, w);
  assert.ok(Object.keys(d.rel).length > 10000);
  for (const [k, v] of Object.entries(d.rel)) { for (const f of Object.keys(v)) assert.ok(['s', 'h', 'r', 'a', 'n'].includes(f), k); }
});
