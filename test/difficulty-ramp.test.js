import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSpecialist, effectiveDifficulty, rampTargets} from '../src/core/difficulty.js';
import {buildPool, rejectReason} from '../src/core/wordPool.js';
import {WORDS} from '../src/core/words.js';
import {dailyWords} from '../src/core/daily.js';

test('ramp targets rise monotonically and span easy to hard', () => {
  const t = rampTargets(7);
  assert.equal(t.length, 7);
  for (let i = 1; i < t.length; i++) assert.ok(t[i] > t[i - 1]);
  assert.ok(t[0] < 2.5 && t[6] > 6 && t[6] <= 7);
});

test('widely translated words read easier, thin ones harder', () => {
  assert.ok(effectiveDifficulty(5, 100) < 5);
  assert.ok(effectiveDifficulty(5, 26) >= 5 - 0.2);
  assert.equal(effectiveDifficulty(5, null), 5);
});

test('specialist taxonomy, chemistry and medicine glosses are rejected', () => {
  assert.ok(isSpecialist('A hardwood tree of the genus Juglans.'));
  assert.ok(isSpecialist('A chemical element (symbol N) with an atomic number of 7.'));
  assert.ok(isSpecialist('An invasive malignant tumour derived from epithelial tissue.'));
  assert.ok(!isSpecialist('Showing a lack of courage or determination; timid.'));
  assert.ok(!isSpecialist('An organism which eats others of its own species or kind.'));
  assert.equal(rejectReason({w: 'walnut', pos: 'noun', def: 'A hardwood tree of the genus Juglans.', t: 60}), 'specialist');
});

test('daily words ramp upward, differ in stem, and are stable', () => {
  const data = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url)));
  const pool = buildPool(data);
  WORDS.length = 0; WORDS.push(...pool);
  for (const day of ['2026-11-03', '2026-11-04', '2026-12-25', '2027-02-01']) {
    const w = dailyWords(day, 7);
    assert.deepEqual(w.map(x => x.w), dailyWords(day, 7).map(x => x.w));
    for (let i = 1; i < 7; i++) assert.ok(w[i].d >= w[i - 1].d);
    assert.equal(new Set(w.map(x => x.w.slice(0, 5))).size, 7);
    assert.ok(w[0].d < 3 && w[6].d > 5);
  }
});
