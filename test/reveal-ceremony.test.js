import {test} from 'node:test';
import assert from 'node:assert/strict';
import {revealCeremony, ceremonyFor} from '../src/ui/revealRecipes.js';
import {revealPlan} from '../src/ui/reveal.js';

const T = [0, 1, 2, 3, 4, 5, 6];

test('one table defines every tier, clamped at the ends', () => {
  assert.equal(revealCeremony(-3), revealCeremony(0));
  assert.equal(revealCeremony(99), revealCeremony(6));
  for (const t of T) for (const k of ['vig', 'rays', 'rune', 'flash', 'cover', 'sound', 'hold']) assert.ok(k in revealCeremony(t), `${t}.${k}`);
});
test('the ceremony only gets richer going up', () => {
  for (let t = 1; t < 7; t++) {
    const a = revealCeremony(t - 1), b = revealCeremony(t);
    assert.ok(b.vig >= a.vig && b.rays >= a.rays && b.rayA >= a.rayA && b.embers >= a.embers && b.hold >= a.hold, `tier ${t} backdrop`);
    assert.ok((b.flash?.peak || 0) >= (a.flash?.peak || 0), `tier ${t} flash`);
    assert.ok(b.cover.ms >= a.cover.ms && b.cover.delay >= a.cover.delay, `tier ${t} cover`);
    if (a.rune) assert.ok(b.rune);
    if (a.sound.sting) assert.ok(b.sound.sting);
  }
});
test('the plain tiers stay plain; the rare ones have rays, rune, flash and sting', () => {
  for (const t of [0, 1, 2]) { const c = revealCeremony(t); assert.ok(!c.rays && !c.rune && !c.flash && !c.sound.sting); }
  assert.ok(revealCeremony(3).rays && !revealCeremony(3).flash);
  assert.ok(revealCeremony(4).flash && !revealCeremony(4).rune);
  assert.ok(revealCeremony(5).rune && revealCeremony(5).sound.sting);
  assert.ok(revealCeremony(6).flash.peak > revealCeremony(5).flash.peak);
});
test('Apocrypha waits for its implosion before the cover swings and the flash lands', () => {
  const c = revealCeremony(6);
  assert.ok(c.cover.delay >= 400 && c.flash.at >= 400);
});
test('low quality drops the rune and embers and softens rays and flash', () => {
  const hi = ceremonyFor(6, {glow: true}), lo = ceremonyFor(6, {glow: false});
  assert.equal(hi, revealCeremony(6));
  assert.ok(!lo.rune && lo.embers === 0 && lo.rays < hi.rays && lo.rayA < hi.rayA && lo.flash.peak < hi.flash.peak);
  assert.equal(ceremonyFor(1, {glow: false}).rays, 0);
});
test('revealPlan carries the table through', () => {
  const p = revealPlan(5, {glow: true});
  assert.equal(p.rays, 10); assert.ok(p.rune && p.pulse && p.sound.sting);
  assert.ok(!revealPlan(5, {glow: false}).rune);
});
