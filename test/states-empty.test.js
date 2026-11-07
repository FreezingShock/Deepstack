import {test} from 'node:test';
import assert from 'node:assert/strict';
import {curioLeaves} from '../src/ui/curioLog.js';
import {statsLeaves} from '../src/ui/statsPages.js';
import {emptyBlock} from '../src/ui/emptyPages.js';
import {FLOORS, floorStartFt} from '../src/core/floors.js';

const TIERS = Array.from({length: 7}, (_, i) => ({id: i, name: 'T' + i, spine: '#fff'}));

test('an empty emptyBlock is a sketch and one written line, with the compact variant named', () => {
  const html = emptyBlock('shelf', 'Nothing here yet.', 'compact');
  assert.match(html, /class="ep-empty compact"/);
  assert.match(html, /<svg class="ep-sketch"/);
  assert.match(html, /<p class="hand">Nothing here yet\.<\/p>/);
});

test('no curios yet: the Curios page shows the sketch and how to find one, not bare text', () => {
  const [head] = curioLeaves({S: {curios: {found: {}}}});
  assert.match(head, /ep-empty compact/);
  assert.match(head, /Nothing kept yet\./);
  assert.match(head, /loose page, a ribbon or a clasp/);
  assert.doesNotMatch(head, /<p class="empty hand">/);
});

test('an empty Almanac, Lexicon and Depths each say what fills them, with a sketch', () => {
  const st = {runs: 0, books: 0, answered: 0, tiers: [0, 0, 0, 0, 0, 0, 0], recent: [], streak: 0, bestStreak: 0, deepest: 0, totalFt: 0, avg: 0};
  const ctx = {TIERS, FLOORS, floorStartFt};
  const [, depths] = statsLeaves(st, {}, ctx);
  assert.match(depths, /The Depths/);
  const pages = statsLeaves({...st, runs: 1, recent: []}, {shelf: [], rating: {hist: []}}, ctx).join('');
  assert.match(pages, /Not rated yet\./);
  assert.match(pages, /ep-empty compact/);
  assert.match(pages, /No descents yet\./);
  assert.match(pages, /Nothing shelved yet\./);
  assert.doesNotMatch(pages, /<p class="empty hand">/);
});
