import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreFromSims, RELATION} from '../src/scorer/embedding.js';
import {setSenses, senseTexts, sensesOf} from '../src/scorer/senses.js';
import {meaningRows, alsoMeansHTML} from '../src/ui/alsoMeans.js';
import {pickAlts} from '../scripts/lib/sensesData.mjs';

const word = {w: 'frugal', def: 'Sparing or economical with money or resources.'};
const prep = {text: 'a thing', content: 3, usedWord: false, tokens: ['thing']};
const base = (ctx = {}) => scoreFromSims([.05], prep, 'a thing', {word, ...ctx});
const rel = o => ({syn: [], hyp: [], rel: [], near: [], ant: [], flip: [], links: [], cover: 0, extra: 2, echo: 0, broad: 0, broadDef: 0, ...o});

test('a general idea tied to the definition earns a small but real score', () => {
  const none = base({rel: rel({})}).score, echo = base({rel: rel({echo: 1})}).score, broad = base({rel: rel({broad: 1})}).score;
  assert.equal(none, 0);
  assert.ok(echo >= 10 && echo < 30, `echo ${echo}`);
  assert.ok(broad >= 10 && broad < 30, `broad ${broad}`);
});

test('lenient floors stay below a real synonym', () => {
  const syn = base({rel: rel({syn: ['thrifty'], extra: 0})}).score;
  assert.ok(syn > base({rel: rel({broad: 2, broadDef: 2, echo: 2})}).score);
});

test('other meanings count, discounted and capped', () => {
  const alt = base({altSim: .9}).score, gloss = base({glossSim: .9}).score;
  for (const s of [alt, gloss]) assert.ok(s > 20 && s <= 50, `score ${s}`);
  assert.equal(base({altSim: .2}).score, 0);
  assert.ok(RELATION.altDiscount > 0 && RELATION.glossDiscount >= RELATION.altDiscount);
});

test('an antonym is not rescued by leniency', () => {
  const s = base({rel: rel({ant: ['wasteful'], extra: 0, broad: 1, echo: 1})}).score;
  assert.ok(s < 12, `score ${s}`);
});

test('senseTexts and meaningRows read the senses data', () => {
  const sen = {frugal: {alt: [['adjective', 'Simple and plain, not lavish.']], syn: [['thrifty', 'Careful about spending money.']]}};
  setSenses(sen);
  const t = senseTexts(word);
  assert.deepEqual(t.alt, ['Simple and plain, not lavish']);
  assert.deepEqual(t.syn, ['thrifty: Careful about spending money']);
  const rows = meaningRows({w: 'frugal', def: word.def}, sen);
  assert.equal(rows.length, 2);
  assert.match(alsoMeansHTML({w: 'frugal', def: word.def}, sen), /Also means.*simple and plain.*thrifty/s);
  assert.equal(alsoMeansHTML({w: 'frugal', skipped: true}, sen), '');
  assert.equal(alsoMeansHTML({w: 'nothing'}, sen), '');
  setSenses(null);
  assert.equal(sensesOf('frugal'), null);
});

test('pickAlts keeps different meanings only', () => {
  const e = {pos: 'adj', senses: [{glosses: ['Sparing or economical with money.']}, {glosses: ['Plain and modest, not lavish at all.']}, {glosses: ['A kind of person who saves.']}]};
  assert.deepEqual(pickAlts([e], word.def), [['adjective', 'Plain and modest, not lavish at all.']]);
});

test('the shipped senses.json is well formed', () => {
  const d = JSON.parse(readFileSync(new URL('../public/data/senses.json', import.meta.url)));
  const w = Object.entries(d.words);
  assert.ok(w.length > 5000);
  for (const [k, v] of w.slice(0, 500)) {
    assert.ok(!v.alt || v.alt.length <= 3, k);
    for (const [a, g] of [...(v.alt || []), ...(v.syn || [])]) assert.ok(a && g.length >= 10 && g.length <= 121, k + a);
  }
});
