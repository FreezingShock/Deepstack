import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile, summarize} from '../src/ui/perfStats.js';

test('percentile picks nearest rank', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(a, .5), 5);
  assert.equal(percentile(a, .95), 10);
  assert.equal(percentile([], .5), 0);
});

test('summarize counts dropped frames and fps', () => {
  const s = summarize([16.7, 16.7, 16.7, 50, 16.7], [2, 3, 4]);
  assert.equal(s.frames, 5);
  assert.equal(s.dropped, 1);
  assert.equal(s.max, 50);
  assert.ok(s.fps > 20 && s.fps < 60);
  assert.equal(s.workAvg, 3);
});

test('summarize tolerates empty and bad input', () => {
  const s = summarize([NaN], []);
  assert.equal(s.frames, 0);
  assert.equal(s.fps, 0);
});

test('perf.js is inert without ?perf', async () => {
  globalThis.location = {search: ''};
  const raf = () => {};
  globalThis.window = {requestAnimationFrame: raf};
  const m = await import('../src/ui/perf.js');
  assert.equal(m.perfOn, false);
  assert.equal(window.requestAnimationFrame, raf);
  delete globalThis.window; delete globalThis.location;
});
