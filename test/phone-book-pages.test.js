import test from 'node:test';
import assert from 'node:assert/strict';
import {introSpreads,BOOK_INTROS} from '../src/ui/home.js';

test('intro book keeps its Start button on the first page on phones', () => {
  globalThis.matchMedia = q => ({matches: q.includes('max-width:560px')});
  const [sp] = introSpreads(BOOK_INTROS.bUnl);
  assert.match(sp.l, /bs-start/);
  assert.equal(sp.r, '');
  delete globalThis.matchMedia;
});

test('intro book stays two-page on wide screens', () => {
  globalThis.matchMedia = () => ({matches: false});
  const [sp] = introSpreads(BOOK_INTROS.bUnl);
  assert.doesNotMatch(sp.l, /bs-start/);
  assert.match(sp.r, /bs-start/);
  delete globalThis.matchMedia;
});
