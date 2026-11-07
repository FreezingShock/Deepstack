// Markup rules the accessibility audit (scripts/a11y.mjs) depends on, checked without a browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ledgerHTML} from '../src/ui/welcome.js';
import {doorHTML, ringHTML} from '../src/ui/roomHome.js';
import {ROOMS} from '../src/core/rooms.js';

test('the Librarian\'s Card list holds only dt/dd groups, and each opening row has a button for its value', () => {
  const html = ledgerHTML({streak: 3, deepest: 40, books: 7, floor: 'The Stacks', floorKey: 'stacks', room: null});
  const dl = html.slice(html.indexOf('<dl'), html.indexOf('</dl>'));
  // every direct child of the dl is a plain div group, never an element with a role of its own
  assert.doesNotMatch(dl, /<dl[^>]*role=/);
  assert.equal((dl.match(/<div class="lg-row/g) || []).length, 4);
  assert.doesNotMatch(dl, /<div class="lg-row[^"]*"[^>]*role=/);
  // the rows that open a book carry the button, and the streak keeps its id for the Ember Log
  assert.equal((dl.match(/<button type="button" class="lg-val"/g) || []).length, 4);
  assert.match(dl, /<div class="lg-row lg-streak lg-link"[^>]*id="bStreak"/);
  assert.match(dl, /aria-label="Streak: 3\. Opens the Ember Log"/);
});

test('a room door is named by the visible text, with its direction in a screen-reader prefix', () => {
  const r = ROOMS.find(x => x.id !== 'hall') || ROOMS[0];
  const html = doorHTML(r, 'next', '0 of 40 met');
  assert.doesNotMatch(html, /aria-label=/); // the name is the visible text, so it cannot disagree with it
  assert.match(html, /<span class="sr-only">Next room: <\/span>/);
  assert.match(html, /<i class="rm-arrow" data-arrow="›"><\/i>/);
  assert.match(html, /0 of 40 met/);
});

test('the lit room light says it is where you are', () => {
  const html = ringHTML(ROOMS[0].id);
  assert.match(html, /aria-label="[^"]+, you are here" aria-current="true"/);
});

test('the top bar shortcut button sends its ? key where the shortcut listener is (document, not window)', async () => {
  const {readFileSync} = await import('node:fs');
  const src = readFileSync(new URL('../src/ui/topbarRail.js', import.meta.url), 'utf8');
  const line = src.split('\n').find(l => l.includes("key:'?'")) || '';
  assert.match(line, /document\.dispatchEvent\(new KeyboardEvent\('keydown',\{key:'\?',bubbles:true\}\)\)/);
  const keys = readFileSync(new URL('../src/ui/keys.js', import.meta.url), 'utf8');
  assert.match(keys, /doc\.addEventListener\('keydown'/); // the listener the button must reach
});
