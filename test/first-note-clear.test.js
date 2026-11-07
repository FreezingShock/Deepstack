// First-time notes go when the player acts: a card opening, or any click, takes every note off the screen.
// The browser side is checked by scripts/first-note-clear.mjs; these tests pin the helpers and the wiring.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {clearAllNotes, initNoteClear} from '../src/ui/firstNotes.js';

const root = process.cwd();
const card = readFileSync(join(root, 'src/app/card.js'), 'utf8');
const main = readFileSync(join(root, 'src/main.js'), 'utf8');

// a tiny document stand-in: the notes are plain nodes with a remove()
function doc(n) {
  const nodes = Array.from({length: n}, (_, i) => ({cls: i % 2 ? 'fcall' : 'fhalo', removed: false, remove() { this.removed = true; }}));
  const listeners = [];
  return {
    nodes, listeners,
    querySelectorAll: sel => (sel === '.fcall, .fhalo' ? nodes.filter(x => !x.removed) : []),
    addEventListener: (ev, fn, cap) => listeners.push({ev, fn, cap}),
    __noteClear: undefined,
  };
}

test('clearAllNotes takes every halo and panel off and counts them', () => {
  const d = doc(4);
  assert.equal(clearAllNotes(d), 4);
  assert.ok(d.nodes.every(x => x.removed));
  assert.equal(clearAllNotes(d), 0, 'a second clear finds nothing left');
  assert.equal(clearAllNotes(null), 0, 'no document, nothing to clear');
});

test('initNoteClear installs one capturing click listener that clears the notes', () => {
  const d = doc(2);
  assert.equal(initNoteClear(d), true);
  assert.equal(initNoteClear(d), false, 'installed once, not on every boot call');
  assert.equal(d.listeners.length, 1);
  const {ev, fn, cap} = d.listeners[0];
  assert.equal(ev, 'click');
  assert.equal(cap, true, 'capture, so the clear runs before the button handler mounts the next note');
  fn();
  assert.ok(d.nodes.every(x => x.removed));
});

test('a card opening takes the notes off first', () => {
  assert.match(card, /import \{clearAllNotes\} from '\.\.\/ui\/firstNotes\.js';/);
  assert.match(card, /export function openCard\(b,opts=\{\}\)\{\s*clearAllNotes\(\);/);
});

test('the click listener is installed at boot, once', () => {
  assert.match(main, /import \{initNoteClear\} from '\.\/ui\/firstNotes\.js';/);
  assert.match(main, /\ninitNoteClear\(\);\n/);
});
