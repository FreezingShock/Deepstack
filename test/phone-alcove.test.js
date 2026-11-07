import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {alcoveFit, PHONE_ROW} from '../src/world/alcoveFit.js';

const css = readFileSync(new URL('../src/ui/hintSlips.css', import.meta.url), 'utf8');
const world = readFileSync(new URL('../src/world/world.js', import.meta.url), 'utf8');

test('a phone alcove is taller than the desktop fit at the same window (shortest shelves the fit allows)', () => {
 for (const [W, H] of [[375, 667], [360, 640], [320, 568]]) {
  const d = alcoveFit(H, 52, 14, false), p = alcoveFit(H, 52, 14, true);
  assert.ok(p.h > d.h, `${W}x${H}: phone alcove ${p.h|0}px > desktop ${d.h|0}px`);
  assert.ok(p.RH <= PHONE_ROW + 6, `${W}x${H}: rows stay short (${p.RH|0}px)`);
 }
});

test('the phone alcove keeps the window fit: frame inside the window and above the bottom margin', () => {
 for (const H of [568, 640, 667]) {
  const p = alcoveFit(H, 52, 14, true);
  assert.ok(p.top > 52 && p.bottom < H - 14, `${H}px tall: alcove ${p.top|0}..${p.bottom|0}`);
 }
});

test('the run slip keeps its full height on phones while a hint shows (no 60px or 84px squeeze)', () => {
 assert.doesNotMatch(css, /textarea\{height:60px\}/, 'the 60px phone squeeze is gone');
 assert.doesNotMatch(css, /@media\(max-width:640px\)\{\s*#stage\.center:has\(\.hintline:not\(:empty\)\) \.slip textarea\{height:84px\}/, 'the phone 84px squeeze is gone');
 assert.match(css, /@media\(max-height:860px\) and \(min-width:641px\)/, 'the desktop rule is scoped to wide windows');
});

test('world.js asks for the phone fit below 640px wide', () => {
 assert.match(world, /alcoveFit\(H,barPx\(\),BM,W<640\)/);
});
