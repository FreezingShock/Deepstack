import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planWide, planFlow, deriveHearth, fireIntensity, WIDE_MIN} from '../src/ui/hearth.js';

const inside = (a, b) => a.x >= b.x - 1e-6 && a.y >= b.y - 1e-6 && a.x + a.w <= b.x + b.w + 1e-6;

test('wide rooms: the fire stands between the stacks, inside the niche, on its floor', () => {
  for (const [W, H] of [[760, 536], [760, 720], [760, 460]]) {
    const p = planWide({W, H, taglineBottom: 130, descendTop: 240, tagBottom: 330});
    const {SR} = p, gap = (W - 28 - SR.w) / 2;
    assert.ok(p.shelfW <= gap, `stacks (${p.shelfW}) fit beside the fire (${gap})`);
    assert.ok(SR.x > 0 && SR.x + SR.w < W);
    assert.equal(Math.round(SR.y + SR.h), H - 2, 'surround reaches the niche floor');
    assert.ok(p.mantel.y >= 330 - p.lift + 50 - 1, 'streak candles stand clear of the Daily caption');
    assert.ok(p.lift >= 0 && p.lift <= 80);
  }
});

test('narrow rooms: no fireplace when there is no room, otherwise centred under the mantel beam', () => {
  assert.equal(planFlow({W: 351, beam: {x: 20, y: 200, w: 300, h: 9}, h: 40}), null);
  assert.ok(planFlow({W: 351, beam: {x: 20, y: 200, w: 300, h: 9}, h: 60}), 'short phones still get a small fireplace');
  assert.equal(planFlow({W: 351, beam: null, h: 140}), null);
  const p = planFlow({W: 351, beam: {x: 20, y: 200, w: 300, h: 9}, h: 140});
  assert.ok(Math.abs(p.SR.x + p.SR.w / 2 - 351 / 2) < 1e-6);
  assert.ok(p.SR.w <= 351 * .66 + 1e-6);
  assert.ok(p.SR.y >= 200);
});

test('opening, fire and hearth sit inside the surround', () => {
  const SR = {x: 240, y: 300, w: 274, h: 230};
  const {OP, FIRE, HEARTH, LIGHT} = deriveHearth(SR);
  assert.ok(inside(OP, SR));
  assert.ok(OP.y - OP.arch > SR.y, 'arch stays below the mantel');
  assert.ok(FIRE.cx - FIRE.w / 2 > OP.x && FIRE.cx + FIRE.w / 2 < OP.x + OP.w);
  assert.ok(FIRE.base < OP.b && LIGHT.y < FIRE.base);
  assert.ok(Math.abs(HEARTH.y + HEARTH.h - (SR.y + SR.h) - 3) < 1e-6);
});

test('fire intensity: gentle flicker at rest, flares when stoked, warmer on hover', () => {
  for (let t = 0; t < 30; t += .37) { const i = fireIntensity(t); assert.ok(i > .85 && i < 1.15, String(i)); }
  assert.ok(fireIntensity(3, 0, 1) > fireIntensity(3) + .6);
  assert.ok(fireIntensity(3, 1) > fireIntensity(3));
});

test('wide layout threshold matches the mantel CSS breakpoint', () => {
  const css = readFileSync('src/ui/mantel.css', 'utf8');
  assert.match(css, new RegExp(`@media\\(min-width:${WIDE_MIN}px\\)`));
});

test('the room stays lit behind an open book (no black veil) and its light only shows on home', () => {
  const css = readFileSync('src/ui/hearth.css', 'utf8');
  assert.doesNotMatch(css, /book-opening>\.hearth\{opacity:0/);
  const fx = readFileSync('src/ui/bookOpenFx.css', 'utf8');
  assert.doesNotMatch(fx, /\.book-opening::after/);
  assert.match(fx, /\.book-opening \.hbook:not\(\.opening\)\{opacity:0/);
  assert.match(css, /\.hearth-light\{[^}]*opacity:0/);
  assert.match(css, /html\.hearth-lit \.hearth-light\{opacity:1\}/);
  const js = readFileSync('src/ui/hearth.js', 'utf8');
  assert.match(js, /attic-away/);
  assert.match(js, /reducedMotion\(\)/);
  assert.match(js, /Quality\.params\(\)/);
});
