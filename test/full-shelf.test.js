// A full 300-book save through the pure shelf, attic and Sets logic: stays correct and fast.
// The browser half (render, climb, layout) is scripts/stress300.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fullSave} from '../scripts/lib/fullSave.mjs';
import {filterShelf, groupShelf} from '../src/core/shelf.js';
import {atticAll, atticTidy, atticCrates, hasFloor} from '../src/core/attic.js';
import {setStatus, backfill} from '../src/sets/sets.js';

const S = fullSave();
const time = fn => { const t = performance.now(); const r = fn(); return [r, performance.now() - t]; };

test('the seeded save is a full, varied shelf', () => {
  assert.equal(S.shelf.length, 300);
  assert.ok(new Set(S.shelf.map(b => b.tier)).size >= 5, 'most tiers present');
  const loose = S.shelf.filter(b => !hasFloor(b)).length;
  assert.ok(loose > 20 && loose < 120, `some floorless books for the attic, got ${loose}`);
  assert.deepEqual(fullSave(), S, 'deterministic');
});

test('shelf filter, sort and grouping on 300 books are fast and keep every book', () => {
  const [items, ms] = time(() => filterShelf(S.shelf, {}));
  assert.equal(items.length, 300);
  for (const mode of ['day', 'tier']) assert.equal(groupShelf(items, mode, ['a', 'b', 'c', 'd', 'e', 'f', 'g']).reduce((n, g) => n + g.items.length, 0), 300);
  for (const sort of ['az', 'score', 'new']) assert.equal(filterShelf(S.shelf, {sort}).length, 300);
  assert.equal(filterShelf(S.shelf, {q: S.shelf[7].w.slice(0, 3)}).every(x => x.b.w.includes(S.shelf[7].w.slice(0, 3))), true);
  assert.ok(ms < 50, `filterShelf took ${ms.toFixed(1)} ms`);
});

test('the attic lists every floorless book once, plus recent guesses, in good time', () => {
  const [items, ms] = time(() => atticTidy(atticAll(S.shelf)));
  const words = items.map(x => x.b.w.toLowerCase());
  assert.equal(new Set(words).size, words.length, 'a repeated word is one book with a tally, not two');
  assert.equal(items.reduce((n, x) => n + x.n, 0), atticAll(S.shelf).length, 'the tallies add back up');
  const up = new Set(words);
  assert.ok(S.shelf.every(b => hasFloor(b) || up.has(b.w.toLowerCase())), 'every floorless book is up there');
  assert.ok(atticCrates(items).every(c => c.items.length <= 8));
  assert.ok(ms < 100, `attic listing took ${ms.toFixed(1)} ms`);
});

test('Sets backfill and status on 300 books', () => {
  const s = structuredClone(S);
  const [, ms] = time(() => { backfill(s); return setStatus(s); });
  assert.ok(ms < 50, `sets took ${ms.toFixed(1)} ms`);
});
