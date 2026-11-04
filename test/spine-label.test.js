import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitSpine, FS_MAX, FS_MIN, PAD} from '../src/ui/spineLabel.js';

const measure = (w, fs) => w.length * fs * .5; // fake metrics
const opt = {baseH: 80, baseW: 30, maxH: 136, measure};

test('short words keep a readable font and the base height', () => {
  const f = fitSpine('cat', opt);
  assert.equal(f.fs, FS_MAX);
  assert.equal(f.h, 80);
});

test('long words grow the spine so the whole word fits on the label plate', () => {
  for (const w of ['graveyard', 'counterrevolutionary', 'floccinaucinihilipilification']) {
    const f = fitSpine(w, opt);
    assert.ok(f.h <= opt.maxH);
    assert.ok(f.lh >= f.tw + 2 * PAD - 0.01 || f.fs === FS_MIN, w);
    assert.ok(f.lh <= f.h - 12);
    assert.ok(f.fs >= FS_MIN);
  }
});

test('the font only shrinks once the tallest spine cannot hold the word', () => {
  assert.equal(fitSpine('graveyard', opt).fs, FS_MAX);
  assert.ok(fitSpine('counterrevolutionary', opt).fs < FS_MAX);
});

test('room kept above the label for a gem is respected', () => {
  const f = fitSpine('quixotic', {...opt, top: 16});
  assert.ok(f.lh + f.top + 12 <= f.h);
});
