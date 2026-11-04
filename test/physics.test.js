import test from 'node:test';
import assert from 'node:assert/strict';
import {footPivot, tiltAboutFoot, untilt, leanAllowance, settleBooks, lyingFootprint, clearOfSpan, placeProp, propHalf} from '../src/ui/physics.js';

const bk = (o = {}) => ({x: 0, w: 20, h: 90, tilt: 0, lean: 0, rnd: 0, lying: false, ...o});
// the lowest point of a book's corners after leaning, relative to the plank (y=0 is the plank, +y is down)
function lowestCorner(tilt, w) {
  const p = footPivot(tilt, w), c = Math.cos(tilt), s = Math.sin(tilt);
  return Math.max(...[-w / 2, w / 2].map(x => (x - p) * s + 0 * c));
}

test('a book rests on the foot corner of the side it leans toward, never sinking into the plank', () => {
  for (const t of [-.5, -.2, -.05, .05, .2, .5]) assert.ok(lowestCorner(t, 20) < 1e-9, `tilt ${t} sinks ${lowestCorner(t, 20)}px`);
  assert.equal(footPivot(.2, 20), 10);
  assert.equal(footPivot(-.2, 20), -10);
  assert.equal(footPivot(0, 20), 0);
});

test('tiltAboutFoot keeps the resting corner fixed', () => {
  const log = [];
  const ctx = {translate: (x, y) => log.push(['t', x, y]), rotate: a => log.push(['r', a])};
  tiltAboutFoot(ctx, -.3, 24);
  assert.deepEqual(log, [['t', -12, 0], ['r', -.3], ['t', 12, 0]]);
});

test('untilt inverts the lean: the pivot corner maps to itself', () => {
  for (const t of [-.3, .3]) {
    const p = footPivot(t, 20), [x, y] = untilt(p, 0, t, 20);
    assert.ok(Math.abs(x - p) < 1e-9 && Math.abs(y) < 1e-9);
  }
  // a point drawn at the top of a leaning book maps back onto the upright book
  const t = -.25, w = 20, h = 90, p = footPivot(t, w);
  const dx = 0 - p, dy = -h, k = Math.cos(t), s = Math.sin(t);
  const [bx, by] = untilt(p + dx * k - dy * s, dx * s + dy * k, t, w);
  assert.ok(Math.abs(bx) < 1e-6 && Math.abs(by + h) < 1e-6);
});

test('a book only leans where a neighbour can hold it', () => {
  const lone = [bk({x: 0, rnd: .3}), bk({x: 200})];             // big gap on its right
  assert.equal(leanAllowance(lone, 0, 1), null);
  assert.equal(leanAllowance(lone, 0, -1), null);                // nothing on its left either
  settleBooks(lone);
  assert.equal(lone[0].tilt, 0, 'an unsupported book stands upright');

  const pair = [bk({x: 0, rnd: .5}), bk({x: 32})];               // 12px gap, same height
  settleBooks(pair);
  assert.ok(pair[0].tilt > 0 && pair[0].tilt < .5, `leans no further than it touches (${pair[0].tilt})`);
  assert.ok(Math.sin(pair[0].tilt) * 90 <= 12 + 1e-6, 'its top never passes into the neighbour');
});

test('a book leans toward the neighbour it has, not into empty air', () => {
  const bs = [bk({x: 0}), bk({x: 32, rnd: .4}), bk({x: 300})];   // neighbour on the left only
  settleBooks(bs);
  assert.ok(bs[1].tilt < 0, `flipped to lean left (${bs[1].tilt})`);
});

test('a short neighbour cannot hold a tall book, a lying one cannot either', () => {
  assert.equal(leanAllowance([bk({x: 0}), bk({x: 30, h: 30})], 0, 1), null);
  assert.equal(leanAllowance([bk({x: 0}), bk({x: 30, lying: true})], 0, 1), null);
});

test('the shelf-wide inward lean is kept, and a book with no support keeps only that', () => {
  const bs = [bk({x: 0, lean: .08, rnd: -.4}), bk({x: 21, lean: .08})];
  settleBooks(bs);
  assert.ok(bs[0].tilt >= .08 - 1e-9 && bs[0].tilt < .4);
});

test('lying books lie flat and take their drawn width of shelf', () => {
  const b = bk({w: 14, h: 100, lying: true, tilt: .2});
  settleBooks([b]);
  assert.equal(b.tilt, 0);
  assert.equal(lyingFootprint(b), 70);
  assert.equal(lyingFootprint(bk({w: 20, h: 20})), 20);
});

test('props keep clear of pillars and cracks', () => {
  const W = 900;
  assert.equal(clearOfSpan(100, 10, 200, 300), 100);
  assert.equal(clearOfSpan(205, 10, 200, 300), 190, 'nearer to the left edge');
  assert.equal(clearOfSpan(295, 10, 200, 300), 310);
  for (let x = 0; x <= W; x += 3) {
    const px = placeProp(x, propHalf({k: 'skull', s: 1}), W, {x: 400, w: 80});
    for (let i = 0; i <= 3; i++) assert.ok(Math.abs(px - i * W / 3) >= 22, `x=${x} -> ${px} sits on pillar ${i}`);
    assert.ok(px + 15 <= 400 || px - 15 >= 480, `x=${x} -> ${px} straddles the crack`);
  }
});
