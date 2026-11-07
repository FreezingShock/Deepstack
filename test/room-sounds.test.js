// CI guard for the Room sounds switch (Settings) and the no-autoplay rule for room accents.
// Covers: nothing starts on load or while the switch is off, the switch and the low quality tier silence accents at once
// (no timer left behind), the first gesture gates a returning visitor's audio, the Settings toggle exists and is wired,
// and the code added for this feature stays small (gzip budget).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {ACCENTS, createRoomTone} from '../src/sound/roomTone.js';
import {onFirstGesture, GESTURE_EVENTS} from '../src/sound/gesture.js';
import {settingsPages} from '../src/ui/settingsBook.js';
import {DEFAULTS, sanitize} from '../src/ui/settings.js';

function fakeCtx() {
  const ctx = {currentTime: 0, made: 0, gains: [], oscs: 0};
  const param = (rec) => ({value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
    setTargetAtTime(v) { if (rec) rec.push(v); }});
  const base = () => { ctx.made++; return {connect() {}, start() {}, stop() {}, onended: null, Q: param(), frequency: param(), type: '', buffer: null}; };
  ctx.createGain = () => { const n = base(); n.gain = param(n.targets = []); ctx.gains.push(n); return n; };
  ctx.createOscillator = () => { ctx.oscs++; return base(); };
  ctx.createBufferSource = () => base();
  ctx.createBiquadFilter = () => base();
  return ctx;
}

// timers is the set of accent timers still pending (a cancelled one leaves the set, as a real clearTimeout does)
function harness({on = true, allow = {v: true}} = {}) {
  const ctx = fakeCtx(), timers = new Map(), cancelled = [];
  let seq = 0;
  const bus = {ctx: () => ctx, on: () => on, dest: () => ({connect() {}}), noiseBuf: () => ({})};
  const tone = createRoomTone(bus, {
    later: (fn, ms) => { const id = ++seq; timers.set(id, {fn, ms}); return id; },
    cancel: id => { cancelled.push(id); timers.delete(id); },
    hidden: () => false,
    rand: (a, b) => (a + b) / 2,
    allowed: () => allow.v,
  });
  const runTimers = n => { for (let i = 0; i < n && timers.size; i++) { const [id, t] = timers.entries().next().value; timers.delete(id); t.fn(); } };
  return {ctx, tone, timers, cancelled, runTimers, allow};
}

test('nothing is built or scheduled on load: a fresh room tone is silent until sound is on', () => {
  const h = harness({on: true});
  assert.equal(h.ctx.made, 0);
  assert.equal(h.timers.size, 0);
  h.tone.setRoom('history'); // walking about before sound is on must not start anything
  assert.equal(h.timers.size, 0);
  assert.equal(h.ctx.oscs, 0);
});

test('the Room sounds switch off keeps the accents silent even with sound on', () => {
  const h = harness({allow: {v: false}});
  h.tone.enable(true); h.tone.setRoom('science');
  h.runTimers(20);
  assert.equal(h.timers.size, 0, 'a timer was left running with the switch off');
  assert.equal(h.ctx.oscs, 0, 'a voice played with the switch off');
});

test('switching the room sounds off mid-walk fades every room out and cancels the timer', () => {
  const h = harness();
  h.tone.enable(true); h.tone.setRoom('math');
  const [, math] = h.ctx.gains;
  assert.equal(h.timers.size, 1, 'math should have its accent timer');
  h.allow.v = false; h.tone.refresh();
  assert.deepEqual(math.targets.slice(-1), [0], 'math did not glide out');
  assert.ok(h.cancelled.length >= 1, 'the accent timer was not cancelled');
  assert.equal(h.timers.size, 0);
});

test('switching them back on resumes the current room accents', () => {
  const h = harness({allow: {v: false}});
  h.tone.enable(true); h.tone.setRoom('art');
  assert.equal(h.timers.size, 0);
  h.allow.v = true; h.tone.refresh();
  assert.equal(h.timers.size, 1, 'art did not restart its accent timer');
  const art = h.ctx.gains[h.ctx.gains.length - 1];
  assert.equal(art.targets.slice(-1)[0], 1, 'art did not glide back in');
});

test('low quality (switch allowed = false) plays no accent voices across a long walk', () => {
  const h = harness({allow: {v: false}});
  h.tone.enable(true);
  for (const id of ROOMS.map(r => r.id)) h.tone.setRoom(id);
  h.runTimers(100);
  assert.equal(h.ctx.oscs, 0);
});

