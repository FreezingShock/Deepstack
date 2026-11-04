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
