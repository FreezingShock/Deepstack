import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nemesisState, nemesisOf, pickNemesis, pinNemesis, duelState, recordNemesis, nemesisCaptured, BEAT_SCORE} from '../src/core/nemesis.js';
import {nemesisPoster} from '../src/ui/nemesis.js';
import {progressLeaves} from '../src/ui/almanacProgress.js';
import {earnedStamps} from '../src/core/stamps.js';
import {TIERS} from '../src/core/tiers.js';

const TODAY = '2026-11-05', WEEK = '2026-11-02', NOON = Date.UTC(2026, 10, 5, 12);
const POOL = [
  {w: 'lucid', pos: 'adjective', def: 'easily understood; clear'},
  {w: 'tempest', pos: 'noun', def: 'a violent storm'},
  {w: 'vestige', pos: 'noun', def: 'a trace of something that no longer exists'},
  {w: 'bad<b>', pos: 'noun', def: 'a <script> test word'},
];
const book = (w, score, extra = {}) => {
  const p = POOL.find(x => x.w === w) || {pos: 'noun', def: 'x'};
  return {w, pos: p.pos, def: p.def, score, tier: TIERS.findLastIndex(t => score >= t.min), answer: 'my answer', t: NOON, ...extra};
};
/* lucid is missed hardest (avg 10 over two tries), tempest 40, vestige 70 */
const save = (extra = {}) => ({
  daily: {'2026-11-05': {books: [book('lucid', 10), book('lucid', 10, {t: NOON + 6e4}), book('tempest', 40), book('vestige', 70)]}},
  ...extra,
});

test('a missing or damaged nemesis field reads as empty', () => {
  for (const bad of [undefined, null, 3, 'x', [], {nemesis: 7}, {nemesis: {weeks: [], beaten: 'no'}}]) {
    const st = nemesisState(bad);
    assert.deepEqual(st, {weeks: {}, beaten: {}});
    assert.equal(nemesisOf(bad, WEEK), null);
  }
});

test('the Nemesis is the hardest word in your answers', () => {
  assert.equal(pickNemesis(save(), POOL).w, 'lucid');
});

test('a word the pool does not know cannot be duelled, so the next hardest is picked', () => {
  const s = save({daily: {'2026-11-05': {books: [book('tempest', 40), book('vestige', 70), book('ghost', 5)]}}});
  assert.equal(pickNemesis(s, POOL).w, 'tempest');
});

test('no answers, or only words the pool does not know, means no Nemesis', () => {
  assert.equal(pickNemesis({}, POOL), null);
  assert.equal(pinNemesis({daily: {'2026-11-05': {books: [book('ghost', 5)]}}}, WEEK, POOL), null);
});

test('the week is pinned on first look: later answers do not swap it out', () => {
  const s = save();
  assert.equal(pinNemesis(s, WEEK, POOL).w, 'lucid');
  s.daily['2026-11-05'].books.push(book('vestige', 0), book('vestige', 0), book('vestige', 0));
  assert.equal(pinNemesis(s, WEEK, POOL).w, 'lucid', 'vestige is hardest now, the pinned word stays');
  assert.equal(duelState(s, WEEK), 'open');
});

test('one swing a week: Folio or better captures the word, anything lower leaves it wanted', () => {
  const s = save();
  pinNemesis(s, WEEK, POOL);
  recordNemesis(s, WEEK, book('tempest', 99)); // wrong word: ignored
  assert.equal(duelState(s, WEEK), 'open');
  recordNemesis(s, WEEK, book('lucid', BEAT_SCORE - 1));
  assert.equal(duelState(s, WEEK), 'lost');
  assert.equal(nemesisCaptured(s), 0);
  assert.equal(pickNemesis(s, POOL).w, 'lucid', 'a lost word comes back as the rematch');
  recordNemesis(s, WEEK, book('lucid', 99)); // second swing this week: ignored
  assert.equal(nemesisOf(s, WEEK).duel.score, BEAT_SCORE - 1);
});

test('a captured word never comes back, and the Rematch won stamp is earned', () => {
  const s = save();
  pinNemesis(s, WEEK, POOL);
  recordNemesis(s, WEEK, book('lucid', TIERS[3].min));
  assert.equal(duelState(s, WEEK), 'captured');
  assert.equal(nemesisCaptured(s), 1);
  assert.equal(pickNemesis(s, POOL).w, 'tempest', 'the next hardest word is the new Nemesis');
  assert.ok(earnedStamps(s).some(x => x.id === 'library.nemesis'));
  assert.ok(!earnedStamps({}).some(x => x.id === 'library.nemesis'));
});

test('the poster is quiet with no Nemesis, and each state reads right', () => {
  assert.match(nemesisPoster({}, TODAY, POOL), /Nothing is wanted this week/);
  const s = save();
  const open = nemesisPoster(s, TODAY, POOL);
  assert.match(open, /class="nm nm-open"/);
  assert.match(open, /class="nm-go pen-ink"/);
  recordNemesis(s, WEEK, book('lucid', 20));
  const lost = nemesisPoster(s, TODAY, POOL);
  assert.match(lost, /Lost at 20/);
  assert.ok(!/nm-go/.test(lost), 'no swing left this week');
  const s2 = save();
  pinNemesis(s2, WEEK, POOL);
  recordNemesis(s2, WEEK, book('lucid', 80));
  const won = nemesisPoster(s2, TODAY, POOL);
  assert.match(won, /Captured at 80/);
  assert.match(won, /class="nm nm-captured"/);
});

test('the poster escapes the word and the definition, and never prints NaN or undefined', () => {
  const s = {daily: {'2026-11-05': {books: [book('bad<b>', 5)]}}};
  const html = nemesisPoster(s, TODAY, POOL);
  assert.ok(!html.includes('bad<b>') && !html.includes('<script>'), 'raw markup from the word and the definition is escaped');
  assert.ok(html.includes('bad&lt;b&gt;') && html.includes('&lt;script&gt;'));
  assert.ok(!/NaN|undefined/.test(html));
});

test('the Almanac lists the Rematch button on the Nemesis row while its swing is open', () => {
  const [, right, wanted] = progressLeaves(save(), TODAY, POOL);
  assert.match(wanted, /class="nm nm-open"/, 'the poster sits on its own Wanted leaf');
  assert.ok(!right.includes('nm-open'), 'not on the Closeness page');
  assert.equal((right.match(/class="pg-nm nm-go pen-ink"/g) || []).length, 1, 'one Rematch button, on the hardest word');
  const lucidRow = right.split('<li>').find(x => x.includes('pg-w">lucid'));
  assert.ok(lucidRow && lucidRow.includes('pg-nm'), 'the button sits on the lucid row');
  const s = save();
  pinNemesis(s, WEEK, POOL);
  recordNemesis(s, WEEK, book('lucid', 5));
  const [, after] = progressLeaves(s, TODAY, POOL);
  assert.ok(!after.includes('pg-nm'), 'no Rematch button once the swing is spent');
});
