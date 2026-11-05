import test from 'node:test';
import assert from 'node:assert/strict';
import {flameState} from '../src/ui/candle.js';

const L = 45000;
test('a full candle has a full, calm flame', () => {
  const f = flameState(L, L);
  assert.equal(f.lit, true); assert.equal(f.scale, 1); assert.equal(f.period, 0.16);
});
test('half the time left: shorter flame, same calm flicker', () => {
  const f = flameState(L / 2, L);
  assert.ok(f.scale < 1 && f.scale > 0.8); assert.equal(f.period, 0.16);
});
test('the last 10 seconds flicker faster and keep getting faster', () => {
  const a = flameState(9000, L), b = flameState(3000, L);
  assert.ok(a.period < 0.16 && b.period < a.period);
  assert.ok(flameState(10500, L).period === 0.16);
});
test('the flame gutters low then goes out at zero', () => {
  assert.ok(flameState(500, L).scale < flameState(5000, L).scale / 2);
  const z = flameState(0, L);
  assert.equal(z.lit, false); assert.equal(z.scale, 0);
  assert.equal(flameState(-50, L).lit, false);
});
test('flame height never grows as time runs down', () => {
  let prev = 2;
  for (let t = L; t >= 0; t -= 250) { const s = flameState(t, L).scale; assert.ok(s <= prev + 1e-9); prev = s; }
});

import {waxHeight, gaugeMarks, milestoneCrossed, secondsText, WAX_MIN, WAX_SPAN} from '../src/ui/candle.js';
test('the wax is a ruler: tall at the start, short and never negative at the end', () => {
  assert.equal(waxHeight(L, L), WAX_MIN + WAX_SPAN);
  assert.equal(waxHeight(0, L), WAX_MIN);
  assert.ok(waxHeight(30000, L) > waxHeight(20000, L));
});
test('rings sit every 10 s and the 10 s ring is the last-stretch mark', () => {
  const m = gaugeMarks(L);
  assert.deepEqual(m.map(x => x.s), [10, 20, 30, 40]);
  assert.deepEqual(m.filter(x => x.last).map(x => x.s), [10]);
  assert.ok(m[0].y < m[3].y);
});
test('spoken milestones fire once as time crosses them', () => {
  assert.equal(milestoneCrossed(10100, 9900), 10);
  assert.equal(milestoneCrossed(9900, 9800), 0);
  assert.equal(milestoneCrossed(30100, 29900), 30);
  assert.equal(milestoneCrossed(1100, 0), 0);
});
test('screen-reader text is plain words', () => {
  assert.equal(secondsText(43100), '44 seconds left');
  assert.equal(secondsText(400), '1 second left');
});
