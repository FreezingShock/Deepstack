/* Restoration save state: S.restore, one additive field. Shape: {cur: {[room]: page|null}, wall: [page], used: [word], made: n}.
   `cur` holds the page in progress for each room, `wall` the finished pages (newest first, capped), `used` the headwords
   already printed so pages do not repeat, and `made` the seed counter. Missing fields are filled in, nothing is dropped. */
import {buildPage, pageComplete, PASSAGES} from './pages.js';

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
  return r;
}

/** The page in progress for `room`, or a fresh one drawn from `pool`. Null when the pool cannot fill a page. */
export function currentPage(S, room, pool) {
  const r = restoreOf(S);
  const cur = r.cur[room];
  if (cur && Array.isArray(cur.passages) && cur.passages.length === PASSAGES && !pageComplete(cur)) return cur;
  const page = buildPage({room, seed: r.made + 1, pool, used: r.used});
  if (!page) return null;
  r.made += 1;
  page.at = null;
  r.cur[room] = page;
  r.used = [...r.used, ...page.passages.map(p => p.w)].slice(-USED_MAX);
  return page;
}

/** Moves a finished page to the top of the wall and clears the room's page in progress. */
export function pinToWall(S, page) {
  const r = restoreOf(S);
  page.at = new Date().toISOString().slice(0, 10);
  r.wall = [page, ...r.wall.filter(p => p.id !== page.id)].slice(0, WALL_MAX);
  if (r.cur[page.room] && r.cur[page.room].id === page.id) r.cur[page.room] = null;
  return r.wall;
}

/** Keeps the page in progress up to date after an answer (the page object is the one in S). */
export const saveProgress = (S, page) => { restoreOf(S).cur[page.room] = page; };
