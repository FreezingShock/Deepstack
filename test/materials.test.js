import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaterials, CUES, MAX_VOICES } from '../src/sound/materials.js';

function fakeBus(on = true) {
  const log = { outs: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, start() {}, stop() {}, frequency: param(), gain: param(), Q: param() });
  const ctx = { currentTime: 0, createBufferSource: node, createOscillator: node, createBiquadFilter: node, createGain: node };
  const state = { on, ctx };
  return { log, state, bus: { ctx: () => state.ctx, on: () => state.on, out: () => { log.outs++; }, noiseBuf: () => ({}) } };
}
let clock = 0; const now = () => clock;

test('every cue in the palette plays through the bus', () => {
  for (const k of Object.keys(CUES)) {
    const f = fakeBus(); clock += 1e5;
    assert.ok(createMaterials(f.bus, { now }).play(k), k);
    assert.ok(f.log.outs > 0, k);
  }
});
test('silent when sound is off, no context, or an unknown cue', () => {
  const f = fakeBus(false); const m = createMaterials(f.bus, { now }); clock += 1e5;
  for (const k of Object.keys(CUES)) assert.equal(m.play(k), false);
  f.state.on = true; f.state.ctx = null; assert.equal(m.play('tick'), false);
  f.state.ctx = {}; assert.equal(m.play('nope'), false);
  assert.equal(f.log.outs, 0);
});
test('rate limited per cue', () => {
  const f = fakeBus(); const m = createMaterials(f.bus, { now }); clock += 1e5;
  assert.ok(m.play('rung')); assert.equal(m.play('rung'), false);
  clock += CUES.rung.gap + 1; assert.ok(m.play('rung'));
});
test('optional layers drop at low quality, essential ones stay', () => {
  const f = fakeBus(); const m = createMaterials(f.bus, { now, fine: () => false }); clock += 1e5;
  assert.equal(m.play('crackle'), false); assert.equal(m.play('hover'), false);
  assert.ok(m.play('shut')); assert.ok(m.play('hatch'));
});
test('voice cap holds when nothing ends', () => {
  const f = fakeBus(); const m = createMaterials(f.bus, { now }); let ok = 0;
  for (let i = 0; i < 200; i++) { clock += 1e3; if (m.play('hatch')) ok++; }
  assert.ok(ok < 200 && f.log.outs > 0 && ok <= MAX_VOICES);
});
