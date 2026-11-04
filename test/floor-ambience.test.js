import {test} from 'node:test';
import assert from 'node:assert';
import {FLOORS, floorStartFt} from '../src/core/floors.js';
import {LAYERS, MIX, BLEND_FT, MAX_NODES, MAX_DRIPS, weightsAt, createAmbience} from '../src/sound/ambience.js';

function fakeCtx() {
  const calls = {sets: [], created: 0};
  const param = () => ({value: 0, setTargetAtTime(v) { calls.sets.push(v); }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}});
  const node = () => { calls.created++; return {gain: param(), frequency: param(), Q: param(), connect() {}, start() {}, stop() {}, onended: null}; };
  return {calls, currentTime: 0, sampleRate: 8000, createBufferSource: node, createBiquadFilter: node, createGain: node, createOscillator: node, createBuffer: () => ({})};
}
const mkBus = (ctx, on = () => true) => ({ctx: () => ctx, on, dest: () => ({connect() {}}), send: () => ({}), noiseBuf: () => ({})});

test('each floor has its own dominant layer', () => {
  const want = ['paper', 'paper', 'stone', 'water', 'wind', 'drone'];
  FLOORS.forEach((f, i) => {
    const w = weightsAt(floorStartFt(f) + BLEND_FT);
    const top = LAYERS.reduce((a, b) => (w[b] > w[a] ? b : a));
    assert.equal(top, want[i], f.key);
  });
  assert.equal(MIX.length, FLOORS.length);
});

test('layers crossfade smoothly across a floor boundary', () => {
  const b = floorStartFt(FLOORS[3]); let prev = weightsAt(b - BLEND_FT);
  for (let ft = b - BLEND_FT; ft <= b + BLEND_FT; ft += 2) {
    const w = weightsAt(ft); for (const l of LAYERS) assert.ok(Math.abs(w[l] - prev[l]) < .15, l + ' jumps at ' + ft); prev = w;
  }
  assert.ok(weightsAt(b - 40).water < .01 && weightsAt(b + 40).water > .99);
});

test('silent when sound is off: nothing built, no nodes', () => {
  const ctx = fakeCtx(), a = createAmbience(mkBus(ctx, () => false), () => false);
  a.enable(true); a.setDepth(600);
  assert.equal(ctx.calls.created, 0); assert.equal(a.nodeCount(), 0);
});

test('node count is fixed and capped however far you travel or toggle', () => {
  const ctx = fakeCtx(), a = createAmbience(mkBus(ctx), () => true);
  a.enable(true); const n = a.nodeCount(); assert.ok(n > 0 && n <= MAX_NODES, 'nodes ' + n);
  for (let ft = 0; ft < 1400; ft += 7) a.setDepth(ft);
  a.enable(false); a.enable(true); a.enable(false);
  assert.equal(a.nodeCount(), n);
});

test('start and stop ramp gains with setTargetAtTime (no hard cut)', () => {
  const ctx = fakeCtx(), a = createAmbience(mkBus(ctx), () => true);
  a.enable(true); a.enable(false);
  assert.ok(ctx.calls.sets.length > 0 && ctx.calls.sets.every(v => v >= 0 && v <= 1));
  assert.equal(MAX_DRIPS <= 6, true);
});
