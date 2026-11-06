/* The word pool of the active room. WORDS (core/words.js) is what every picker reads (Daily, Unlimited, practice,
   lore books), so entering a topic room narrows WORDS in place to that room's list (public/data/rooms.json) and the
   Reading Room restores the full pool. The Daily seed carries the room id, so each room has its own Daily and the
   Reading Room's stays exactly what it was. The daily riddle always draws from the full pool. */
import {WORDS, GHOSTS} from './words.js';
import {HALL} from './rooms.js';

let ALL = null, ALLG = null, LISTS = null, cur = HALL;
export const MIN_ROOM_WORDS = 40; // a smaller list (a failed or stale rooms.json) falls back to every word

/** Call once the full word list has loaded (before any room narrows it). */
export function captureFullPool() { ALL = WORDS.slice(); ALLG = GHOSTS.slice(); }
export const fullPool = () => ALL || WORDS;
export const fullGhosts = () => ALLG || GHOSTS;
export function setRoomLists(lists) { LISTS = lists && typeof lists === 'object' ? lists : null; }
let EXTRA = {};
/** Words a room always holds on top of its list (its sets' words, src/sets/sets.js), as {room: [words]}. */
export function setRoomExtras(map) { EXTRA = map && typeof map === 'object' ? map : {}; }
export const roomList = id => (LISTS && Array.isArray(LISTS[id]) ? (EXTRA[id] ? [...new Set([...LISTS[id], ...EXTRA[id]])] : LISTS[id]) : null);
export const activePoolRoom = () => cur;

/** Narrows WORDS to room `id` (or restores every word for the Reading Room). Returns the pool size. */
export function applyRoomPool(id) {
  if (!ALL) captureFullPool();
  const list = id === HALL ? null : roomList(id);
  const set = list ? new Set(list) : null;
  let next = set ? ALL.filter(w => set.has(w.w)) : ALL;
  if (set && next.length < MIN_ROOM_WORDS) next = ALL;
  cur = next === ALL ? HALL : id;
  WORDS.length = 0; WORDS.push(...next);
  GHOSTS.length = 0; if (cur === HALL) GHOSTS.push(...ALLG);
  return WORDS.length;
}
/** Prefix for the Daily seed: '' in the Reading Room (unchanged dailies), 'history-' and so on in topic rooms. */
export const roomSeed = () => (cur === HALL ? '' : cur + '-');

let loading = null;
export function loadRoomLists(url = (import.meta.env?.BASE_URL || '/') + 'data/rooms.json') {
  return loading ||= (async () => {
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); setRoomLists((await r.json()).rooms); return true; }
    catch (e) { console.warn('Topic room lists unavailable:', e); return false; }
  })();
}
