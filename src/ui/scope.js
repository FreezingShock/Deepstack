/* Which numbers belong to the room you stand in and which cover the whole library. One place so the top bar, the
   Librarian's Card and the Almanac all say the same thing.
   This room: Daily streak, Dailies played, Lexicon (each room keeps its own, src/core/roomStore.js).
   All rooms: Deepest descent, Books on the shelf, Depths cross-section, floor reached. */
import {roomById, rgbOf} from '../core/rooms.js';
import {currentRoom} from '../core/roomStore.js';

export const ALL = 'all rooms';

/** {id, name, short, rgb} for the room the player is in (the Reading Room when S has no room). */
export function scopeRoom(S) {
  const r = roomById(currentRoom(S));
  return {id: r.id, name: r.name, short: r.short, rgb: rgbOf(r)};
}

const e = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** Small tag for a number that belongs to one room: a dot in the room's colour and its name. */
export const roomTag = room => `<span class="scope scope-room"><i class="rl-dot" style="--c:${e(room.rgb)}"></i>${e(room.short)}</span>`;
/** Small tag for a number that covers every room. */
export const allTag = () => `<span class="scope scope-all">${ALL}</span>`;
