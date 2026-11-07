// WK3: an unsent weekly answer is kept (S.weeklyRun, additive) so a reload brings it back. These check the pure helpers,
// and that a played day keeps the word it was answered with even if the word lists change later.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {weekRows, recordWeekly, weeklyDraft, setWeeklyDraft, weekStartOf} from '../src/core/weekly.js';

const POOL = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url), 'utf8')).words;
const MONDAY = '2026-11-02';
const book = (day, w = 'word' + day) => ({w, pos: 'noun', def: 'a test', score: 80, tier: 3, answer: 'my answer', rows: 3, ft: 300, fl: 0, t: 1, day});

test('no draft when nothing was written, and damaged draft fields are ignored', () => {
  assert.equal(weeklyDraft({}, MONDAY), null);
  for (const weeklyRun of [null, 'x', [], {day: 5, text: 3}, {day: MONDAY, text: '   '}, {day: MONDAY}]) {
    assert.equal(weeklyDraft({weeklyRun}, MONDAY), null);
  }
});

test('a draft is kept for its day only', () => {
  const S = {};
  setWeeklyDraft(S, MONDAY, 'A small room of old stories');
  assert.equal(weeklyDraft(S, MONDAY), 'A small room of old stories');
  assert.equal(weeklyDraft(S, '2026-11-03'), null);
  setWeeklyDraft(S, '2026-11-03', 'tomorrow');
  assert.equal(weeklyDraft(S, MONDAY), null, 'a new day replaces the old draft');
  assert.equal(weeklyDraft(S, '2026-11-03'), 'tomorrow');
});

test('an empty draft clears the day, and a long one is cut to the answer limit', () => {
  const S = {};
  setWeeklyDraft(S, MONDAY, 'half an answer');
  setWeeklyDraft(S, MONDAY, '   ');
  assert.equal(S.weeklyRun, undefined);
  setWeeklyDraft(S, MONDAY, 'x'.repeat(500));
  assert.equal(weeklyDraft(S, MONDAY).length, 300);
});

test('answering the day sends the draft with it, and an answered day never resumes', () => {
  const S = {};
  setWeeklyDraft(S, MONDAY, 'written but not yet sent');
  recordWeekly(S, MONDAY, book(MONDAY));
  assert.equal(S.weeklyRun, undefined);
  assert.equal(weeklyDraft(S, MONDAY), null);
  setWeeklyDraft(S, MONDAY, 'a second try');
  assert.equal(weeklyDraft(S, MONDAY), null, 'a played day has nothing to resume');
});

test('a played day shows the word it was answered with, even when the word lists have changed', () => {
  const S = {};
  recordWeekly(S, MONDAY, book(MONDAY, 'sloop'));
  const {rows} = weekRows(S, '2026-11-03', POOL);
  assert.equal(rows[0].state, 'played');
  assert.equal(rows[0].w, 'sloop');
  assert.equal(rows[0].def, 'a test');
  assert.equal(weekStartOf(MONDAY), MONDAY);
});
