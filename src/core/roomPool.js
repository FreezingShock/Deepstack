/* The word pool of the active room. WORDS (core/words.js) is what every picker reads (Daily, Unlimited, practice,
   lore books), so entering a topic room narrows WORDS in place to that room's list (public/data/rooms.json) and the
   Reading Room restores the full pool. The Daily seed carries the room id, so each room has its own Daily and the
   Reading Room's stays exactly what it was. The daily riddle always draws from the full pool. */
import {WORDS, GHOSTS} from './words.js';
import {HALL} from './rooms.js';
import {hashStr} from './daily.js';
import {effectiveDifficulty} from './difficulty.js';
import {templateHint} from './wordPool.js';
import {dataUrl} from './dataUrl.js';
import {reportState, clearState} from './stateEvents.js';

let ALL = null, ALLG = null, LISTS = null, ENTRIES = null, cur = HALL;
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

/** Room entries (public/data/room-words.json, scripts/build-room-words.mjs): [word, pos, definition, difficulty, translations, hint|0]
 *  per room. The definition is the sense that belongs to the room ("calculus" as maths, not "Calculation"), and the list
 *  holds on-topic words the main list leaves out. Pool-shaped words are built once per room and cached. */
const BUILT = {};
export function setRoomEntries(rooms) { ENTRIES = rooms && typeof rooms === 'object' ? rooms : null; for (const k in BUILT) delete BUILT[k]; }
export function roomEntries(id) {
  if (!ENTRIES || !Array.isArray(ENTRIES[id])) return null;
  return BUILT[id] ||= ENTRIES[id].map(([w, pos, def, d, t, hint]) => {
    const o = {id: hashStr('w:' + w), w, pos, d: effectiveDifficulty(d, t), def, hint: hint || null, concepts: [], opp: '', curated: false};
    if (!o.hint) o.hint = templateHint(o);
    return o;
  });
}

/** Narrows WORDS to room `id` (or restores every word for the Reading Room). Returns the pool size. */
export function applyRoomPool(id) {
  if (!ALL) captureFullPool();
  const list = id === HALL ? null : roomList(id);
  const set = list ? new Set(list) : null;
  let next = set ? ALL.filter(w => set.has(w.w)) : ALL;
  const own = id === HALL ? null : roomEntries(id);
  if (own && own.length) { // the room's own sense of each word wins over the main list's, except hand-written curated entries
    const m = new Map(next.map(w => [w.w, w]));
    for (const e of own) if (!m.get(e.w)?.curated) m.set(e.w, e);
    next = [...m.values()].sort((a, b) => a.w < b.w ? -1 : a.w > b.w ? 1 : 0);
  }
  if (set && next.length < MIN_ROOM_WORDS) next = ALL;
  cur = next === ALL ? HALL : id;
  WORDS.length = 0; WORDS.push(...next);
  GHOSTS.length = 0; if (cur === HALL) GHOSTS.push(...ALLG);
  return WORDS.length;
}
/** Prefix for the Daily seed: '' in the Reading Room (unchanged dailies), 'history-' and so on in topic rooms. */
export const roomSeed = () => (cur === HALL ? '' : cur + '-');

let loading = null;
export function loadRoomLists(url = dataUrl('rooms.json'), entriesUrl = dataUrl('room-words.json')) {
  return loading ||= (async () => {
    // Both files at once (they used to be fetched one after the other, doubling the wait on a slow connection).
    const entries = fetch(entriesUrl).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    entries.catch(() => {}); // handled below; keeps a failure from being reported as unhandled while the lists load
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); setRoomLists((await r.json()).rooms); clearState('rooms-unavailable'); }
    catch (e) { console.warn('Topic room lists unavailable:', e); reportState('rooms-unavailable', {retry: retryRoomLists}); return false; }
    try { setRoomEntries((await entries).rooms); }
    catch (e) { console.warn('Topic room entries unavailable (using the main definitions):', e); }
    return true;
  })();
}

/** Forgets a failed attempt and asks for the room lists again (see loadRoomLists). */
export function retryRoomLists() {
  loading = null;
  return loadRoomLists();
}
