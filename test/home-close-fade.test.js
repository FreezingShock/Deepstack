import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js = readFileSync('src/ui/home.js', 'utf8');
const css = readFileSync('src/ui/bookOpenFx.css', 'utf8');

test('closing a home book starts the room fading back in as soon as the book begins to close', () => {
  assert.ok(/closed=true;onShut\(\)/.test(js), 'openBook calls onShut at the start of close');
  assert.ok(js.includes("onShut:()=>root.classList.add('book-closing')"), 'bookify marks the home as closing');
  assert.ok(js.includes("root.classList.remove('book-closing')"), 'the class is cleared when the book flies home and when it lands');
});

test('while closing, title, plaque and sibling books fade in on one curve and stay hidden while open', () => {
  assert.ok(/\.book-opening\.book-closing \.hz-title[^{]*\{opacity:1;transition:opacity var\(--m-page\) var\(--e-cruise\)\}/.test(css));
  assert.ok(/\.book-opening\.book-closing \.hbook:not\(\.opening\)\{opacity:1/.test(css));
  assert.ok(/\.book-opening \.hz-title,\.book-opening \.hz-plaque\{opacity:0\}/.test(css), 'the open state still hides the room');
});
