import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css = readFileSync(new URL('../src/ui/shelfSpineFit.css', import.meta.url), 'utf8');
const art = readFileSync(new URL('../src/ui/bookArt.js', import.meta.url), 'utf8');
const ledge = readFileSync(new URL('../src/ui/ledge.js', import.meta.url), 'utf8');
test('plaques and tier list wrap instead of ellipsizing', () => {
  for (const sel of ['.splaque em', '.splaque span', '.cc-tiers span']) assert.ok(css.includes(sel), sel);
});
test('unfitted spines shrink until the word fits', () => assert.match(art, /while \(fs > 3 && c\.measureText/));
test('ledge books pass the fit to bookArt', () => assert.match(ledge, /fit: dm\.fit/));
test('daily date wraps on phones', () => assert.match(readFileSync(new URL('../src/ui/dailyBook.css', import.meta.url), 'utf8'), /dly-date\{[^}]*overflow-wrap:anywhere/));
