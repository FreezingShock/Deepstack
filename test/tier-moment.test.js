import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tierMoment, playTierMoment} from '../src/ui/tierMoment.js';

const css = readFileSync('src/ui/tierMoment.css', 'utf8');
const fake = () => { const s = new Set(); return {classList: {add: c => s.add(c), has: c => s.has(c)}, s}; };

test('every low tier has its own motion, all different', () => {
  const m = [0, 1, 2].map(t => tierMoment(t).motion);
  assert.equal(new Set(m).size, 3);
  for (const x of m) assert.match(css, new RegExp(`\\.book\\.tm-${x}\\b`));
});
test('every tier gets the edge light, high tiers no extra motion', () => {
  for (let t = 0; t < 7; t++) { const b = fake(); playTierMoment(b, t, false); assert.ok(b.s.has('tm-edge')); }
  assert.equal(tierMoment(5).motion, null);
});
test('reduced motion adds nothing and css stops animations', () => {
  const b = fake(); assert.equal(playTierMoment(b, 0, true), null); assert.equal(b.s.size, 0);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
test('tokens only, every var resolves', () => {
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-fA-F]{3,8}\b/);
  const tok = readFileSync('src/theme/tokens.css', 'utf8'), local = new Set(['--tc']);
  for (const m of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(local.has(m[1]) || /^--[me]-/.test(m[1]) || tok.includes(m[1] + ':'), m[1]);
});
