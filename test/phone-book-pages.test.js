import test from 'node:test';
import assert from 'node:assert/strict';
import {introSpreads,BOOK_INTROS} from '../src/ui/home.js';
const PLAIN={h:'Plain',kicker:'k',p:'text',pts:['a','b'],btn:'Go'};

test('intro book keeps its Start button on the first page on phones', () => {
  globalThis.matchMedia = q => ({matches: q.includes('max-width:560px')});
  const [sp] = introSpreads(PLAIN);
  assert.match(sp.l, /bs-start/);
  assert.equal(sp.r, '');
  delete globalThis.matchMedia;
});

test('intro book stays two-page on wide screens', () => {
  globalThis.matchMedia = () => ({matches: false});
  const [sp] = introSpreads(PLAIN);
  assert.doesNotMatch(sp.l, /bs-start/);
  assert.match(sp.r, /bs-start/);
  delete globalThis.matchMedia;
});

import {railFraction} from '../src/ui/tracker.js';
test('rail fraction stays within 0..1 for tap-to-jump math', () => {
  const f = railFraction(99999, [0, 100, 250]);
  assert.ok(f > 0 && f <= 1);
});

test('Unlimited is one book with two sections on the same two pages: Unlimited and Riddle', () => {
  for (const narrow of [true, false]) {
    globalThis.matchMedia = q => ({matches: narrow && q.includes('max-width:560px')});
    const sp = introSpreads(BOOK_INTROS.bUnl);
    assert.equal(sp.length, 1);
    assert.match(sp[0].l, /aria-label="Unlimited"[\s\S]*bs-start/);
    assert.match(sp[0].r, /aria-label="Riddle"[\s\S]*data-act="riddle"/);
    delete globalThis.matchMedia;
  }
  assert.equal(BOOK_INTROS.bRid, undefined);
});
