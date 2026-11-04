import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurio, curioKind, curioText, hitCurio, KINDS, SEALED_BELOW} from '../src/ui/curios.js';
import {isLore} from '../src/ui/lore.js';

const book = (o = {}) => ({x: 100, w: 18, h: 90, seed: 3, tilt: 0, lying: false, ...o});

test('curios are rare thin upright books, never lore books', () => {
  assert.ok(isCurio(book()));
  assert.ok(!isCurio(book({w: 28, seed: 20})));
  assert.ok(!isCurio(book({lying: true})));
  let n = 0;
  for (let s = 0; s < 3400; s++) { const b = book({seed: s}); if (isCurio(b)) { n++; assert.ok(!isLore(b)); } }
  assert.ok(n >= 150 && n <= 250, String(n));
});

test('curios keep clear of pillars and the alcove like lore books', () => {
  assert.ok(!isCurio(book({x: 1000 / 3 - 20}), 1000));
});

test('kind and text are deterministic and cover all three kinds', () => {
  const seen = new Set();
  for (let s = 3; s < 3000; s += 17) { const b = book({seed: s}); seen.add(curioKind(b)); assert.deepEqual(curioText(8, b), curioText(8, b)); }
  assert.deepEqual([...seen].sort(), [...KINDS].sort());
});

test('a sealed book stays shut near the top and opens at depth', () => {
  const b = book({seed: [...Array(400).keys()].map(i => 3 + i * 17).find(s => curioKind(book({seed: s})) === 'sealed')});
  assert.match(curioText(SEALED_BELOW - 1, b).text, /Locked/);
  assert.doesNotMatch(curioText(SEALED_BELOW + 5, b).text, /Locked/);
});

test('hit test finds a curio and ignores plain neighbours', () => {
  const b = book(), rh = 150, r = 3, cam = 200, base = r * rh - cam + rh - 12;
  assert.equal(hitCurio({bs: [b, book({x: 200, seed: 4})]}, r, rh, 2000, cam, 0, 109, base - 40), b);
  assert.equal(hitCurio({bs: [b, book({x: 200, seed: 4})]}, r, rh, 2000, cam, 0, 209, base - 40), null);
});
