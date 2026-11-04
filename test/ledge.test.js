import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgeLayout, ledgeTip, ledgeLabel} from '../src/ui/ledge.js';
const TIERS = [{name: 'Pamphlet'}, {name: 'Paperback'}];
const dims = () => ({w: 30, h: 80});
test('skipped word keeps its slot, in order, inside the alcove', () => {
  const books = [{w: 'a', skipped: true}, {w: 'b', tier: 1, score: 50}];
  for (const w of [340, 760]) {
    const L = ledgeLayout(books, w, dims);
    assert.equal(L.items.length, 2);
    assert.ok(L.items[0].skipped && L.items[0].dx < L.items[1].dx);
    assert.ok(L.items[0].dx > 0 && L.items[1].dx + L.items[1].w < w);
  }
});
test('labels carry word, tier and answer', () => {
  assert.match(ledgeTip({w: 'x', tier: 1, score: 50, answer: 'hi'}, TIERS), /x · Paperback · 50 — “hi”/);
  assert.equal(ledgeLabel({w: 'x', skipped: true}, TIERS), 'x, skipped');
});
