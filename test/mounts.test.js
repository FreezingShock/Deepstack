import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plaqueBolts, anchorPlate} from '../src/ui/mounts.js';
import {lecternGeom, lipSupport} from '../src/ui/lectern.js';

test('every plaque bolt lies inside the plaque, at any width', () => {
  for (const w of [20, 40, 90, 200]) for (const [bx, by] of plaqueBolts(100, 50, w, 24)) {
    assert.ok(bx > 100 && bx < 100 + w && by > 50 && by < 74);
  }
});
test('a lantern plate is centred on its anchor and holds the bolt', () => {
  const p = anchorPlate(80, 30);
  const [bx, by] = p.bolts[0];
  assert.ok(bx >= p.x && bx <= p.x + p.w && by >= p.y && by <= p.y + p.h);
});
test('the held book rests fully on the lectern lip at every pull and scale', () => {
  for (const s of [1, 1.8, 2.3]) for (const rise of [0, .5, 1]) {
    const g = lecternGeom(400, 300, 36, 70, s, rise);
    assert.ok(lipSupport(g, 400, 36, s) > 0.9999);
    assert.ok(g.lip.y + g.lip.h > g.lip.y && g.column.y >= g.lip.y, 'column hangs from the lip');
    assert.ok(g.foot.y >= g.column.y + g.column.h - 1e-6, 'foot under column');
    assert.ok(g.column.x >= g.lip.x && g.column.x + g.column.w <= g.lip.x + g.lip.w);
  }
});
