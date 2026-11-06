import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createIdleDirector, IDLE_MS, GAP_MIN, GAP_MAX} from '../src/ui/idleRoom.js';

function rig(extra = {}) {
  let t = 0, q = [], id = 0, log = [], seq = 0;
  const events = ['a', 'b', 'c'].map(n => ({id: n, run: () => log.push('run:' + n), stop: () => log.push('stop:' + n)}));
  const d = createIdleDirector({events, now: () => t, rand: () => ((seq++ * 0.37) % 1),
    setTimer: (fn, ms) => { q.push({fn, at: t + ms, id: ++id}); return id; },
    clearTimer: h => { q = q.filter(x => x.id !== h); }, ...extra});
  const advance = ms => { const end = t + ms; for (;;) { q.sort((x, y) => x.at - y.at); const n = q[0]; if (!n || n.at > end) break; q.shift(); t = n.at; n.fn(); } t = end; };
  return {d, log, advance, pending: () => q.length};
}

test('nothing happens before the idle time, then events start', () => {
  const r = rig(); r.d.start();
  r.advance(IDLE_MS - 100); assert.equal(r.log.length, 0);
  r.advance(200); assert.equal(r.log.filter(x => x.startsWith('run')).length, 1);
  assert.ok(r.d.active);
});

test('events follow at 6 to 15 s spacing and never repeat back to back', () => {
  const r = rig(); r.d.start(); r.advance(IDLE_MS + 200000);
  const runs = r.log.filter(x => x.startsWith('run'));
  assert.ok(runs.length >= 200000 / GAP_MAX - 1 && runs.length <= 200000 / GAP_MIN + 2);
  for (let i = 1; i < runs.length; i++) assert.notEqual(runs[i], runs[i - 1]);
});

test('any input stops the show, clears events and restarts the idle wait', () => {
  const r = rig(); r.d.start(); r.advance(IDLE_MS + 100);
  r.d.input();
  assert.ok(!r.d.active); assert.ok(r.log.includes('stop:a'));
  const n = r.log.filter(x => x.startsWith('run')).length;
  r.advance(IDLE_MS - 500); assert.equal(r.log.filter(x => x.startsWith('run')).length, n);
  r.advance(1000); assert.equal(r.log.filter(x => x.startsWith('run')).length, n + 1);
});

test('input while quiet only pushes the start back, with no extra timers', () => {
  const r = rig(); r.d.start();
  r.advance(30000); r.d.input(); r.advance(30000); assert.equal(r.log.length, 0);
  assert.ok(r.pending() <= 1);
});

test('when the room is not ok (reduced motion, low quality, hidden) nothing runs and no polling storm', () => {
  let ok = false; const r = rig({ok: () => ok}); r.d.start();
  r.advance(IDLE_MS * 3); assert.equal(r.log.length, 0);
  ok = true; r.advance(IDLE_MS); assert.ok(r.log.some(x => x.startsWith('run')));
});

test('destroy stops everything', () => {
  const r = rig(); r.d.start(); r.advance(IDLE_MS + 100); r.d.destroy();
  assert.equal(r.pending(), 0);
});

test('wiring: reduced motion and low quality gate the room; the css never takes the pointer', () => {
  const js = readFileSync(new URL('../src/ui/idleRoom.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/ui/idleRoom.css', import.meta.url), 'utf8');
  assert.match(js, /reducedMotion\(\)/); assert.match(js, /Quality\.params\(\)\.ambient/);
  assert.equal((css.match(/pointer-events:none/g) || []).length, 2);
  assert.match(css, /prefers-reduced-motion/);
});

test('events that cannot happen right now (no candles, no bell) are skipped', () => {
  const log = [];
  const events = [{id: 'a', can: () => false, run: () => log.push('a')}, {id: 'b', run: () => log.push('b')}];
  let t = 0, q = [], id = 0;
  const d = createIdleDirector({events, now: () => t, rand: () => .1, setTimer: (fn, ms) => { q.push({fn, at: t + ms, id: ++id}); return id; }, clearTimer: () => {}});
  d.start(); q.sort((x, y) => x.at - y.at); t = q[0].at; q.shift().fn();
  assert.deepEqual(log, ['b']);
});
