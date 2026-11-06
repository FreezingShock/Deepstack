import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fireOf, tintLamp, candleStops, candleKey, cageFire} from '../src/ui/roomRun.js';
import {GLOW_STOPS} from '../src/ui/candleLight.js';
import {ROOMS} from '../src/core/rooms.js';

test('the Reading Room (and no room) leaves the run untouched', () => {
  assert.equal(fireOf('hall'), null);
  assert.equal(fireOf(''), null);
  assert.equal(fireOf('nope'), null);
  const lamp = [255, 190, 100];
  assert.equal(tintLamp(lamp, null), lamp);
  assert.equal(candleStops(GLOW_STOPS, null), GLOW_STOPS);
  assert.equal(candleKey(null), 'candle-light');
  let drew = 0; cageFire({createLinearGradient() { drew++; }, fillRect() { drew++; }}, 0, 0, 10, 10, null);
  assert.equal(drew, 0);
});

test('every topic room gets its own fire on lamp, candle and cage', () => {
  const keys = new Set();
  for (const r of ROOMS.filter(x => x.id !== 'hall')) {
    const f = fireOf(r.id); assert.deepEqual(f, r.rgb);
    const lamp = tintLamp([255, 190, 100], f);
    // the lamp ends up closer to the room's fire than to the default amber
    const d = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
    assert.ok(d(lamp, f) < d([255, 190, 100], f), r.id);
    const st = candleStops(GLOW_STOPS, f); assert.equal(st.length, GLOW_STOPS.length);
    assert.ok(st[1][1].includes(`${f[0]},${f[1]},${f[2]}`));
    keys.add(candleKey(f));
    const calls = []; cageFire({createLinearGradient: () => ({addColorStop: (...a) => calls.push(a)}), fillRect: () => calls.push('rect'), set fillStyle(v) {}}, 0, 0, 10, 10, f);
    assert.ok(calls.includes('rect'));
  }
  assert.equal(keys.size, ROOMS.length - 1);
});
