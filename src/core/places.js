// Registry of places: the default descent today, zones and topic rooms tomorrow. A place is data:
// {id, name, sub, art (floor art key), words (word filter or null for the whole pool), unlock (rule or null), floors (extra floors)}.
// The picker, shelf bays and Almanac read floors from FLOORS, so a registered place's floors show up in all of them
// with no further code. The default place owns the six built-in floors and has no filter and no unlock rule.
import {FLOORS, FT} from './floors.js';

export const DEFAULT_PLACE = 'deepstack';
const BASE = FLOORS.length;

const place0 = {
  id: DEFAULT_PLACE, name: 'The Descent', sub: 'Every word, down the stacks', art: 'stacks',
  words: null, unlock: null, floors: FLOORS.slice(0, BASE)
};
const PLACES = [place0];

export const places = () => PLACES.slice();
export const placeById = id => PLACES.find(p => p.id === id) || place0;
export const placeOfFloor = f => PLACES.find(p => p.floors.some(x => x.id === (f && f.id !== undefined ? f.id : f))) || place0;

/* Unlock rules: null (always open), {depth:ft} (deepest reached), {words:n} (books on the shelf), or a function (S)=>bool. */
export function isUnlocked(p, S = {}) {
  const u = p.unlock;
  if (!u) return true;
  if (typeof u === 'function') return !!u(S);
  if (u.depth !== undefined && !((S.deepest | 0) >= u.depth)) return false;
  if (u.words !== undefined && !((S.shelf || []).length >= u.words)) return false;
  return true;
}
export const unlockedPlaces = S => PLACES.filter(p => isUnlocked(p, S));

/* The word pool of a place: its filter applied to `pool`; the default place returns the pool untouched. */
export const placeWords = (p, pool) => (p.words ? pool.filter(p.words) : pool);

/* Add a place. Its floors are appended to FLOORS below the deepest one, so every floor reader sees them. */
export function registerPlace(p) {
  if (PLACES.some(x => x.id === p.id)) throw new Error('place exists: ' + p.id);
  const floors = (p.floors || []).map(f => {
    const last = FLOORS[FLOORS.length - 1];
    const nf = {...f, id: FLOORS.length, row: f.row !== undefined ? f.row : last.row + 60};
    FLOORS.push(nf);
    return nf;
  });
  PLACES.push({words: null, unlock: null, art: 'stacks', sub: '', ...p, floors});
  return PLACES[PLACES.length - 1];
}
export function unregisterPlace(id) {
  const i = PLACES.findIndex(p => p.id === id);
  if (i < 1) return false; // the default place stays
  for (const f of PLACES[i].floors) { const k = FLOORS.indexOf(f); if (k >= BASE) FLOORS.splice(k, 1); }
  PLACES.splice(i, 1);
  FLOORS.forEach((f, k) => { f.id = k; });
  return true;
}
export {FT};
