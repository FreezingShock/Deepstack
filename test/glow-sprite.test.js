import test from 'node:test';
import assert from 'node:assert/strict';
import {fillOutside, stampGlow} from '../src/ui/glowSprite.js';

const rec = () => { const calls = []; return {calls, globalAlpha: 1, fillStyle: '', fillRect: (...a) => calls.push(a), drawImage: (...a) => calls.push(['img', ...a.slice(1)])}; };

test('fillOutside paints exactly the margin around the glow square', () => {
  const c = rec(); fillOutside(c, 100, 80, 50, 40, 20, 'x');
  const area = c.calls.reduce((s, [, , w, h]) => s + w * h, 0);
  assert.equal(area, 100 * 80 - 40 * 40);
});

test('fillOutside paints nothing when the glow covers the canvas', () => {
  const c = rec(); fillOutside(c, 100, 80, 50, 40, 200, 'x');
  assert.equal(c.calls.length, 0);
});

test('stampGlow scales alpha and restores it', () => {
  const c = rec(); c.globalAlpha = .5;
  let seen; c.drawImage = () => { seen = c.globalAlpha; };
  stampGlow(c, {}, 10, 10, 5, .4);
  assert.equal(seen, .2); assert.equal(c.globalAlpha, .5);
});
