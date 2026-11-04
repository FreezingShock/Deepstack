import test from 'node:test';
import assert from 'node:assert/strict';
import { createScribe, GAPS, MAX_VOICES } from '../src/sound/scribe.js';

function fakeBus(on = true) {
  const log = { sources: 0, oscs: 0, outs: 0, sends: [] };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, start() {}, stop() {}, frequency: param(), gain: param(), Q: param() });
  const ctx = { currentTime: 0,
    createBufferSource() { log.sources++; return node(); },
    createOscillator() { log.oscs++; return node(); },
    createBiquadFilter: node, createGain: node };
  const state = { on, ctx };
  return { log, state, bus: { ctx: () => state.ctx, on: () => state.on, out: (n, s) => { log.outs++; log.sends.push(s); }, noiseBuf: () => ({}) } };
}
let clock = 0; const now = () => clock;

test('each sound routes through the bus output', () => {
  for (const k of ['quill', 'paper', 'seal', 'land']) {
    const { bus, log } = fakeBus(); clock = 1e6 * (1 + Object.keys(GAPS).indexOf(k));
    createScribe(bus, now)[k]();
    assert.ok(log.outs > 0, k);
  }
});
test('silent when sound is off or no context', () => {
  const f = fakeBus(false); const s = createScribe(f.bus, now);
  clock += 1e4; ['quill', 'paper', 'seal', 'land'].forEach(k => s[k]());
  assert.equal(f.log.outs, 0);
  f.state.on = true; f.state.ctx = null; assert.doesNotThrow(() => s.quill());
  assert.equal(f.log.outs, 0);
});
test('rate limited: rapid triggers collapse', () => {
  const f = fakeBus(); const s = createScribe(f.bus, now); clock += 1e4;
  s.quill(); const n = f.log.outs; s.quill(); s.quill();
  assert.equal(f.log.outs, n);
  clock += GAPS.quill + 1; s.quill(); assert.ok(f.log.outs > n);
  clock += 1e4; s.seal(); const m = f.log.outs; clock += GAPS.seal - 1; s.seal();
  assert.equal(f.log.outs, m);
});
test('voice cap holds when nothing ends', () => {
  const f = fakeBus(); const s = createScribe(f.bus, now);
  for (let i = 0; i < 200; i++) { clock += 1e4; s.land(); s.paper(); }
  assert.ok(f.log.sources + f.log.oscs <= MAX_VOICES + 8);
});