test('with the switch on, every topic room still gets its accent', () => {
  const h = harness();
  h.tone.enable(true);
  for (const id of Object.keys(ACCENTS)) { h.tone.setRoom(id); assert.equal(h.tone.room(), id); }
  assert.ok(h.timers.size >= 1);
});

test('gesture: the deferred start waits for the first press and runs once', () => {
  const listeners = {};
  const target = {
    addEventListener(e, fn) { (listeners[e] ||= new Set()).add(fn); },
    removeEventListener(e, fn) { listeners[e]?.delete(fn); },
  };
  let ran = 0;
  onFirstGesture(() => ran++, target);
  assert.equal(ran, 0, 'ran before any gesture');
  const fire = type => [...(listeners[type] || [])].forEach(fn => fn({type}));
  fire('pointerdown');
  fire('pointerdown'); fire('keydown');
  assert.equal(ran, 1, 'should run exactly once');
  for (const e of GESTURE_EVENTS) assert.equal((listeners[e] || new Set()).size, 0, e + ' listener left behind');
});

test('gesture: cancel stops the deferred start, and without a DOM nothing runs', () => {
  const listeners = {};
  const target = {
    addEventListener(e, fn) { (listeners[e] ||= new Set()).add(fn); },
    removeEventListener(e, fn) { listeners[e]?.delete(fn); },
  };
  let ran = 0;
  const cancel = onFirstGesture(() => ran++, target);
  cancel();
  [...(listeners.pointerdown || [])].forEach(fn => fn({}));
  assert.equal(ran, 0);
  onFirstGesture(() => ran++, {});
  onFirstGesture(() => ran++, null);
  assert.equal(ran, 0, 'a target with no listeners must never run the start');
});

test('boot never starts sound on its own: a stored Sound-on waits for a gesture', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /function applySound\(boot\)\{[^}]*if\(boot&&S\.sound\)onFirstGesture\(/, 'boot path must defer through onFirstGesture');
  assert.match(main, /applySound\(true\);/, 'boot must call applySound(true)');
  assert.doesNotMatch(main, /Sfx\.set\(S\.sound\);\s*\n\s*\}\s*\n\s*\$\('#bSound'\)/, 'an un-gated Sfx.set(S.sound) must not come back');
});

test('the room-sound switch is wired end to end: default on, sanitised, a Settings control, live refresh', () => {
  assert.equal(DEFAULTS.roomSounds, true, 'default keeps the accents the game shipped with');
  assert.equal(sanitize({roomSounds: false}).roomSounds, false);
  assert.equal(sanitize({roomSounds: 'no'}).roomSounds, true);
  const html = settingsPages({st: {...DEFAULTS, roomSounds: false}, sound: true, prefs: [], pref: 'auto'}).left;
  assert.equal([...html.matchAll(/id="sRoomSnd"/g)].length, 1);
  assert.match(html, /id="sRoomSnd"[^>]*aria-checked="false"/);
  const topbar = readFileSync(new URL('../src/ui/topbar.js', import.meta.url), 'utf8');
  assert.match(topbar, /sw\(\$\('#sRoomSnd'\),v=>\{set\(\{roomSounds:v\}\);Sfx&&Sfx\.roomAccents&&Sfx\.roomAccents\(v\);\}\)/);
  const feel = readFileSync(new URL('../src/feel.js', import.meta.url), 'utf8');
  assert.match(feel, /allowed: \(\) => roomsOn && Quality\.tier\(\) !== 'low'/);
  assert.match(feel, /roomAccents\(v\) \{ roomsOn = !!v; roomTone\.refresh\(\); \}/);
});

test('bundle budget: the room-sound code stays small (about 3.1 KB gzip today; guard at 4 KB together)', () => {
  let gz = 0, raw = 0;
  for (const f of ['../src/sound/roomTone.js', '../src/sound/gesture.js']) {
    const b = readFileSync(new URL(f, import.meta.url));
    raw += b.length; gz += gzipSync(b).length;
  }
  assert.ok(gz < 4 * 1024, `room-sound code is ${gz} bytes gzipped`);
  assert.ok(raw < 12 * 1024, `room-sound code is ${raw} bytes raw`);
});

test('the Reading Room keeps no accent, so its only node is its silent gain', () => {
  assert.equal(ACCENTS[HALL], undefined);
});
