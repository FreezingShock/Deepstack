import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyShareText, shareDaily, BARS} from '../src/ui/dailyShare.js';
import {finalHTML} from '../src/ui/results.js';

const TIER_NAMES = ['Pamphlet', 'Paperback', 'Hardbound', 'Folio', 'Codex', 'Grimoire', 'Apocrypha'];
const books = [
  {w: 'graveyard', tier: 3, score: 80, answer: 'my secret answer', ft: 122},
  {w: 'cabaret', tier: 1, score: 25, answer: 'dancing hall', ft: 46},
  {w: 'condominium', tier: 0, score: 0, answer: '', ft: 13}
];
const run = {books, avg: 52, depth: 181, floor: 1, mode: 'daily', day: '2026-11-06'};
const opts = (keys, extra = {}) => ({room: 'The Chronicle', no: 123, floorName: 'The Archive', tierNames: TIER_NAMES, keys, today: '2026-11-06', ...extra});

test('share text names the room, the Daily number, depth, floor and streak', () => {
  const txt = dailyShareText(run, opts(['2026-11-04', '2026-11-05', '2026-11-06']));
  const lines = txt.split('\n');
  assert.equal(lines[0], 'Deepstack · The Chronicle · No. 123');
  assert.equal(lines[1], 'Depth 181 ft · The Archive · average closeness 52');
  assert.equal(lines[2], 'Streak 3 days in a row');
  assert.equal(lines[3], BARS[3] + BARS[1] + BARS[0]);
  assert.equal(lines[4], 'Folio · Paperback · Pamphlet');
});

test('share text is spoiler-free: no word and no answer', () => {
  const txt = dailyShareText(run, opts(['2026-11-06']));
  for (const b of books) {
    assert.ok(!txt.includes(b.w), `word ${b.w} leaked`);
    if (b.answer) assert.ok(!txt.includes(b.answer), 'answer leaked');
  }
});

test('streak line is left out when the run has no streak, and singular for one day', () => {
  assert.ok(!dailyShareText(run, opts([])).includes('Streak'));
  assert.ok(dailyShareText(run, opts(['2026-11-06'])).includes('Streak 1 day in a row'));
});

test('streak counts from the run day, not from today', () => {
  const old = {...run, day: '2026-11-01'};
  // 11-02 came after this run, so it is ignored: 10-30, 10-31 and 11-01 make 3
  assert.ok(dailyShareText(old, opts(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'])).includes('Streak 3 days in a row'));
});

test('no floor name leaves no stray separator', () => {
  const txt = dailyShareText({...run, floor: 0}, opts([], {floorName: ''}));
  assert.equal(txt.split('\n')[1], 'Depth 181 ft · average closeness 52');
});

// shareDaily talks to navigator; stub it per test and restore afterwards.
const realNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
function setNav(v) { Object.defineProperty(globalThis, 'navigator', {value: v, configurable: true, writable: true}); }
test.after(() => { if (realNav) Object.defineProperty(globalThis, 'navigator', realNav); });

test('shareDaily opens the share sheet where navigator.share exists', async () => {
  let got = null;
  setNav({share: async o => { got = o; }, clipboard: {writeText: async () => { throw new Error('should not copy'); }}});
  assert.equal(await shareDaily('hello', 'Deepstack'), 'shared');
  assert.deepEqual(got, {title: 'Deepstack', text: 'hello'});
});

test('shareDaily reports a cancelled share sheet without copying', async () => {
  setNav({share: async () => { const e = new Error('dismissed'); e.name = 'AbortError'; throw e; }, clipboard: {writeText: async () => { throw new Error('should not copy'); }}});
  assert.equal(await shareDaily('hello'), 'cancelled');
});

test('shareDaily copies when there is no share sheet', async () => {
  let copied = '';
  setNav({clipboard: {writeText: async t => { copied = t; }}});
  assert.equal(await shareDaily('hello'), 'copied');
  assert.equal(copied, 'hello');
});

test('shareDaily falls back to the clipboard when share fails for another reason', async () => {
  let copied = '';
  setNav({share: async () => { throw new Error('NotAllowedError'); }, clipboard: {writeText: async t => { copied = t; }}});
  assert.equal(await shareDaily('hi'), 'copied');
  assert.equal(copied, 'hi');
});

test('shareDaily reports failed when neither works', async () => {
  setNav({clipboard: {writeText: async () => { throw new Error('denied'); }}});
  assert.equal(await shareDaily('hi'), 'failed');
});

test('results sheet shows a Share button only for a Daily, ahead of Copy result', () => {
  const base = {books, avg: 52, depth: 181, floor: 1, mode: 'daily'};
  const o = {txt: 'x', rarest: 'Folio', no: 2, floorName: 'The Archive', levelTitle: () => '', spines: '<img>'};
  const withShare = finalHTML(base, {}, {...o, share: true});
  const without = finalHTML(base, {}, {...o, share: false});
  assert.ok(withShare.includes('id="sh"'));
  assert.ok(withShare.indexOf('id="sh"') < withShare.indexOf('id="cp"'));
  assert.ok(!without.includes('id="sh"'));
  assert.ok(without.includes('id="cp"'));
});

// Guard for the phone bug (buttons clipped in one row): the wrap rule must exist, and load after the rule it overrides.
import {readFileSync} from 'node:fs';
test('phone results buttons wrap, and the override loads after the nowrap rule it replaces', () => {
  const css = readFileSync(new URL('../src/ui/dailyShare.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width:760px\)\{\s*\.fin \.row\{flex-wrap:wrap/);
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const base = readFileSync(new URL('../src/ui/finalPage.css', import.meta.url), 'utf8');
  assert.match(base, /\.fin \.row\{flex-wrap:nowrap/);
  assert.ok(main.indexOf("import './ui/dailyShare.css'") > main.indexOf("import './ui/finalPage.css'"));
});
