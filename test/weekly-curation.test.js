// WK2: each weekly theme takes its words from a curated allowlist. These guards keep the lists honest: every entry is a real
// library word whose definition still fits the theme, nothing is listed twice, and no theme runs short of words for a week.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {THEMES, THEME_WORDS, THEME_MIN, OFF_THEME, themeCandidates, weeklyWords, weekStartOf} from '../src/core/weekly.js';

const POOL = JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url), 'utf8')).words;
const MIN_LIST = 30; // enough variety that a theme never repeats the same few words

test('every theme has a curated list, and the lists are exactly the themes', () => {
  assert.deepEqual(Object.keys(THEME_WORDS).sort(), THEMES.map(t => t.key).sort());
});

test('each list is long enough, lowercase, and holds no duplicates', () => {
  for (const t of THEMES) {
    const list = THEME_WORDS[t.key];
    assert.ok(list.length >= MIN_LIST, `${t.key} lists ${list.length} words, needs ${MIN_LIST}`);
    assert.ok(list.every(w => /^[a-z]+$/.test(w)), `${t.key} has an entry that is not a plain lowercase word`);
    assert.equal(new Set(list).size, list.length, `${t.key} lists a word twice`);
  }
});

test('every listed word is in the shipped library and its definition still fits the theme', () => {
  for (const t of THEMES) {
    const have = new Set(POOL.filter(w => typeof w.def === 'string' && t.re.test(w.def)).map(w => w.w));
    const missing = THEME_WORDS[t.key].filter(w => !POOL.some(p => p.w === w));
    assert.deepEqual(missing, [], `${t.key} lists words the library does not have`);
    const loose = THEME_WORDS[t.key].filter(w => !have.has(w));
    assert.deepEqual(loose, [], `${t.key} lists words whose definitions no longer fit the theme`);
  }
});

test('no listed word is on the off-theme list', () => {
  for (const t of THEMES) {
    assert.deepEqual(THEME_WORDS[t.key].filter(w => OFF_THEME.has(w)), [], `${t.key} lists an off-theme word`);
  }
});

test('the candidates are the listed words the library has, and each theme has enough for a full week', () => {
  for (const t of THEMES) {
    const c = themeCandidates(t, POOL);
    const names = new Set(c.map(w => w.w));
    assert.ok(names.size >= THEME_MIN, `${t.key} has ${names.size} candidates, needs ${THEME_MIN}`);
    assert.ok([...names].every(w => THEME_WORDS[t.key].includes(w)), `${t.key} takes a word that is not on its list`);
  }
});

test('the weeks draw their seven words from the allowlist of their theme', () => {
  for (let i = 0; i < 12; i++) {
    const monday = weekStartOf(new Date(Date.parse('2026-11-02T00:00:00Z') + i * 7 * 864e5).toISOString().slice(0, 10));
    const {theme, words} = weeklyWords(monday, POOL);
    assert.ok(theme, 'a theme for ' + monday);
    assert.equal(words.length, 7, 'seven words for ' + monday);
    assert.ok(words.every(w => THEME_WORDS[theme.key].includes(w.w)), `${monday} (${theme.key}) has a word off its list`);
  }
});
