import {test} from 'node:test';
import assert from 'node:assert';
import {MOODS, MAX_OUT, MAX_VOICES, VOICE_PEAK, thin, moodAt, createScore} from '../src/sound/score.js';
import {FLOORS, floorStartFt} from '../src/core/floors.js';

function fakeCtx() {
  const c = {created: 0, oscs: 0, outTargets: [], time: 0};
  const param = () => ({value: 0, setTargetAtTime(v) { c.outTargets.push(v); }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}});
  const node = () => { c.created++; return {gain: param(), frequency: param(), detune: param(), Q: param(), connect() {}, start() {}, stop() {}, onended: null}; };
  return {c, get currentTime() { return c.time; }, createGain: node, createBiquadFilter: node, createOscillator() { c.oscs++; return node(); }};
}
const bus = (x, on = () => true) => ({ctx: () => x, on, dest: () => ({connect() {}}), send: () => ({})});
const mk = (x, o = {}) => createScore(bus(x, o.on), {hidden: () => false, rand: () => .1, ...o});

test('every floor has its own mood and the whole table is covered', () => {
  for (const f of FLOORS) assert.ok(MOODS[f.key], f.key);
  const roots = new Set(Object.values(MOODS).map(m => m.root + m.scale.join()));
  assert.equal(roots.size, FLOORS.length);
  assert.equal(moodAt(floorStartFt(FLOORS[3]) + 5), MOODS.vault);
});

test('deeper floors are slower, darker and sparser', () => {
  assert.ok(MOODS.abyss.slot > MOODS.stacks.slot && MOODS.abyss.bright < MOODS.stacks.bright && MOODS.abyss.play < MOODS.stacks.play);
});

test('the candle thins the score monotonically but never to zero', () => {
  let prev = 2; for (let fr = 1; fr >= 0; fr -= .1) { const t = thin(fr); assert.ok(t <= prev && t > 0); prev = t; }
  assert.ok(thin(1) === 1 && thin(0) < .2);
});

test('never louder than the room tone: output ceiling and summed voice peaks', () => {
  assert.ok(MAX_OUT <= .06 && MAX_VOICES * VOICE_PEAK <= 1);
  const x = fakeCtx(), s = mk(x); s.enable(true); s.setDepth(600); s.swell(6);
  assert.ok(s.maxPeak() <= VOICE_PEAK);
  assert.ok(x.c.outTargets.every(v => v <= MAX_OUT));
});

test('silent and unbuilt when sound is off, or when saver/low quality disallows it', () => {
  const x = fakeCtx(), s = mk(x, {on: () => false}); s.enable(true); assert.equal(x.c.created, 0);
  const y = fakeCtx(), t = mk(y, {allowed: () => false}); t.enable(true); t.swell(5); assert.equal(y.c.created, 0); assert.equal(t.voices(), 0);
});

test('swell only for Folio (3) or better, and the voice count is capped', () => {
  const x = fakeCtx(), s = mk(x); s.enable(true);
  assert.equal(s.swell(2), false); assert.equal(s.swell(3), true);
  for (let i = 0; i < 20; i++) s.swell(6);
  assert.ok(s.voices() <= MAX_VOICES);
});

test('turning off fades the bed (setTargetAtTime to 0), no hard cut', () => {
  const x = fakeCtx(), s = mk(x); s.enable(true); s.enable(false);
  assert.equal(x.c.outTargets.at(-1), 0);
});

test('duck lowers the output under a sting', () => {
  const x = fakeCtx(), s = mk(x); s.enable(true); s.duck(2);
  assert.ok(x.c.outTargets.at(-1) < MAX_OUT);
});
