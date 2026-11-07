import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('hints are ribbon tags, not ruled paper', () => {
 const css = read('../src/ui/hintTags.css');
 assert.doesNotMatch(css, /repeating-linear-gradient/, 'no ruled lines on the strip');
 assert.match(css, /\.hintline:not\(:empty\)\{[^}]*background:none/, 'the strip has no paper background');
 assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'colours come from tokens');
 assert.doesNotMatch(css, /@keyframes|animation:/, 'no new animation');
});

test('on phones only the newest hint is drawn, so the answer slip keeps its height', () => {
 const css = read('../src/ui/hintTags.css');
 assert.match(css, /@media\(max-width:640px\)\{[\s\S]*\.hslip:not\(:last-child\)\{display:none\}/);
 assert.doesNotMatch(css, /position:absolute/, 'nothing hangs below the stage, where it would be clipped');
});

test('the tag sheet is loaded after the hint slip sheet, so it wins the cascade', () => {
 const main = read('../src/main.js');
 const a = main.indexOf("import './ui/hintSlips.css';");
 const b = main.indexOf("import './ui/hintTags.css';");
 assert.ok(a >= 0 && b > a, 'hintTags.css is imported after hintSlips.css');
});

test('a tap on the phone strip opens every hint in a panel, and a tap closes it', async () => {
 const listeners = {};
 globalThis.document = {addEventListener: (t, f) => { listeners[t] = f; }};
 globalThis.innerWidth = 375;
 try {
  await import('../src/ui/hintTags.js?phone');
  const hl = {children: [1, 2], classList: {toggled: 0, toggle(c) { this.toggled++; }}};
  const hit = {closest: sel => (sel === '#hl' ? hl : null)};
  listeners.click({target: hit});
  assert.equal(hl.classList.toggled, 1, 'a tap on a two-hint strip toggles it');
  hl.children = [1];
  listeners.click({target: hit});
  assert.equal(hl.classList.toggled, 1, 'a single hint has nothing to open');
  globalThis.innerWidth = 1280;
  hl.children = [1, 2];
  listeners.click({target: hit});
  assert.equal(hl.classList.toggled, 1, 'desktop shows every hint and does not toggle');
 } finally {
  delete globalThis.document;
  delete globalThis.innerWidth;
 }
});
