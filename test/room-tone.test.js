import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {ACCENTS, GAP, MAX_VOICES, MAX_GAINS, createRoomTone} from '../src/sound/roomTone.js';

// A fake AudioContext that counts every node it makes and records each gain's targets.
function fakeCtx() {
  const ctx = {currentTime: 0, made: 0, gains: [], oscs: 0, srcs: 0};
  const param = (rec) => ({value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
    setTargetAtTime(v) { if (rec) rec.push(v); }});
  const base = () => { ctx.made++; return {connect() {}, start() {}, stop() {}, onended: null, Q: param(), frequency: param(), type: '', buffer: null}; };
  ctx.createGain = () => { const n = base(); n.gain = param(n.targets = []); ctx.gains.push(n); return n; };
  ctx.createOscillator = () => { ctx.oscs++; return base(); };
  ctx.createBufferSource = () => { ctx.srcs++; return base(); };
  ctx.createBiquadFilter = () => base();
  return ctx;
}
const lastTarget = g => g.targets[g.targets.length - 1];
function harness({on = true, hiddenTab = false} = {}) {
  const ctx = fakeCtx(), timers = [], cancelled = [];
  const bus = {ctx: () => ctx, on: () => on, dest: () => ({connect() {}}), noiseBuf: () => ({})};
  const tone = createRoomTone(bus, {
    later: (fn, ms) => { timers.push({fn, ms}); return timers.length; },
    cancel: id => cancelled.push(id),
    hidden: () => hiddenTab,
    rand: (a, b) => (a + b) / 2, // deterministic gaps
  });
  const runTimers = n => { for (let i = 0; i < n && timers.length; i++) { const t = timers.shift(); t.fn(); } };
  return {ctx, tone, timers, cancelled, runTimers};
}

test('every topic room has one accent of its own; the Reading Room stays silent', () => {
  const topics = ROOMS.map(r => r.id).filter(id => id !== HALL);
  for (const id of topics) assert.ok(ACCENTS[id], 'no accent for ' + id);
  assert.equal(ACCENTS[HALL], undefined);
  assert.equal(new Set(Object.values(ACCENTS)).size, topics.length, 'accents are not all different');
  for (const kind of Object.values(ACCENTS)) assert.ok(GAP[kind], 'no gap for ' + kind);
});

test('accents are sparse: never closer than five seconds', () => {
  for (const [min, max] of Object.values(GAP)) { assert.ok(min >= 5, 'min gap ' + min); assert.ok(max >= min); }
});

test('silent with sound off: nothing built, no timers', () => {
  const h = harness({on: false});
  h.tone.enable(true); h.tone.setRoom('history'); h.tone.setRoom('body');
  assert.equal(h.ctx.made, 0); assert.equal(h.timers.length, 0);
});

test('the Reading Room starts no accent timer at all', () => {
  const h = harness();
  h.tone.enable(true);
  assert.equal(h.timers.length, 0);
  assert.equal(h.ctx.made, 1, 'only its own silent gain');
});

test('a walk crossfades: the old room glides out and the new room glides in in the same step', () => {
  const h = harness();
  h.tone.enable(true); // gains[0] is the Reading Room, silent
  h.tone.setRoom('math');   // gains[1]: up as math starts; the Reading Room glides out
  h.tone.setRoom('history'); // gains[2]: up; math glides out
  const [hall, math, hist] = h.ctx.gains;
  assert.deepEqual(hall.targets, [0, 0]);
  assert.deepEqual(math.targets, [1, 0]);
  assert.deepEqual(hist.targets, [1]);
  assert.equal(h.tone.room(), 'history');
});

test('walking back to the Reading Room fades the topic room out and leaves no accent timer running', () => {
  const h = harness();
  h.tone.enable(true); h.tone.setRoom('science'); h.tone.setRoom(HALL);
  const [, sci] = h.ctx.gains;
  assert.deepEqual(sci.targets, [1, 0]);
  assert.ok(h.cancelled.length >= 1, 'the science timer was not cancelled');
  const made = h.ctx.made;
  h.runTimers(10);
  assert.equal(h.ctx.made, made, 'a timer made voices in the Reading Room');
});

test('gains are built once per room, however often you walk', () => {
  const h = harness();
  h.tone.enable(true);
  const ids = ROOMS.map(r => r.id);
  for (let i = 0; i < 80; i++) h.tone.setRoom(ids[(i * 3) % ids.length]);
  assert.ok(h.tone.gainCount() <= MAX_GAINS, 'gains ' + h.tone.gainCount());
  assert.equal(h.ctx.gains.length, h.tone.gainCount());
});

test('each accent plays only in its own room and stops adding voices at the cap', () => {
  const h = harness();
  h.tone.enable(true); h.tone.setRoom('body');
  assert.ok(h.timers.length >= 1);
  assert.equal(h.timers[0].ms, 11000, 'heartbeat gap');
  h.runTimers(400); // voices never end here (no onended), so the cap is what stops them
  const made = h.ctx.made;
  assert.ok(h.tone.voiceCount() <= MAX_VOICES + 2, 'voices ' + h.tone.voiceCount());
  h.runTimers(50);
  assert.equal(h.ctx.made, made, 'kept adding voices past the cap');
});

test('a hidden tab plays nothing but keeps its timer for when it returns', () => {
  const h = harness({hiddenTab: true});
  h.tone.enable(true); h.tone.setRoom('art');
  const before = h.ctx.made;
  h.runTimers(5);
  assert.equal(h.ctx.made, before);
  assert.ok(h.timers.length > 0);
});

test('turning sound off cancels the accent timer and fades every room out', () => {
  const h = harness();
  h.tone.enable(true); h.tone.setRoom('english');
  h.tone.enable(false);
  assert.ok(h.cancelled.length > 0, 'timer not cancelled');
  const [, eng] = h.ctx.gains;
  assert.deepEqual(eng.targets, [1, 0]);
});
