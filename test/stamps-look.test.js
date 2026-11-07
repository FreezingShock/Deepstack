import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setRoomLists, setRoomEntries, setRoomExtras} from '../src/core/roomPool.js';
import {stampTally, CATALOG} from '../src/core/stamps.js';
import {stampsLeaves} from '../src/ui/stampsPage.js';
import {stampToastHTML} from '../src/ui/stampToast.js';

const seeded = {shelf: [], met: {}, stamps: {'history.first': '2026-11-02', 'history.week': '2026-11-06', 'library.doors': '2026-11-06'}};

test('the Stamps page draws every stamp once, on two leaves, with the earned ones lit', () => {
  setRoomEntries(null); setRoomExtras({}); setRoomLists({});
  const [a, b] = stampsLeaves(seeded);
  const html = a + b;
  assert.equal((html.match(/class="stp-seal /g) || []).length, CATALOG.length, 'one seal per stamp');
  assert.equal((html.match(/class="stp-seal on/g) || []).length, stampTally(seeded).earned, 'lit seals match what is earned');
  assert.equal(stampTally(seeded).earned, 3);
  assert.match(a, /<h1>Stamps<\/h1>/);
  assert.match(a, /3 of 41 earned/);
  assert.match(a, /Chronicle/);
  assert.match(b, /The library/);
  assert.equal((a.match(/class="stp-row"/g) || []).length, 3, 'three rooms on the first leaf');
  assert.equal((b.match(/class="stp-row"/g) || []).length, 4, 'three rooms and the library on the second');
});

test('a seal says what it is and how it is earned, for screen readers and hover', () => {
  const [a] = stampsLeaves(seeded);
  assert.match(a, /aria-label="First word\. Meet a word in this room\. Earned Nov 2\."/);
  assert.match(a, /aria-label="First word\. Meet a word in this room\. Not yet\."/, 'the Counting House has not earned its first word');
});

test('the toast names each new stamp with its room, or the library, and escapes its text', () => {
  const html = stampToastHTML([
    {id: 'history.first', room: 'history', name: 'First word', hint: 'Meet a word in this room.'},
    {id: 'library.doors', room: null, name: 'Every door opened', hint: 'Open all 6 topic rooms.'},
    {id: 'math.perfect', room: 'math', name: 'Perfect <Daily>', hint: 'Every word & none skipped.'}
  ]);
  assert.equal((html.match(/class="stp-entry"/g) || []).length, 3, 'one section per stamp');
  assert.match(html, /<span>3 stamps earned<\/span>/, 'the head counts them');
  assert.match(html, /<b class="stp-name">First word<\/b><small class="stp-where">Chronicle<\/small>/);
  assert.match(html, /<b class="stp-name">Every door opened<\/b><small class="stp-where">The library<\/small>/);
  assert.match(html, /Kept in the Almanac/);
  assert.match(html, /--d:180ms/, 'the first seal presses first');
  assert.match(html, /--d:500ms/, 'and the next one after it');
  assert.match(html, /class="stp-name">Perfect &lt;Daily&gt;/);
  assert.match(html, /Every word &amp; none skipped/);
  assert.doesNotMatch(html, /<Daily>/);
});

test('the stamp look uses the tokens and the room colour only through --c, with no raw hex', () => {
  const css = readFileSync(new URL('../src/ui/stamps.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'colours come from tokens');
  assert.match(css, /:where\(html\.rm\) #stamptoast,:where\(html\.rm\) #stamptoast \.stp-seal,:where\(html\.rm\) #stamptoast::after\{transition:none;animation:none\}/);
  assert.match(css, /@keyframes stpPress/);
});
