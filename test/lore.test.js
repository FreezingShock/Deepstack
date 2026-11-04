import test from 'node:test';
import assert from 'node:assert/strict';
import {isLore, hitLoreBook, loreWord} from '../src/ui/lore.js';
import {hashStr} from '../src/core/daily.js';

const book = (o = {}) => ({x: 100, w: 28, h: 90, seed: 10, tilt: 0, lying: false, ...o});

test('only thick, upright books with a marked seed are lore books', () => {
  assert.ok(isLore(book()));
  assert.ok(!isLore(book({w: 20})));
  assert.ok(!isLore(book({seed: 11})));
  assert.ok(!isLore(book({lying: true})));
});

test('about one in five thick books is marked, keeping the cost and clutter low', () => {
  let n = 0; for (let s = 0; s < 1000; s++) if (isLore(book({seed: s}))) n++;
  assert.ok(n >= 150 && n <= 250, String(n));
});

test('hit test finds a book on an upright row and ignores row 0 and gaps', () => {
  const b = book(), d = {bs: [b, book({x: 200, seed: 11})]};
  const rh = 150, r = 3, cam = 200, base = r * rh - cam + rh - 12;
  assert.equal(hitLoreBook(d, r, rh, 900, cam, 0, 114, base - 40), b);
  assert.equal(hitLoreBook(d, r, rh, 900, cam, 0, 114, base - 200), null); // above the book
  assert.equal(hitLoreBook(d, r, rh, 900, cam, 0, 214, base - 40), null);  // unmarked neighbour
  assert.equal(hitLoreBook(d, 0, rh, 900, cam, 0, 114, base - 40), null);  // row 0 is the player's shelf
});

test('hit test follows a leaning, tilted row', () => {
  const rh = 150, r = 5, cam = 300, W = 900, a = 1, y = r * rh - cam, base = y + rh - 12;
  const b = book({x: 40, tilt: .2});
  // forward-transform the book's centre the way the renderer does, then expect a hit there
  const th = .085 * a, cx = W / 6, cy = y + rh / 2;
  let lx = 0, ly = -b.h / 2; // local, before tilt
  const ox = b.w / 2; let dx = lx - ox; lx = ox + dx * Math.cos(b.tilt) - ly * Math.sin(b.tilt); ly = dx * Math.sin(b.tilt) + ly * Math.cos(b.tilt);
  const wx = b.x + b.w / 2 + lx, wy = base + ly;
  const px = cx + (wx - cx) * Math.cos(th) - (wy - cy) * Math.sin(th), py = cy + (wx - cx) * Math.sin(th) + (wy - cy) * Math.cos(th);
  assert.equal(hitLoreBook({bs: [b]}, r, rh, W, cam, a, px, py), b);
});

test('lore word is stable, skips excluded words and drifts harder with depth', () => {
  const pool = Array.from({length: 600}, (_, i) => ({w: 'w' + i, pos: 'noun', def: 'd', d: 1 + (i % 70) / 10}));
  const a = loreWord(pool, 12, 777, hashStr);
  assert.equal(loreWord(pool, 12, 777, hashStr), a);
  assert.notEqual(loreWord(pool, 12, 777, hashStr, new Set([a.w])).w, a.w);
  const avg = row => { let t = 0; for (let s = 0; s < 200; s++) t += loreWord(pool, row, s, hashStr).d; return t / 200; };
  assert.ok(avg(200) > avg(5) + 1);
  assert.equal(loreWord([], 1, 1, hashStr), null);
});
