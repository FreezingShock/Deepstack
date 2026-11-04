import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relate, setRelations} from '../src/scorer/relations.js';
import {wnSynonyms, mobySynonyms, wnNear} from '../scripts/lib/wordnet.mjs';

const wn = {
  idx: new Map([['laconic', ['1a']], ['terse', ['2a']], ['sharp', ['3a']]]),
  syn: new Map([['1a', {words: ['laconic', 'curt', 'terse', 'sententious'], gloss: 'brief and to the point', sim: ['3a']}], ['2a', {words: ['terse', 'curt'], gloss: 'brief', sim: []}], ['3a', {words: ['sharp'], gloss: 'cutting', sim: []}]]),
};
const overlap = (g, d) => (d.includes(g.split(' ')[0]) ? 1 : 0);
const common = w => w !== 'sententious';

test('wordnet synonyms keep common words from the sense that matches the definition', () => {
  const m = wnSynonyms(wn, 'laconic', 'brief and curt in speech', overlap, common);
  assert.equal(m.get('curt'), 7);
  assert.equal(m.get('terse'), 7);
  assert.equal(m.get('sharp'), 1); // a "similar to" satellite ranks below the synset itself
  assert.ok(!m.has('sententious'), 'rare words are dropped by the frequency filter');
  assert.ok(!m.has('laconic'));
});
test('moby entries count only when they list the word back', () => {
  const moby = new Map([['laconic', new Set(['curt', 'mute'])], ['curt', new Set(['laconic'])], ['mute', new Set(['quiet'])]]);
  assert.deepEqual(mobySynonyms(moby, 'laconic', () => true), ['curt']);
});
test('wnNear reaches synonyms of synonyms', () => {
  assert.ok(wnNear(wn, 'laconic').has('curt'));
});
test('c lists (everyday synonyms) count as synonyms of the target', () => {
  const REL = {laconic: {s: ['terse'], c: ['curt']}};
  setRelations(REL);
  assert.deepEqual(relate('curt', {w: 'laconic', def: 'Using few words.'}, REL).syn, ['curt']);
  setRelations(null);
});
test('shipped relations.json knows common synonyms Wiktionary lacked', () => {
  const rel = JSON.parse(readFileSync(new URL('../public/data/relations.json', import.meta.url))).rel;
  const has = (w, x) => [...(rel[w]?.s || []), ...(rel[w]?.c || [])].includes(x);
  for (const [w, x] of [['laconic', 'curt'], ['candid', 'blunt'], ['diligent', 'conscientious']]) assert.ok(has(w, x), `${w} -> ${x}`);
  assert.ok(!rel.laconic.c.includes('talkative'), 'no antonyms among the everyday synonyms');
});
