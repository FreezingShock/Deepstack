import test from 'node:test';
import assert from 'node:assert/strict';
import {SETS, setStatus, bonusFt, recordBook, backfill, MIN_SCORE} from '../src/sets/sets.js';
import {BANK} from '../src/core/words.js';

const mini = [{id: 't', name: 'T', blurb: '', bonus: 100, words: ['alpha', 'beta']}];

test('a set completes once, when its last word is collected, and pays its bonus',()=>{
  const S = {};
  assert.deepEqual(recordBook(S, {w: 'alpha', score: 40}, 'd1', mini), []);
  assert.equal(bonusFt(S, mini), 0);
  const fin = recordBook(S, {w: 'Beta', score: 20}, 'd2', mini);
  assert.equal(fin.length, 1);
  assert.equal(bonusFt(S, mini), 100);
  assert.deepEqual(recordBook(S, {w: 'beta', score: 90}, 'd3', mini), []); // no double pay
  assert.equal(S.sets.done.t, 'd2');
  assert.equal(S.sets.got.beta, 90); // keeps the best score
});
test('weak answers and skips do not collect',()=>{
  const S = {};
  recordBook(S, {w: 'alpha', score: MIN_SCORE - 1}, 'd', mini);
  recordBook(S, {w: 'alpha', score: 0, answer: ''}, 'd', mini);
  assert.equal(setStatus(S, mini)[0].n, 0);
});
test('old saves without S.sets work, and backfill reads shelf and dailies without paying out',()=>{
  const S = {shelf: [{w: 'alpha', score: 50}], daily: {'2026-01-01': {books: [{w: 'beta', score: 30}]}}};
  assert.equal(setStatus({}, mini)[0].n, 0);
  backfill(S, mini);
  assert.equal(setStatus(S, mini)[0].complete, true);
  assert.equal(S.sets.done.t, 'earlier');
  backfill(S, mini); // idempotent
});
test('set definitions are sane',()=>{
  const ids = new Set(), seen = new Set();
  for (const s of SETS) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.ok(s.words.length >= 4 && s.bonus > 0);
    for (const w of s.words) { assert.ok(!seen.has(w), 'word in two sets: ' + w); seen.add(w); }
  }
});
test('every set word can actually be asked (is in the playable pool)',async()=>{
  const fs = await import('node:fs');
  const {buildPool} = await import('../src/core/wordPool.js');
  const pool = new Set(buildPool(JSON.parse(fs.readFileSync(new URL('../public/data/words.json', import.meta.url)))).map(w => w.w));
  for (const s of SETS) for (const w of s.words) assert.ok(pool.has(w), `${s.id}: ${w} is not playable`);
});
