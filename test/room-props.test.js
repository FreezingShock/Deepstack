import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {PROP_KIND, drawRoomProp, PHONE_PROP_MAX_BOOKS, PHONE_PROP_INSET, PHONE_PROP_S} from '../src/ui/roomProps.js';
import {ledgeLayout} from '../src/ui/ledge.js';

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

test('on phones the prop clears every desk book up to the cap, at the usual phone widths', () => {
  // book widths in the range shelfDims gives real books and skipped ones (20 px); the cap is in roomProps.js
  const dims = b => ({w: b.w, h: 40});
  for (const w of [320, 360, 375, 414, 500, 639]) {
    const propX = w - PHONE_PROP_INSET - PHONE_PROP_S, propR = w - PHONE_PROP_INSET;
    for (let n = 0; n <= PHONE_PROP_MAX_BOOKS; n++) {
      for (const width of [30, 60]) {
        const books = Array.from({length: n}, (_, i) => (i % 3 === 0 ? {skipped: true, w: 20} : {w: width, tier: 0}));
        const L = ledgeLayout(books, w, b => dims(b), 56);
        for (const it of L.items) assert.ok(it.dx + it.w <= propX - 2 || it.dx >= propR + 2, `w=${w} n=${n}: book ${it.i} reaches the prop`);
      }
    }
  }
});
