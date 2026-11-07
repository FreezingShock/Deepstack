/* Achievement stamps: a small set per topic room, and a few library-wide. Pure: no DOM, no storage.
   Each stamp is derived from saved state (S.met, S.shelf, S.sets, S.metAt and every room's Dailies), so none needs its own
   bookkeeping. Once earned, a stamp is written to S.stamps = {id: 'YYYY-MM-DD'} (an additive save field, tidied on read),
   so it stays earned even if a room's list changes later. Ids are '<room>.<key>' or 'library.<key>'. */
import {ROOMS, HALL} from './rooms.js';
import {roomData} from './roomStore.js';
import {metWords, roomWordNames, DAILY_LEN} from './roomDepth.js';
import {longestStreak} from './stats.js';
import {themedWeeksDone, WEEK_DAYS} from './weekly.js';
import {nemesisCaptured} from './nemesis.js';

export const PERFECT_SCORE = 78;   // Grimoire and up (src/core/tiers.js): every word of a Daily at this score or better, none skipped
export const STREAK_DAYS = 7;      // Dailies in a row, in one room or across all of them
export const LIBRARY_WORDS = 100;  // different words met across the whole library
export const TOPIC_ROOMS = ROOMS.filter(r => r.id !== HALL);

const ROOM_STAMPS = [
  {key: 'first', name: 'First word', hint: 'Meet a word in this room.', test: c => c.met >= 1},
  {key: 'quarter', name: 'A quarter shelved', hint: 'Meet a quarter of the room’s words.', test: c => c.total > 0 && c.met * 4 >= c.total},
  {key: 'half', name: 'Half the room', hint: 'Meet half of the room’s words.', test: c => c.total > 0 && c.met * 2 >= c.total},
  {key: 'mastered', name: 'Room mastered', hint: 'Meet every word of the room.', test: c => c.mastered},
  {key: 'week', name: 'A week of Dailies', hint: `${STREAK_DAYS} Dailies in a row here.`, test: c => c.bestStreak >= STREAK_DAYS},
  {key: 'perfect', name: 'Perfect Daily', hint: `Every word of a Daily at ${PERFECT_SCORE} or better, none skipped.`, test: c => c.perfect},
];
const LIBRARY_STAMPS = [
  {key: 'doors', name: 'Every door opened', hint: `Open all ${TOPIC_ROOMS.length} topic rooms.`, test: l => l.opened === TOPIC_ROOMS.length},
  {key: 'shelves', name: 'Full shelves', hint: `Master all ${TOPIC_ROOMS.length} topic rooms.`, test: l => l.mastered === TOPIC_ROOMS.length},
  {key: 'week', name: 'Any-room week', hint: `${STREAK_DAYS} Dailies in a row, in any room.`, test: l => l.anyStreak >= STREAK_DAYS},
  {key: 'hundred', name: 'A hundred words', hint: `Meet ${LIBRARY_WORDS} different words across the library.`, test: l => l.libMet >= LIBRARY_WORDS},
  {key: 'theme', name: 'A themed week', hint: `Answer all ${WEEK_DAYS} days of one themed week.`, test: l => l.themedWeeks >= 1},
  {key: 'nemesis', name: 'Rematch won', hint: 'Beat a Nemesis word at Folio or better in its weekly rematch.', test: l => l.nemesisWon >= 1},
  {key: 'seal', name: 'Wax seal', hint: 'Restore every entry on one damaged page.', test: l => l.sealed},
];

/** Every stamp in a fixed order: each topic room's six, then the library-wide ones. */
export const CATALOG = [
  ...TOPIC_ROOMS.flatMap(r => ROOM_STAMPS.map(s => ({id: `${r.id}.${s.key}`, room: r.id, key: s.key, name: s.name, hint: s.hint, test: s.test}))),
  ...LIBRARY_STAMPS.map(s => ({id: `library.${s.key}`, room: null, key: s.key, name: s.name, hint: s.hint, test: s.test})),
];

const perfectDay = p => !!p && Array.isArray(p.books) && p.books.length >= DAILY_LEN
  && p.books.every(b => b && b.answer && !b.skipped && b.score >= PERFECT_SCORE);
