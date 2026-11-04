import test from 'node:test';
import assert from 'node:assert/strict';
import {hintSlipHtml, hintButtonLabel, skipButtonLabel} from '../src/ui/hintSlips.js';

test('sentence slip highlights the word and shows the cost', () => {
  const h = hintSlipHtml({kind: 'sentence', text: 'He was <b>___</b> today.'}, 'quixotic', 4, 1);
  assert.match(h, /<mark>quixotic<\/mark>/);
  assert.match(h, /−4 ft/);
  assert.doesNotMatch(h, /<b>___/);
});
test('hint button names the clue, price and remaining count', () => {
  assert.equal(hintButtonLabel(null, 0, 0), 'No more hints');
  assert.match(hintButtonLabel({kind: 'synonym'}, 8, 2), /a neighbour \(−8 ft\) · 2 left/);
});
test('skip button warns about what it costs', () => {
  assert.equal(skipButtonLabel(0, 0), 'Skip');
  assert.match(skipButtonLabel(2, 0), /chain/);
  assert.match(skipButtonLabel(0, 1), /hints wasted/);
});
