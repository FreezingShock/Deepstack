import {test} from 'node:test';
import assert from 'node:assert/strict';
import {markedAnswer, strongerLine, wroteHTML} from '../src/ui/explain.js';
import {judge} from '../src/scorer/lexical.js';
import {feedbackData} from '../src/core/feedback.js';

test('underlines only counted words, keeps full text', () => {
  const t = 'someone who says very little, quietly';
  const h = markedAnswer(t, ['little']);
  assert.equal(h, 'someone who says very <u>little</u>, quietly');
  assert.ok(!h.includes('…'));
  assert.equal(markedAnswer('<b>x</b>', []), '&lt;b&gt;x&lt;/b&gt;');
});
test('stronger-answer line is under 12 words and quiet when nothing missed', () => {
  const b = {score: 20, answer: 'x', fb: {c: [], m: ['not speaking much', 'a reserved manner', 'third']}};
  const l = strongerLine(b);
  assert.ok(l && l.split(/\s+/).length < 12);
  assert.equal(strongerLine({...b, score: 95}), '');
  assert.equal(strongerLine({...b, skipped: true}), '');
  assert.equal(strongerLine({score: 10, answer: 'x', fb: {c: [], m: []}}), '');
});
test('long answers are fully present in the card html', () => {
  const a = 'a very long answer '.repeat(30).trim();
  assert.ok(wroteHTML({answer: a, score: 5}).includes(a));
});
test('judge reports counted words and the book stores them', () => {
  const w = {id: 1, w: 'zzz', pos: 'adj', def: 'quiet and reserved', concepts: [['quiet', 1, 'quiet,silent']]};
  const j = judge('very quiet person', w);
  assert.deepEqual(j.hits, ['quiet']);
  assert.deepEqual(feedbackData(j, w).h, ['quiet']);
});