const dayKeys = d => Object.keys((d && d.daily && typeof d.daily === 'object') ? d.daily : {});

/** What the stamps of one topic room need to know, from its own Dailies, its word list and the shared met words. */
function roomCtx(S, r) {
  const d = roomData(S, r.id), days = dayKeys(d);
  const names = roomWordNames(r.id), total = names ? names.length : 0, met = names ? metWords(S, names) : 0;
  return {
    met, total,
    mastered: !!(S.metAt && S.metAt[r.id]) || (total > 0 && met >= total),
    bestStreak: longestStreak(days),
    perfect: Object.values((d && d.daily) || {}).some(perfectDay),
    played: days.length,
  };
}

/** What the library-wide stamps need: every topic room's context, the words met across the library and any-room Dailies. */
function libCtx(S, rooms) {
  const met = new Set(), days = new Set();
  const seen = S.met && typeof S.met === 'object' && !Array.isArray(S.met) ? S.met : {};
  for (const w of Object.keys(seen)) met.add(w);
  for (const b of S.shelf || []) if (b && b.w && !b.skipped) met.add(b.w);
  for (const w of Object.keys((S.sets && S.sets.got) || {})) met.add(w);
  for (const r of ROOMS) for (const k of dayKeys(roomData(S, r.id))) days.add(k);
  return {
    opened: TOPIC_ROOMS.filter(r => rooms[r.id].played || rooms[r.id].met > 0).length,
    mastered: TOPIC_ROOMS.filter(r => rooms[r.id].mastered).length,
    anyStreak: longestStreak([...days]),
    libMet: met.size,
    themedWeeks: themedWeeksDone(S),
    nemesisWon: nemesisCaptured(S),
    sealed: !!S.restore && Array.isArray(S.restore.wall) && S.restore.wall.some(sealedPage),
  };
}

/** A restoration page with every entry back in ink: the wax seal (MR4). Shared with src/restore/store.js. */
export const sealedPage = pg => !!pg && Array.isArray(pg.passages) && pg.passages.length > 0 && pg.passages.every(p => !!p && p.restored);

/** Every stamp the save has earned right now, whether or not it has been recorded yet. */
export function earnedStamps(S) {
  if (!S) return [];
  const rooms = Object.fromEntries(TOPIC_ROOMS.map(r => [r.id, roomCtx(S, r)]));
  const lib = libCtx(S, rooms);
  return CATALOG.filter(s => s.test(s.room ? rooms[s.room] : lib));
}

/** S.stamps, tolerating a missing or damaged field. */
export const stampsOf = S => (S && S.stamps && typeof S.stamps === 'object' && !Array.isArray(S.stamps) ? S.stamps : {});

/** Writes every newly earned stamp into S.stamps with `day`. Returns the new ones, for a toast: [{id, room, name, hint}]. */
export function recordStamps(S, day) {
  if (!S) return [];
  if (!S.stamps || typeof S.stamps !== 'object' || Array.isArray(S.stamps)) S.stamps = {};
  const fresh = earnedStamps(S).filter(s => !S.stamps[s.id]);
  for (const s of fresh) S.stamps[s.id] = day;
  return fresh.map(s => ({id: s.id, room: s.room, name: s.name, hint: s.hint}));
}

/** The stamps of one topic room (or of the library when `room` is null), in catalogue order, for a page to draw.
 *  {id, key, name, hint, earned, day}; `day` is the day it was first earned, or null. */
export function stampRows(S, room = null) {
  const have = stampsOf(S), now = new Set(earnedStamps(S).map(s => s.id));
  return CATALOG.filter(s => s.room === room).map(s => {
    const day = typeof have[s.id] === 'string' ? have[s.id] : null;
    return {id: s.id, key: s.key, name: s.name, hint: s.hint, earned: !!day || now.has(s.id), day};
  });
}

/** How many of the catalogue the save has earned: {earned, total}. */
export function stampTally(S) {
  const have = stampsOf(S), now = new Set(earnedStamps(S).map(s => s.id));
  return {earned: CATALOG.filter(s => have[s.id] || now.has(s.id)).length, total: CATALOG.length};
}
