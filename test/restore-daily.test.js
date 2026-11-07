// The Restoration bench's Daily page (MR2): one page per room per day, the same for everyone, pinned with a Daily mark.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROOMS, HALL} from '../src/core/rooms.js';
import {buildPage, applyScore, RESTORE_AT, PASSAGES} from '../src/restore/pages.js';
import {currentPage, pinToWall, dailyDue, restoreOf, WALL_MAX} from '../src/restore/store.js';
import {frameHTML, pageNo} from '../src/restore/markup.js';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const RW = read('../public/data/room-words.json');
const topicRooms = ROOMS.filter(r => r.id !== HALL);
const poolOf = id => RW.rooms[id].map(([w, pos, def]) => ({w, pos, def}));
const DAY = '2026-11-07', NEXT = '2026-11-08';

/** Finishes a page the way the bench does: every entry restored, then pinned. */
function finish(S, page) {
  for (const p of page.passages) { p.restored = true; p.done = true; p.ink = 1; }
  return pinToWall(S, page);
}

test('a room prints the same Daily for everyone on a given day, from its pool alone', () => {
  const pool = poolOf('science');
  const alice = {}, bob = {shelf: [], met: {x: 1}};
  restoreOf(bob).used = poolOf('science').slice(0, 9).map(w => w.w); // bob has seen some words already
  const a = currentPage(alice, 'science', pool, DAY);
  const b = currentPage(bob, 'science', pool, DAY);
  assert.ok(a && a.daily === DAY && b && b.daily === DAY);
  assert.deepEqual(a.passages.map(p => p.w), b.passages.map(p => p.w));
  assert.equal(a.passages.length, PASSAGES);
});

test('the Daily changes with the day and with the room', () => {
  const pool = poolOf('history');
  const today = currentPage({}, 'history', pool, DAY);
  const tomorrow = currentPage({}, 'history', pool, NEXT);
  assert.notDeepEqual(today.passages.map(p => p.w), tomorrow.passages.map(p => p.w));
  const other = currentPage({}, 'math', poolOf('math'), DAY);
  assert.notEqual(other.id, today.id);
  assert.equal(today.id, `history-day-${DAY}`);
});

test('every topic room can print its Daily', () => {
  for (const r of topicRooms) {
    const pg = currentPage({}, r.id, poolOf(r.id), DAY);
    assert.ok(pg, `${r.id}: no Daily page`);
    assert.equal(pg.daily, DAY);
    assert.equal(new Set(pg.passages.map(p => p.w)).size, PASSAGES, `${r.id}: repeated word in the Daily`);
  }
});

test('pinning the Daily marks the room done for the day, so the next page is a normal one', () => {
  const S = {};
  const daily = currentPage(S, 'math', poolOf('math'), DAY);
  assert.equal(dailyDue(S, 'math', DAY), true);
  finish(S, daily);
  assert.equal(dailyDue(S, 'math', DAY), false);
  assert.equal(restoreOf(S).daily.math, DAY);
  const next = currentPage(S, 'math', poolOf('math'), DAY);
  assert.equal(next.daily, undefined, 'a second page the same day is a normal page');
  assert.match(next.id, /^math-\d+$/);
  // the next day the room's Daily is due again; a page still open from before is finished first, then the Daily prints
  assert.equal(dailyDue(S, 'math', NEXT), true);
  assert.equal(currentPage(S, 'math', poolOf('math'), NEXT), next, 'an open page is resumed, nothing is lost');
  finish(S, next);
  assert.equal(currentPage(S, 'math', poolOf('math'), NEXT).daily, NEXT);
});

test('an unfinished Daily resumes the same day, and an old one is replaced the next day', () => {
  const S = {};
  const first = currentPage(S, 'history', poolOf('history'), DAY);
  applyScore(first.passages[0], RESTORE_AT); // a first answer, page still open
  assert.equal(currentPage(S, 'history', poolOf('history'), DAY), first, 'same day: resumed with its progress');
  const later = currentPage(S, 'history', poolOf('history'), NEXT);
  assert.equal(later.daily, NEXT);
  assert.notEqual(later.id, first.id);
});

test('a Daily is not affected by the words a player has already seen', () => {
  const pool = poolOf('art');
  const fresh = currentPage({}, 'art', pool, DAY);
  const S = {};
  restoreOf(S).used = fresh.passages.map(p => p.w); // every Daily word already used on a page
  const after = currentPage(S, 'art', pool, DAY);
  assert.deepEqual(after.passages.map(p => p.w), fresh.passages.map(p => p.w));
});

test('the wall marks a Daily frame, and the bench names it Daily', () => {
  const pg = buildPage({room: 'science', seed: `day-${DAY}`, pool: poolOf('science')});
  pg.daily = DAY; pg.at = DAY;
  assert.equal(pageNo(pg), 'Daily');
  assert.equal(pageNo({...pg, daily: undefined, seed: 4}), 'Page 4');
  const html = frameHTML(pg);
  assert.match(html, /class="rs-frame daily"/);
  assert.match(html, /<b class="rs-tag">Daily<\/b>/);
  assert.doesNotMatch(frameHTML({...pg, daily: undefined, seed: 4}), /rs-tag/);
});

test('the wall keeps its cap and Daily pages stay on it', () => {
  const S = {};
  finish(S, currentPage(S, 'history', poolOf('history'), DAY));
  for (let i = 0; i < WALL_MAX + 3; i++) finish(S, buildPage({room: 'history', seed: 900 + i, pool: poolOf('history')}));
  assert.equal(restoreOf(S).wall.length, WALL_MAX);
});
