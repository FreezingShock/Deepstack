/* Restoration save state: S.restore, additive fields only. Shape: {cur: {[room]: page|null}, wall: [page], used: [word], made: n,
   daily: {[room]: 'YYYY-MM-DD'}}. `cur` holds the page in progress for each room, `wall` the finished pages (newest first, capped),
   `used` the headwords already printed so pages do not repeat, `made` the seed counter, and `daily` the day each room's Daily
   page was pinned (one Daily per room per day). Missing fields are filled in, nothing is dropped. */
import {buildPage, pageComplete, PASSAGES} from './pages.js';
import {recordMet, recordMastery} from '../core/roomDepth.js';
import {recordStamps, sealedPage} from '../core/stamps.js';

export const WALL_MAX = 40;
const USED_MAX = 600;

/** The restoration record on S, created on first use. Other fields on S are never touched. */
export function restoreOf(S) {
  if (!S.restore || typeof S.restore !== 'object') S.restore = {};
  const r = S.restore;
  if (!r.cur || typeof r.cur !== 'object') r.cur = {};
  if (!Array.isArray(r.wall)) r.wall = [];
  if (!Array.isArray(r.used)) r.used = [];
  if (!Number.isFinite(r.made)) r.made = 0;
  if (!r.daily || typeof r.daily !== 'object' || Array.isArray(r.daily)) r.daily = {};
  return r;
}

/** True when `room` has not yet pinned its Daily page for day `today` (the same page for everyone, MR2). */
export const dailyDue = (S, room, today) => !!today && restoreOf(S).daily[room] !== today;

/** The page in progress for `room`, or a fresh one drawn from `pool`. With `today`, a room's first page each day is its Daily:
    the same words for everyone, drawn from the room's pool alone (not from this player's history). A page in progress is
    resumed, unless it is an old Daily from an earlier day. Null when the pool cannot fill a page. */
export function currentPage(S, room, pool, today = null) {
  const r = restoreOf(S);
  const cur = r.cur[room];
  if (cur && Array.isArray(cur.passages) && cur.passages.length === PASSAGES && !pageComplete(cur) && (!cur.daily || cur.daily === today)) return cur;
  const daily = dailyDue(S, room, today);
  const page = daily
    ? buildPage({room, seed: `day-${today}`, pool, used: []})
    : buildPage({room, seed: r.made + 1, pool, used: r.used});
  if (!page) return null;
  if (daily) page.daily = today; else r.made += 1;
  page.at = null;
  r.cur[room] = page;
  r.used = [...r.used, ...page.passages.map(p => p.w)].slice(-USED_MAX);
  return page;
}

/** Moves a finished page to the top of the wall and clears the room's page in progress. A Daily also marks its room done for its day. */
export function pinToWall(S, page) {
  const r = restoreOf(S);
  page.at = new Date().toISOString().slice(0, 10);
  r.wall = [page, ...r.wall.filter(p => p.id !== page.id)].slice(0, WALL_MAX);
  if (r.cur[page.room] && r.cur[page.room].id === page.id) r.cur[page.room] = null;
  if (page.daily) r.daily[page.room] = page.daily;
  return r.wall;
}

/** Keeps the page in progress up to date after an answer (the page object is the one in S). */
export const saveProgress = (S, page) => { restoreOf(S).cur[page.room] = page; };

/** What a restored entry earns (MR3, MR4): the word counts as met for its rooms, mastery is checked, and any stamp it
    unlocks (the wax seal once its page is pinned) is recorded. Call after the entry is restored and the page is saved.
    Returns the newly earned stamps for the toast. */
export function rewardRestored(S, p, day) {
  if (p.restored) recordMet(S, {w: p.w});
  recordMastery(S, day);
  return recordStamps(S, day);
}
