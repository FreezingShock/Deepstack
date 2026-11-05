import test from 'node:test';
import assert from 'node:assert/strict';
import {trendPoints, trendXY, trendCaption, trendHTML} from '../src/ui/lexiconTrend.js';

const h = arr => arr.map(lex => ({t: 0, lex, avg: 0}));

test('needs two runs to draw anything', () => {
  assert.equal(trendHTML(undefined), '');
  assert.equal(trendHTML([]), '');
  assert.equal(trendHTML(h([40])), '');
  assert.match(trendHTML(h([40, 44])), /<svg/);
});

test('keeps the last 12 runs, oldest first, ignoring junk', () => {
  const vals = Array.from({length: 30}, (_, i) => i);
  assert.deepEqual(trendPoints(h(vals)), vals.slice(-12));
  assert.deepEqual(trendPoints([{lex: 'x'}, null, {lex: 5}]), [5]);
});

test('points stay inside the drawing, higher Lexicon sits higher', () => {
  const xy = trendXY([30, 50, 40]);
  assert.ok(xy[1][1] < xy[0][1] && xy[1][1] < xy[2][1]);
  for (const [x, y] of xy) { assert.ok(x >= 0 && x <= 220 && y >= 0 && y <= 56); }
  const flat = trendXY([40, 40, 40]);
  assert.equal(new Set(flat.map(p => p[1])).size, 1);
});

test('caption says climbing, dipping or steady with only existing numbers', () => {
  assert.match(trendCaption([30, 40]), /30 to 40, climbing/);
  assert.match(trendCaption([40, 31]), /40 to 31, dipping/);
  assert.match(trendCaption([40, 35, 40]), /holding steady/);
});
