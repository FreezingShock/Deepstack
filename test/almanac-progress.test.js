import test from 'node:test';
import assert from 'node:assert/strict';
import {answeredBooks, wordsPerRoom, accuracyByDay, hardestWords, bestChain, progressFigures, TREND_DAYS} from '../src/core/almanacProgress.js';
import {progressLeaves, closenessChart, hardestList, HARDEST_SHOWN} from '../src/ui/almanacProgress.js';
import {statsLeaves} from '../src/ui/statsPages.js';
import {FLOORS, floorStartFt} from '../src/core/floors.js';
import {TIERS} from '../src/core/tiers.js';
import {ROOMS} from '../src/core/rooms.js';

const DAY = 864e5, NOON = Date.UTC(2026, 10, 5, 12);
const book = (w, score, extra = {}) => ({w, score, tier: 2, answer: 'x', t: NOON, ...extra});
const save = () => ({
  daily: {'2026-11-05': {books: [book('lucid', 20, {t: NOON}), book('tempest', 90, {tier: 4, t: NOON + 6e4, combo: {n: 2}}), book('skip', 0, {answer: '', t: NOON + 12e4})]}},
  rooms: {history: {daily: {'2026-11-06': {books: [book('vestige', 40, {room: 'history', t: NOON + DAY})]}}}},
  shelf: [book('lucid', 20, {t: NOON}), book('mellifluous', 55, {t: NOON + 2 * DAY, mode: 'unlimited', tier: 1, combo: {n: 4}})],
});

test('answered books: skipped words are not answers, a book counted once, rooms from the book', () => {
  const b = answeredBooks(save());
  assert.equal(b.length, 4);
  assert.ok(!b.some(x => x.w === 'skip'));
  assert.equal(b.find(x => x.w === 'vestige').room, 'history');
  assert.equal(b.find(x => x.w === 'lucid').room, 'hall');
});

test('words met per room count distinct words, one row per room in ring order', () => {
  const rooms = wordsPerRoom(answeredBooks(save()));
  assert.deepEqual(rooms.map(r => r.id), ROOMS.map(r => r.id));
  assert.equal(rooms.find(r => r.id === 'hall').met, 3); // lucid, tempest and the Unlimited mellifluous; the skipped word is not met
  assert.equal(rooms.find(r => r.id === 'history').met, 1);
});

test('closeness per day averages each day and keeps the last TREND_DAYS days', () => {
  const pts = accuracyByDay([...Array(40)].map((_, i) => ({w: 'a', score: i, tier: 0, room: 'hall', t: NOON + i * DAY, chain: 0})));
  assert.equal(pts.length, TREND_DAYS);
  assert.equal(pts[pts.length - 1].avg, 39);
  assert.ok(pts.every((p, i) => i === 0 || p.day > pts[i - 1].day));
});

test('hardest words sort by lowest average, then by most tries', () => {
  const h = hardestWords([
    {w: 'a', score: 10, tier: 0, room: 'hall', t: 1, chain: 0}, {w: 'a', score: 30, tier: 1, room: 'hall', t: 2, chain: 0},
    {w: 'b', score: 20, tier: 1, room: 'hall', t: 3, chain: 0}, {w: 'c', score: 80, tier: 4, room: 'hall', t: 4, chain: 0},
  ]);
  assert.deepEqual(h.map(x => [x.w, x.avg, x.n]), [['a', 20, 2], ['b', 20, 1], ['c', 80, 1]]);
});

test('longest chain comes from the combo the answer recorded, and is null with none', () => {
  assert.deepEqual(bestChain(answeredBooks(save())).n, 4);
  assert.equal(bestChain([{w: 'x', score: 5, tier: 0, room: 'hall', t: 1, chain: 0}]), null);
});

test('progress figures for an empty save are zero and draw nothing', () => {
  const f = progressFigures({});
  assert.equal(f.answered, 0);
  assert.deepEqual(progressLeaves({}), []);
  assert.match(closenessChart([]), /No answers in the last month/);
});

test('progress leaves: two pages, every room listed, at most the hardest words shown, no NaN', () => {
  const [l, r] = progressLeaves(save());
  assert.match(l, /Words met/);
  assert.match(r, /Closeness/);
  for (const room of ROOMS) assert.match(l, new RegExp(room.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal((r.match(/class="pg-hard"/g) || []).length, 1);
  assert.ok((r.split('class="pg-hard"')[1].split('</ul>')[0].match(/<li>/g) || []).length <= HARDEST_SHOWN);
  assert.ok(!/NaN|undefined/.test(l + r));
});

test('hardest list shows the tier name in its own colour', () => {
  const html = hardestList([{w: 'lucid', avg: 20, n: 1, tier: 4}]);
  assert.match(html, new RegExp(TIERS[4].name));
  assert.ok(html.includes(TIERS[4].ink));
});

test('the Almanac gains the progress spread only once something is answered', () => {
  const ctx = {TIERS, FLOORS, floorStartFt};
  const base = {runs: 1, books: 1, answered: 1, tiers: [1, 0, 0, 0, 0, 0, 0], rarest: 0, best: null, deepest: 0, deepestDay: null, totalFt: 0, avg: 20, streak: 1, bestStreak: 1, recent: []};
  assert.equal(statsLeaves(base, {}, ctx).length, 4);
  assert.equal(statsLeaves(base, save(), ctx).length, 7);
  assert.match(statsLeaves(base, save(), ctx)[5], /class="alm pg pg-b"/);
});
