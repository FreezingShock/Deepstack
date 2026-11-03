import test from 'node:test';
import assert from 'node:assert/strict';
import {judge} from '../src/scorer/lexical.js';
import {WORDS} from '../src/core/words.js';
import {dailyWords} from '../src/core/daily.js';

const w = n => WORDS.find(x => x.w === n);
test('good answer scores high, nonsense scores low', () => {
  assert.ok(judge('lasting for only a very short time, fleeting', w('ephemeral')).score >= 60);
  assert.ok(judge('a type of large green vegetable', w('ephemeral')).score < 15);
});
test('daily words are deterministic and ramp in difficulty', () => {
  const a = dailyWords('2026-11-03', 7), b = dailyWords('2026-11-03', 7);
  assert.deepEqual(a.map(x => x.w), b.map(x => x.w));
  assert.ok(a[6].d > a[0].d);
});
