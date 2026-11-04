import test from 'node:test';
import assert from 'node:assert/strict';
import {keepCurio, foundCount, isKept, curioLeaves, unlockedLines, LETTER} from '../src/ui/curioLog.js';
import {curioKind, SEALED_BELOW} from '../src/ui/curios.js';

const book = seed => ({seed, w: 18, h: 90});
const sealedSeed = [...Array(400).keys()].map(i => 3 + i * 17).find(s => curioKind(book(s)) === 'sealed');
const openSeed = [...Array(400).keys()].map(i => 3 + i * 17).find(s => curioKind(book(s)) !== 'sealed');

test('keeping is additive, tolerates a missing field and never duplicates', () => {
  const S = {shelf: []};
  const a = keepCurio(S, 10, book(openSeed));
  assert.ok(a.fresh && a.n === 1 && a.line === LETTER[0][1]);
  assert.ok(isKept(S, 10, book(openSeed)));
  assert.ok(!keepCurio(S, 10, book(openSeed)).fresh);
  assert.equal(foundCount(S), 1);
});

test('a sealed book too shallow is not kept, deeper it is', () => {
  const S = {};
  assert.ok(keepCurio(S, SEALED_BELOW - 1, book(sealedSeed)).locked);
  assert.equal(foundCount(S), 0);
  assert.ok(keepCurio(S, SEALED_BELOW + 1, book(sealedSeed)).fresh);
});

test('letter lines unlock with the count; leaves render at any size', () => {
  assert.equal(unlockedLines(0), 0);
  assert.equal(unlockedLines(30), LETTER.length);
  const S = {};
  for (let i = 0; i < 7; i++) keepCurio(S, 60 + i, book(openSeed));
  const leaves = curioLeaves(S);
  assert.equal(leaves.length, 3);
  assert.equal(curioLeaves({}).length, 1);
});
