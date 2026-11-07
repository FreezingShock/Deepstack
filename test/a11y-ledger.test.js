// Librarian's Card: rows are buttons, so the card must not put role=button inside a <dl> (axe: definition-list,
// dlitem). Each row's accessible name must contain its visible words, so the label and the text agree (WCAG 2.5.3).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ledgerHTML} from '../src/ui/welcome.js';
import {ROOMS} from '../src/core/rooms.js';

const card = ledgerHTML({streak: 4, deepest: 1234, books: 9, floor: 'The Archive', room: ROOMS[1]});

test('the Librarian\'s Card uses no description list around its buttons', () => {
  assert.doesNotMatch(card, /<\/?dl[\s>]/);
  assert.doesNotMatch(card, /<\/?d[td][\s>]/);
});

test('every Card row is a button whose name starts with its visible words', () => {
  const rows = [...card.matchAll(/<div class="lg-row[^"]*"[^>]*role="button"[^>]*aria-label="([^"]+)"[^>]*>(.*?)<\/div>/g)];
  assert.equal(rows.length, 4);
  for (const [, label, inner] of rows) {
    const visible = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = visible.split(' ').filter(Boolean);
    assert.ok(label.includes(words.slice(0, 2).join(' ')), `"${label}" should contain "${words.slice(0, 2).join(' ')}"`);
  }
});

test('the room names on Card rows are in the label, not only as tags', () => {
  assert.match(card, /aria-label="Streak Chronicle \d+\. Opens the Ember Log"/);
});
