import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedbackData, feedbackLines} from '../src/core/feedback.js';
import {feedbackHTML} from '../src/ui/feedback.js';
import {judge} from '../src/scorer/lexical.js';
import {WORDS} from '../src/core/words.js';

const w = WORDS[0]; // abandon

test('caught and missed come from the judge', () => {
  const j = judge('to leave something behind', w);
  const fb = feedbackData(j, w);
  assert.ok(fb.c.includes('leave behind'));
  assert.ok(fb.m.includes('completely'));
});
test('labels never spell the word', () => {
  const fb = feedbackData({caught: ['abandoned ship', 'leave'], missed: ['to abandon'], empty: false}, {w: 'abandon'});
  assert.deepEqual(fb.c, ['an idea close to the word itself', 'leave']);
  assert.ok(!JSON.stringify(fb).includes('abandon'));
});
test('every word in the bank yields spoiler-free feedback', () => {
  for (const x of WORDS) {
    const fb = feedbackData(judge('something unrelated to anything', x), x);
    if (fb) assert.ok(!JSON.stringify(fb).toLowerCase().includes(x.w.toLowerCase()), x.w);
  }
});
test('skips and old books show nothing', () => {
  assert.equal(feedbackLines({answer: '', fb: {c: [], m: ['x']}}), null);
  assert.equal(feedbackLines({answer: 'hi'}), null);
  assert.equal(feedbackHTML({answer: 'hi'}), '');
  assert.equal(feedbackData({empty: true, caught: [], missed: []}, w), undefined);
});
test('html is collapsed by default and escapes', () => {
  const h = feedbackHTML({answer: 'x', fb: {c: ['a<b'], m: ['c'], o: 1}});
  assert.ok(h.startsWith('<details class="fbk">') && !/\sopen/.test(h));
  assert.ok(h.includes('a&lt;b') && h.includes('opposite'));
});
