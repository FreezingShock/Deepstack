import test from 'node:test';
import assert from 'node:assert/strict';
import {liftGeom, liftEnvelope, latchOpen, landDip, ropeMarks, wheelAngle, ROPE_STEP} from '../src/world/lift.js';

test('the cage fits every screen and sits on the lamp', () => {
  for (const [W, H] of [[375, 667], [1280, 720], [1640, 900]]) {
    const g = liftGeom(W, H, Math.min(W - 24, 760));
    assert.ok(g.x0 >= 0 && g.x1 <= W, `cage inside ${W}`);
    assert.ok(g.wheel < g.ring && g.ring < g.top && g.top < g.bot && g.bot < H);
    assert.equal(g.cx, W / 2);
  }
});

test('envelope: cage rides the glide, latch opens after landing, cage fades with the pull', () => {
  assert.equal(liftEnvelope({phase: 'down', u: 0}).alpha, 0);
  assert.equal(liftEnvelope({phase: 'down', u: .5}).alpha, 1);
  assert.equal(liftEnvelope({phase: 'down', u: .5}).latch, 0);
  assert.equal(liftEnvelope({phase: 'settle', settle: 0}).latch, 0);
  assert.equal(liftEnvelope({phase: 'settle', settle: 1}).latch, 1);
  assert.equal(liftEnvelope({phase: 'pull', pull: 1}).alpha, 0);
  assert.equal(liftEnvelope({phase: 'hold'}).alpha, 0);
});

test('low quality draws nothing; reduced motion shows only the latch', () => {
  for (const phase of ['down', 'settle', 'pull']) assert.equal(liftEnvelope({phase, u: .5, settle: .5, pull: .2, quality: 'low'}).alpha, 0);
  assert.equal(liftEnvelope({phase: 'down', u: .5, rm: true}).alpha, 0);
  const e = liftEnvelope({phase: 'settle', settle: .9, rm: true});
  assert.ok(e.latchOnly && e.alpha > 0 && !e.full);
});

test('latch and landing spring are bounded and settle', () => {
  assert.equal(latchOpen(0), 0);
  assert.equal(latchOpen(1), 1);
  for (let s = 0; s <= 1; s += .05) assert.ok(landDip(s) > -7 && landDip(s) < 7);
  assert.ok(Math.abs(landDip(1)) < .5);
});

test('rope marks are fixed in the world, so they scroll exactly with the camera', () => {
  const a = ropeMarks(100, 0, 200), b = ropeMarks(130, 0, 200);
  assert.ok(a.length > 10);
  const world = m => m.map((y, i) => Math.round(y + (m === a ? 100 : 130)));
  assert.ok(world(a).every(w => w % ROPE_STEP === 0) && world(b).every(w => w % ROPE_STEP === 0));
  assert.equal(wheelAngle(50, 50), 0);
  assert.ok(wheelAngle(150, 50) > 0);
});
