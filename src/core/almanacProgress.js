/* Progress figures for the Almanac: words met per room, accuracy over time, hardest words and the longest answer chain.
   Pure: reads only what the save already keeps (Daily books in every room, plus the shelf for Unlimited answers), so old
   saves work, nothing new is stored, and the numbers match the Ember Log and the Collection pages. */
import {ROOMS} from './rooms.js';
import {roomData} from './roomStore.js';
import {bookRoom} from './shelfRooms.js';
import {dayKey} from './stats.js';

export const TREND_DAYS = 30; // accuracy points shown at most

/** Every answered book the save holds, once each. Skipped words are not answers (same rule as computeStats). */
export function answeredBooks(S) {
  const seen = new Set(), out = [];
  const add = b => {
    if (!b || typeof b.w !== 'string' || !b.w || typeof b.score !== 'number' || !isFinite(b.score)) return;
    if (b.skipped || (b.answer === '' && b.score === 0)) return;
    if (typeof b.t === 'number') { const k = b.t + '|' + b.w; if (seen.has(k)) return; seen.add(k); }
    out.push({w: b.w, score: b.score, tier: b.tier | 0, room: bookRoom(b), t: typeof b.t === 'number' ? b.t : null, chain: b.combo && b.combo.n | 0});
  };
  for (const r of ROOMS) for (const d of Object.values(roomData(S, r.id).daily || {})) for (const b of (d && d.books) || []) add(b);
  for (const b of (S && S.shelf) || []) add(b);
  return out;
}

/** Words met per room (distinct answered words in each room), in ring order. */
export function wordsPerRoom(books) {
  const sets = Object.fromEntries(ROOMS.map(r => [r.id, new Set()]));
  for (const b of books) if (sets[b.room]) sets[b.room].add(b.w);
  return ROOMS.map(r => ({id: r.id, name: r.name, short: r.short, met: sets[r.id].size}));
}

/** Mean closeness per local day, the last TREND_DAYS days that have answers, oldest first. */
export function accuracyByDay(books, days = TREND_DAYS) {
  const by = new Map();
  for (const b of books) {
    if (b.t === null) continue;
    const k = dayKey(b.t), a = by.get(k) || {day: k, sum: 0, n: 0};
    a.sum += b.score; a.n++; by.set(k, a);
  }
  return [...by.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-days)
    .map(a => ({day: a.day, avg: Math.round(a.sum / a.n), n: a.n}));
}

/** The words you find hardest: lowest average closeness over their attempts, at least one answer each. */
export function hardestWords(books, n = 5) {
  const by = new Map();
  for (const b of books) {
    const a = by.get(b.w) || {w: b.w, sum: 0, n: 0, tier: 0, room: b.room, last: -Infinity};
    a.sum += b.score; a.n++;
    if (b.score > (a.best ?? -1)) a.best = b.score;
    const at = b.t ?? 0;
    if (at >= a.last) { a.last = at; a.room = b.room; a.tier = b.tier; }
    by.set(b.w, a);
  }
  return [...by.values()]
    .map(a => ({w: a.w, avg: Math.round(a.sum / a.n), n: a.n, best: a.best, tier: a.tier, room: a.room}))
    .sort((a, b) => a.avg - b.avg || b.n - a.n || (a.w < b.w ? -1 : 1))
    .slice(0, n);
}

/** Longest run of answers at Folio or better, as the combo chain recorded it (0 when none reached two). */
export function bestChain(books) {
  let best = null;
  for (const b of books) if (b.chain >= 2 && (!best || b.chain > best.n)) best = {n: b.chain, w: b.w, day: b.t === null ? null : dayKey(b.t)};
  return best;
}

/** All the figures the Almanac progress page needs, from one save. */
export function progressFigures(S) {
  const books = answeredBooks(S);
  const rooms = wordsPerRoom(books);
  const distinct = new Set(books.map(b => b.w));
  const avg = books.length ? Math.round(books.reduce((a, b) => a + b.score, 0) / books.length) : 0;
  return {
    answered: books.length, distinct: distinct.size, avg, rooms,
    trend: accuracyByDay(books), hardest: hardestWords(books), chain: bestChain(books),
  };
}
