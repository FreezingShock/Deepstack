import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alsoAccepted, alsoAcceptedHTML} from '../src/ui/alsoAccepted.js';

const rel = {taciturn: {s: ['reticent', 'silent', 'quiet', 'reserved', 'untalkative', 'hard word'], c: ['mum', 'taciturnly']}};
const b = (o = {}) => ({w: 'taciturn', score: 60, answer: 'very quiet person', ...o});

test('lists up to four single words, yours first and underlined', () => {
  const l = alsoAccepted(b(), rel);
  assert.equal(l.length, 4);
  assert.deepEqual(l[0], {word: 'quiet', yours: true});
  assert.ok(!l.some(x => /\s/.test(x.word) || x.word === 'taciturnly'));
  assert.match(alsoAcceptedHTML(b(), rel), /<u>quiet<\/u>/);
});
test('stays quiet for skips, low scores, missing data', () => {
  assert.deepEqual(alsoAccepted(b({score: 5}), rel), []);
  assert.deepEqual(alsoAccepted(b({answer: ''}), rel), []);
  assert.deepEqual(alsoAccepted(b({skipped: true}), rel), []);
  assert.equal(alsoAcceptedHTML(b(), {}), '');
});
