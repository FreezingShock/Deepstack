/* How deep a topic room really is (TA2). Pure: no DOM, no storage.
   - simulateRoom: replays N days of Dailies (and one Unlimited-sized run) over a room's pool and reports repeats.
   - metCount: how many of a room's words the player has met (a shelf book or a collected set word). */
import {dailyWords} from './daily.js';
import {roomList, roomEntries} from './roomPool.js';

export const DAILY_LEN = 7;       // words in a Daily
export const SIM_DAYS = 60;       // days the simulation replays
export const MIN_DEPTH_WORDS = 210; // enforced floor on a room's playable words (a month of Dailies before a word returns); CI fails below it
export const MIN_REPEAT_GAP_DAYS = 14; // enforced: in a 60-day run no Daily word returns sooner than this

const dayKey = i => new Date(Date.UTC(2026, 10, 3) + i * 86400000).toISOString().slice(0, 10);

/** pool: playable word objects of one room; id: the room id (it prefixes the Daily seed, as in the game). */
export function simulateRoom(pool, id, {days = SIM_DAYS, n = DAILY_LEN} = {}) {
  const seenAt = new Map(); let picks = 0, repeats = 0, soonest = Infinity;
  for (let d = 0; d < days; d++) {
    const ws = dailyWords(dayKey(d), n, {pool, ghosts: [], seed: id + '-'});
    for (const w of ws) {
      picks++;
      if (seenAt.has(w.w)) { repeats++; soonest = Math.min(soonest, d - seenAt.get(w.w)); }
      seenAt.set(w.w, d);
    }
  }
  return {room: id, words: pool.length, picks, distinct: seenAt.size, repeats, repeatRate: picks ? repeats / picks : 0,
    soonestRepeatDays: Number.isFinite(soonest) ? soonest : null, daysBeforeRepeatsExpected: Math.floor(pool.length / n)};
}

/** Remembers a word as met. The shelf keeps only the last 300 books, which could never reach 100% of a 400-word room,
 *  so every answered word is also kept in S.met = {word: 1} (an additive save field; old saves fall back to the shelf). */
export function recordMet(S, book) {
  if (!S || !book || !book.w || book.skipped) return;
  if (!S.met || typeof S.met !== 'object' || Array.isArray(S.met)) S.met = {};
  S.met[book.w] = 1;
}
/** The words of `list` the player has met: S.met, distinct shelf books and collected set words. */
export function metWords(S, list) {
  const inRoom = new Set(list || []), met = new Set();
  for (const b of (S && S.shelf) || []) if (b && inRoom.has(b.w) && !b.skipped) met.add(b.w);
  const seen = (S && S.met && typeof S.met === 'object' && !Array.isArray(S.met)) ? S.met : {};
  for (const w of Object.keys(seen)) if (inRoom.has(w)) met.add(w);
  const got = (S && S.sets && S.sets.got) || {};
  for (const w of Object.keys(got)) if (inRoom.has(w)) met.add(w);
  return met.size;
}
/** Every word a room holds: its list (sets included) plus its own entries (room-words.json). Null until a list has loaded. */
export function roomWordNames(id) {
  const l = roomList(id), e = roomEntries(id);
  if (!l && !e) return null;
  return [...new Set([...(l || []), ...(e || []).map(x => x.w)])];
}
/** True when a label like "118 of 118 met" says every word of the room has been met (TA2c). */
export const allMet = label => { const m = /(\d+) of (\d+)/.exec(label || ''); return !!m && +m[2] > 0 && +m[1] >= +m[2]; };
export const metLabel = (met, total) => `${met} of ${total} met`;
/** "47 of 118 met" for room `id`, or '' until its word list has loaded (the Reading Room has no list). */
export function roomMetLabel(S, id) {
  const l = roomWordNames(id);
  return l && l.length ? metLabel(metWords(S, l), l.length) : '';
}
