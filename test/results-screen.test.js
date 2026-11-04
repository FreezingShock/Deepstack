import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finalHTML} from '../src/ui/results.js';

const books = [
  {w: 'graveyard', tier: 3, score: 80, answer: 'x', ft: 122, hints: 1},
  {w: 'cabaret', tier: 1, score: 25, answer: 'x', ft: 46, combo: {n: 3, mult: 1.25, ft: 20}},
  {w: 'condominium', tier: 0, score: 0, answer: '', ft: 13}
];
const d = {books, avg: 52, best: 3, depth: 181, floor: 1, mode: 'daily'};
const html = finalHTML(d, {}, {txt: 'Deepstack No. 2 <x>', rarest: 'Folio', no: 2, floorName: 'The Archive', levelTitle: () => '', spines: '<img>'});

test('results sheet has the title, depth, run facts, shelf, note and buttons in order', () => {
  const order = ['fkick', 'Descent complete', 'id="cnt"', 'fsub', 'id="sp"', 'rtiles', 'rbooks', 'id="shr"', 'id="cp"', 'id="up"'].map(k => html.indexOf(k));
  assert.ok(order.every(i => i >= 0), 'every part present');
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('share text is escaped and skipped words are labelled', () => {
  assert.ok(html.includes('&lt;x&gt;'));
  assert.ok(html.includes('Skipped'));
  assert.ok(html.includes('×1.25'));
});
