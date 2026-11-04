import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loreCovered} from '../src/ui/loreCover.js';
import {hitLoreBook, isLore} from '../src/ui/lore.js';

// Pins #38/#45: lore books are reachable, and only an alcove can hide one.
const W = 1280, H = 800, RH = 140, BM = 14;
const n = {x: (W - 760) / 2, w: 760, t: 68, h: 400};           // nicheBox() shape: centred, up to 760 wide
const book = (o = {}) => ({x: 100, w: 28, h: 90, seed: 10, tilt: 0, lying: false, ...o});

test('a book left or right of the alcove is never covered, on any row, at any scroll', () => {
  for (const x of [0, 100, n.x - 30, n.x + n.w, W - 40]) for (const cam of [0, 700, 5000]) for (const nr of [0, 1, 7])
    assert.equal(loreCovered(book({x}), 400, cam, n, [nr], RH, H, BM), false, `x=${x} cam=${cam}`);
});
test('rows with no open alcove never cover a book, even in the middle of the screen', () => {
  assert.equal(loreCovered(book({x: W / 2}), 400, 0, n, [], RH, H, BM), false);
});
test('a book inside the alcove band is covered; one on a distant row is not', () => {
  const nr = 4, cam = nr * RH - (H - RH - BM);           // alcove 4 sits at the top of the view
  const ny = n.t + (nr * RH - (H - RH - BM)) - cam;
  assert.equal(loreCovered(book({x: W / 2}), ny + 200, cam, n, [nr], RH, H, BM), true);
  assert.equal(loreCovered(book({x: W / 2}), ny + n.h + 400, cam, n, [nr], RH, H, BM), false);
});
test('an uncovered lore book is clickable and a covered one is not', () => {
  const b = book({x: 150}), d = {bs: [b]}, r = 3, cam = 200, base = r * RH - cam + RH - 12;
  assert.equal(hitLoreBook(d, r, RH, W, cam, 0, 164, base - 40, (bk, bs) => loreCovered(bk, bs, cam, n, [], RH, H, BM)), b);
  assert.equal(hitLoreBook(d, r, RH, W, cam, 0, 164, base - 40, () => true), null);
});
test('every book the game marks as lore sits clear of the alcove at every viewport width', () => {
  let marked = 0;
  for (const W of [390, 768, 1024, 1280, 1920]) {
    const nw = Math.min(W - 24, 760), nx = (W - nw) / 2;
    for (let seed = 0; seed < 2000; seed += 5) for (let x = 0; x < W; x += 13) {
      const b = book({x, seed, w: 24 + (seed % 9)});
      if (!isLore(b, W)) continue;
      marked++;
      assert.ok(b.x + b.w <= nx || b.x >= nx + nw, `lore book at x=${x} overlaps the alcove at W=${W}`);
    }
  }
  assert.ok(marked > 100, 'lore books are still being marked: ' + marked);
});
