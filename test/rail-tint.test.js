import test from 'node:test';
import assert from 'node:assert/strict';
import {railTintFor} from '../src/ui/railTintCore.js';
import {FLOORS} from '../src/core/floors.js';

test('rail tint is the floor lamp colour as an rgb() value', () => {
  assert.equal(railTintFor(FLOORS[0]), 'rgb(255 190 110)');
  assert.equal(railTintFor(FLOORS[3]), 'rgb(120 230 230)');
});
test('every floor yields a distinct valid tint; missing floor falls back to the warm default', () => {
  const t = FLOORS.map(railTintFor);
  assert.equal(new Set(t).size, FLOORS.length);
  for (const c of t) assert.match(c, /^rgb\(\d{1,3} \d{1,3} \d{1,3}\)$/);
  assert.equal(railTintFor(null), 'rgb(255 176 77)');
});
