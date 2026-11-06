/* Per-room save data. Each topic room has its own Daily (S.daily, S.dailyRun, S.streak) and its own Unlimited rating
   (S.rating). Every reader keeps using those top-level fields: entering a room swaps them for that room's copy, and
   leaving swaps them back. On disk the top-level fields always hold the Reading Room's data (so older code and older
   saves read the same thing), the other rooms live in the additive field S.rooms = {id: {daily, dailyRun, rating,
   streak}}, and S.room is the room the player was last in. Pure: no DOM, no storage. */
import {HALL, isRoom} from './rooms.js';
import {loadRating} from './unlimited.js';

export const PER_ROOM = ['daily', 'dailyRun', 'rating', 'streak'];
const fresh = () => ({daily: {}, dailyRun: undefined, rating: loadRating(), streak: {last: '', n: 0}});
const tidy = b => {
  const o = b && typeof b === 'object' ? b : {};
  return {daily: o.daily && typeof o.daily === 'object' ? o.daily : {}, dailyRun: o.dailyRun || undefined, rating: loadRating(o.rating),
    streak: o.streak && typeof o.streak === 'object' ? o.streak : {last: '', n: 0}};
};
const hall = new WeakMap(); // S -> the Reading Room's fields while a topic room is active

const pick = S => Object.fromEntries(PER_ROOM.map(f => [f, S[f]]));
const put = (S, b) => { for (const f of PER_ROOM) { if (b[f] === undefined) delete S[f]; else S[f] = b[f]; } };

export const currentRoom = S => (S && isRoom(S.room) ? S.room : HALL);

/** Call once after loading a save: tidies S.rooms, adds the serializer and swaps in the last room's data. */
export function installRooms(S) {
  const rooms = S.rooms && typeof S.rooms === 'object' && !Array.isArray(S.rooms) ? S.rooms : {};
  S.rooms = Object.fromEntries(Object.entries(rooms).filter(([id]) => isRoom(id) && id !== HALL).map(([id, b]) => [id, tidy(b)]));
  if (!Object.prototype.hasOwnProperty.call(S, 'toJSON')) Object.defineProperty(S, 'toJSON', {enumerable: false, configurable: true, value: () => saveShape(S)});
  const id = currentRoom(S);
  S.room = HALL;
  if (id !== HALL) switchRoom(S, id);
  return S;
}

/** Moves the player to room `id`. Returns false when already there or the room is unknown. */
export function switchRoom(S, id) {
  const cur = currentRoom(S);
  if (!isRoom(id) || id === cur) return false;
  if (cur === HALL) hall.set(S, pick(S)); else S.rooms[cur] = pick(S);
  put(S, id === HALL ? (hall.get(S) || fresh()) : tidy(S.rooms[id] || fresh()));
  if (id === HALL) hall.delete(S);
  S.room = id;
  return true;
}

/** What goes to disk: the Reading Room's data at the top level, the active topic room's data back in S.rooms. */
export function saveShape(S) {
  const o = {...S}, cur = currentRoom(S);
  if (cur !== HALL) {
    const h = hall.get(S) || fresh();
    for (const f of PER_ROOM) { if (h[f] === undefined) delete o[f]; else o[f] = h[f]; }
    o.rooms = {...S.rooms, [cur]: pick(S)};
  }
  return o;
}

/** The Reading Room's data or a topic room's, whichever room is active (for the Room Ledger and per-room stats). */
export function roomData(S, id) {
  if (id === currentRoom(S)) return pick(S);
  if (id === HALL) return hall.get(S) || pick(S);
  return tidy(S.rooms && S.rooms[id]);
}
