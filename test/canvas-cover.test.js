import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameInterval,worldCovered,COVERED_MS} from '../src/ui/canvasCover.js';

const doc = (hits = [], hidden = false) => ({hidden, querySelector: s => (hits.some(h => s.startsWith(h)) ? {} : null)});

test('open world is never throttled', () => {
  assert.equal(worldCovered(doc()), false);
  assert.equal(frameInterval({covered: false, busy: false, feelActive: false}), 0);
});
test('shelf, stats, top panel, visible card and open menu book count as covered', () => {
  for (const h of ['#all', '#stats', '#topPanel', '#cardlayer.on', '.bk-spread.open']) assert.equal(worldCovered(doc([h])), true, h);
});
test('a hidden tab counts as covered', () => assert.equal(worldCovered(doc([], true)), true));
test('covered throttles to ~15 fps', () => assert.equal(frameInterval({covered: true, busy: false, feelActive: false}), COVERED_MS));
test('never throttle mid-animation or during shake/slow-mo', () => {
  assert.equal(frameInterval({covered: true, busy: true, feelActive: false}), 0);
  assert.equal(frameInterval({covered: true, busy: false, feelActive: true}), 0);
});
