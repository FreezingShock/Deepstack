import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/ui/bookStyle.css', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../src/ui/home.css', import.meta.url), 'utf8');
const top = fs.readFileSync(new URL('../src/ui/topbar.js', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('shared book tokens exist and book spreads use the shared page', () => {
  for (const t of ['--bs-ink', '--bs-page', '--bs-rule', '--bs-ribbon']) assert.ok(css.includes(t + ':'), t);
  assert.match(home, /\.bs-page\{background:var\(--bs-page\)/);
});
test('Settings and Credits panels wear the book box, and the stylesheet is loaded', () => {
  assert.match(top, /class="tpbox bookbox"/);
  assert.match(main, /import '\.\/ui\/bookStyle\.css'/);
});
test('book box uses no raw hex colours', () => {
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/);
});
