// Markup rules the accessibility audit (scripts/a11y.mjs) depends on, checked without a browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ringHTML} from '../src/ui/roomHome.js';
import {ROOMS} from '../src/core/rooms.js';

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
