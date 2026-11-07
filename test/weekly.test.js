import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {THEMES, THEME_MIN, OFF_THEME, themeCandidates, weekStartOf, weekdayIndex, weekDayKeys, themeOfWeek, weeklyWords, dayWord,
  recordWeekly, dayRecord, weekPlayed, themedWeeksDone, weekRows} from '../src/core/weekly.js';
import {earnedStamps, CATALOG} from '../src/core/stamps.js';

const POOL = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url), 'utf8')).words;
const MONDAY = '2026-11-02';
const book = (day, w = 'word' + day, score = 80) => ({w, pos: 'noun', def: 'a test', score, tier: 3, answer: 'my answer', rows: 3, ft: 300, fl: 0, t: 1, day});

test('weeks run Monday to Sunday in UTC and the day index starts at Monday', () => {
  assert.equal(weekStartOf('2026-11-02'), MONDAY);
  assert.equal(weekStartOf('2026-11-07'), MONDAY);
  assert.equal(weekStartOf('2026-11-08'), MONDAY);
  assert.equal(weekStartOf('2026-11-09'), '2026-11-09');
  assert.equal(weekdayIndex(MONDAY), 0);
  assert.equal(weekdayIndex('2026-11-08'), 6);
  assert.deepEqual(weekDayKeys(MONDAY), ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
});

test('every theme has enough words in the shipped list for a full week', () => {
  for (const t of THEMES) {
    const n = POOL.filter(w => typeof w.def === 'string' && t.re.test(w.def)).length;
    assert.ok(n >= THEME_MIN, `${t.key} has ${n} words, needs ${THEME_MIN}`);
  }
});

test('a week has seven distinct words that all match its theme, climbing from Monday to Sunday', () => {
  for (let i = 0; i < 12; i++) {
    const monday = weekStartOf(new Date(Date.parse(MONDAY + 'T00:00:00Z') + i * 7 * 864e5).toISOString().slice(0, 10));
    const {theme, words} = weeklyWords(monday, POOL);
    assert.ok(theme, 'a theme for ' + monday);
    assert.equal(words.length, 7);
    assert.equal(new Set(words.map(w => w.w)).size, 7, 'no repeats in a week');
    assert.ok(words.every(w => theme.re.test(w.def)), 'every word fits the theme');
    for (let k = 1; k < 7; k++) assert.ok((words[k - 1].d || 0) <= (words[k].d || 0), 'easiest on Monday');
  }
});

test('the week is deterministic and the themes vary across weeks', () => {
  const a = weeklyWords(MONDAY, POOL).words.map(w => w.w);
  const b = weeklyWords(MONDAY, POOL).words.map(w => w.w);
  assert.deepEqual(a, b);
  const keys = new Set();
  for (let i = 0; i < 12; i++) keys.add(themeOfWeek(weekStartOf(new Date(Date.parse(MONDAY + 'T00:00:00Z') + i * 7 * 864e5).toISOString().slice(0, 10)), POOL).theme.key);
  assert.ok(keys.size >= 4, 'at least four themes in twelve weeks');
});

test('dayWord is the week word for that weekday', () => {
  const {words} = weeklyWords(MONDAY, POOL);
  assert.equal(dayWord('2026-11-02', POOL).w, words[0].w);
  assert.equal(dayWord('2026-11-08', POOL).w, words[6].w);
});

test('a pool with no matching words gives no theme and no words, never a crash', () => {
  assert.deepEqual(weeklyWords(MONDAY, []).words, []);
  assert.equal(dayWord('2026-11-04', []), null);
});

test('answers are kept per week and a week counts as done only when all seven days are played', () => {
  const S = {};
  recordWeekly(S, '2026-11-02', book('2026-11-02'));
  recordWeekly(S, '2026-11-03', book('2026-11-03'));
  assert.equal(weekPlayed(S, MONDAY), 2);
  assert.equal(dayRecord(S, '2026-11-03').w, 'word2026-11-03');
  assert.equal(dayRecord(S, '2026-11-04'), null);
  for (const k of weekDayKeys(MONDAY).slice(2)) recordWeekly(S, k, book(k));
  assert.equal(weekPlayed(S, MONDAY), 7);
  assert.equal(themedWeeksDone(S), 1);
  assert.equal(themedWeeksDone({}), 0);
});

test('a damaged weekly field is tolerated', () => {
  for (const weekly of [null, 'x', [], {[MONDAY]: 'nope'}, {[MONDAY]: {days: []}}]) {
    const S = {weekly};
    assert.equal(dayRecord(S, '2026-11-02'), null);
    assert.equal(themedWeeksDone(S), 0);
    recordWeekly(S, '2026-11-02', book('2026-11-02'));
    assert.equal(dayRecord(S, '2026-11-02').w, 'word2026-11-02');
  }
});

test('the themed-week stamp is earned once a whole week is answered, and not before', () => {
  const S = {};
  for (const k of weekDayKeys(MONDAY).slice(0, 6)) recordWeekly(S, k, book(k));
  assert.ok(!earnedStamps(S).some(s => s.id === 'library.theme'));
  recordWeekly(S, '2026-11-08', book('2026-11-08'));
  assert.ok(earnedStamps(S).some(s => s.id === 'library.theme'));
  assert.ok(CATALOG.some(s => s.id === 'library.theme' && s.name && s.hint));
});

test('weekRows marks each day played, missed, today or sealed, and reveals only the days that are open', () => {
  const S = {};
  recordWeekly(S, '2026-11-02', book('2026-11-02'));
  const {rows, played, theme} = weekRows(S, '2026-11-04', POOL);
  assert.ok(theme);
  assert.equal(played, 1);
  assert.deepEqual(rows.map(r => r.state), ['played', 'missed', 'today', 'sealed', 'sealed', 'sealed', 'sealed']);
  assert.ok(rows.every(r => r.w), 'the seven words are known for the week');
});

test('theme membership guard: no off-theme word is a candidate of any theme, and each theme keeps enough words after the exclusions', () => {
  for (const t of THEMES) {
    const c = themeCandidates(t, POOL);
    assert.ok(c.length >= THEME_MIN, `${t.key} keeps ${c.length} words`);
    const bad = c.filter(w => OFF_THEME.has(w.w)).map(w => w.w);
    assert.deepEqual(bad, [], `${t.key} lets off-theme words through`);
  }
});

test('the known loose matches stay out: butler under Food, curtain under Weather', () => {
  const food = THEMES.find(t => t.key === 'food'), weather = THEMES.find(t => t.key === 'weather');
  assert.ok(!themeCandidates(food, POOL).some(w => w.w === 'butler'));
  assert.ok(!themeCandidates(weather, POOL).some(w => w.w === 'curtain'));
});
