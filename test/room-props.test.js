import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {PROP_KIND, drawRoomProp} from '../src/ui/roomProps.js';

// A canvas context that counts drawing calls, so a test can tell what was painted without a browser.
function fakeCanvas() {
  const calls = [];
  const c = new Proxy({}, {get(t, k) {
    if (k in t) return t[k];
    return (...a) => { calls.push(k); return undefined; };
  }, set(t, k, v) { t[k] = v; return true; }});
  c.createRadialGradient = () => ({addColorStop() {}});
  return {c, calls};
}

test('every topic room stands its own prop, all different; the Reading Room stands none', () => {
  const topics = ROOMS.map(r => r.id).filter(id => id !== HALL);
  for (const id of topics) assert.ok(PROP_KIND[id], 'no prop for ' + id);
  assert.equal(PROP_KIND[HALL], undefined);
  assert.equal(new Set(Object.values(PROP_KIND)).size, topics.length);
});

test('drawing paints the room prop, and paints nothing for the Reading Room', () => {
  for (const id of Object.keys(PROP_KIND)) {
    const {c, calls} = fakeCanvas();
    assert.equal(drawRoomProp(c, id, 100, 200, 34), true, id);
    assert.ok(calls.length >= 3, id + ' drew ' + calls.length + ' calls');
    assert.ok(calls.includes('arc') || calls.includes('fillRect') || calls.includes('ellipse'), id + ' draws shapes');
  }
  const {c, calls} = fakeCanvas();
  assert.equal(drawRoomProp(c, HALL, 100, 200, 34), false);
  assert.equal(calls.length, 0);
});

test('the prop is static: the same calls every time it is drawn', () => {
  for (const id of Object.keys(PROP_KIND)) {
    const a = fakeCanvas(), b = fakeCanvas();
    drawRoomProp(a.c, id, 10, 40, 30); drawRoomProp(b.c, id, 10, 40, 30);
    assert.deepEqual(a.calls, b.calls, id);
  }
});
