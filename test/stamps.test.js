import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setRoomLists, setRoomEntries, setRoomExtras} from '../src/core/roomPool.js';
import {CATALOG, earnedStamps, recordStamps, stampRows, stampTally, TOPIC_ROOMS, PERFECT_SCORE, STREAK_DAYS, LIBRARY_WORDS} from '../src/core/stamps.js';

const days = (n, from = '2026-11-01') => Object.fromEntries(Array.from({length: n}, (_, i) => [new Date(Date.parse(from + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10), {books: []}]));
const ids = S => earnedStamps(S).map(s => s.id);
const eight = Array.from({length: 8}, (_, i) => 'maths' + i);
const perfectBooks = (n = 7, score = PERFECT_SCORE) => Array.from({length: n}, (_, i) => ({w: 'p' + i, answer: 'an answer', score, skipped: false}));

test('the catalogue has six stamps per topic room and six library-wide, each with a unique id', () => {
  assert.equal(TOPIC_ROOMS.length, 6);
  assert.equal(CATALOG.length, 6 * 6 + 7);
  assert.equal(new Set(CATALOG.map(s => s.id)).size, CATALOG.length);
  assert.equal(stampTally({}).total, CATALOG.length);
  assert.ok(CATALOG.every(s => s.name && s.hint), 'every stamp says what it is and how to earn it');
});

test('depth stamps follow the share of a room met: first word, a quarter, half, then mastered', () => {
  setRoomEntries(null); setRoomExtras({});
  setRoomLists({math: eight});
  const S = {shelf: [], met: {}};
  const at = n => { S.met = Object.fromEntries(eight.slice(0, n).map(w => [w, 1])); return ids(S).filter(i => i.startsWith('math.')); };
  assert.deepEqual(at(0), []);
  assert.deepEqual(at(1), ['math.first']);
  assert.deepEqual(at(2), ['math.first', 'math.quarter']);
  assert.deepEqual(at(4), ['math.first', 'math.quarter', 'math.half']);
  assert.deepEqual(at(8), ['math.first', 'math.quarter', 'math.half', 'math.mastered']);
});

test('a room with no word list cannot earn depth stamps, but its Dailies still count', () => {
  setRoomLists({});
  const S = {shelf: [{w: 'anything'}], met: {x: 1}, rooms: {art: {daily: days(STREAK_DAYS)}}};
  const got = ids(S);
  assert.ok(!got.some(i => /^(art|history)\.(first|quarter|half|mastered)$/.test(i)));
  assert.ok(got.includes('art.week'));
});

test('a week of Dailies in one room earns that room’s week stamp and the any-room one, and no other room’s', () => {
  const S = {rooms: {history: {daily: days(STREAK_DAYS)}, math: {daily: days(STREAK_DAYS - 1)}}};
  const got = ids(S);
  assert.ok(got.includes('history.week'));
  assert.ok(!got.includes('math.week'), 'six days is not a week');
  assert.ok(got.includes('library.week'));
});

test('a perfect Daily needs every word at the Grimoire score or better, none skipped', () => {
  const ok = {rooms: {science: {daily: {'2026-11-02': {books: perfectBooks()}}}}};
  assert.ok(ids(ok).includes('science.perfect'));
  const one = perfectBooks(); one[3] = {...one[3], score: PERFECT_SCORE - 1};
  assert.ok(!ids({rooms: {science: {daily: {'2026-11-02': {books: one}}}}}).includes('science.perfect'));
  const skipped = perfectBooks(); skipped[0] = {...skipped[0], answer: '', skipped: true};
  assert.ok(!ids({rooms: {science: {daily: {'2026-11-02': {books: skipped}}}}}).includes('science.perfect'));
  assert.ok(!ids({rooms: {science: {daily: {'2026-11-02': {books: perfectBooks(6)}}}}}).includes('science.perfect'), 'a short Daily is not perfect');
});

test('library stamps: every door, full shelves and a hundred words met across the library', () => {
  const S = {shelf: [], met: {}, rooms: {}};
  for (const r of TOPIC_ROOMS.slice(0, 5)) S.rooms[r.id] = {daily: days(1)};
  assert.ok(!ids(S).includes('library.doors'), 'five doors is not every door');
  S.rooms[TOPIC_ROOMS[5].id] = {daily: days(1)};
  assert.ok(ids(S).includes('library.doors'));
  S.met = Object.fromEntries(Array.from({length: LIBRARY_WORDS - 1}, (_, i) => ['w' + i, 1]));
  assert.ok(!ids(S).includes('library.hundred'));
  S.shelf = [{w: 'extra'}, {w: 'skipme', skipped: true}];
  assert.ok(ids(S).includes('library.hundred'), 'shelf books count too, skipped ones do not');
  assert.ok(!ids(S).includes('library.shelves'));
});

test('recordStamps writes each new stamp once with its day, and reports only the new ones', () => {
  setRoomLists({math: eight});
  const S = {shelf: [], met: {maths0: 1}};
  const first = recordStamps(S, '2026-11-06');
  assert.deepEqual(first.map(s => s.id), ['math.first']);
  assert.equal(S.stamps['math.first'], '2026-11-06');
  assert.deepEqual(recordStamps(S, '2026-11-07'), [], 'nothing new, so nothing to toast');
  assert.equal(S.stamps['math.first'], '2026-11-06', 'an earned day is never rewritten');
  S.met = {...S.met, maths1: 1};
  assert.deepEqual(recordStamps(S, '2026-11-08').map(s => s.id), ['math.quarter']);
});

test('a damaged S.stamps field is replaced, and stamps never appear without being earned', () => {
  const S = {stamps: ['nope'], shelf: []};
  assert.deepEqual(recordStamps(S, '2026-11-06'), []);
  assert.deepEqual(S.stamps, {});
  assert.deepEqual(recordStamps(null, '2026-11-06'), []);
});

test('stampRows lists one room in catalogue order, with the day it was earned or a stored-less earned flag', () => {
  setRoomLists({math: eight});
  const S = {shelf: [], met: {maths0: 1}, stamps: {'math.first': '2026-11-06'}};
  const rows = stampRows(S, 'math');
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map(r => r.key), ['first', 'quarter', 'half', 'mastered', 'week', 'perfect']);
  assert.equal(rows[0].earned, true);
  assert.equal(rows[0].day, '2026-11-06');
  assert.equal(rows[1].earned, false);
  const legacy = stampRows({shelf: [], met: {maths0: 1}}, 'math')[0];
  assert.equal(legacy.earned, true, 'a save from before this feature still shows what it already earned');
  assert.equal(legacy.day, null);
  assert.equal(stampRows(S, null).length, 7, 'the library-wide row set');
});
