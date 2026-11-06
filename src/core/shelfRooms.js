/* Shelf room tabs (TR7): every book earned in a topic room carries `room` (src/app/run.js); books without one were
   earned in the Reading Room. Registers the `room` filter with filterShelf and counts books per room. */
import {EXTRA_FILTERS} from './shelf.js';
import {ROOMS, HALL} from './rooms.js';

export const bookRoom = b => (b && typeof b.room === 'string' && ROOMS.some(r => r.id === b.room) ? b.room : HALL);
EXTRA_FILTERS.room = (x, {room}) => bookRoom(x.b) === room;
/** {roomId: number of books} for every room, in ring order. */
export function roomCounts(shelf) {
  const out = Object.fromEntries(ROOMS.map(r => [r.id, 0]));
  for (const b of shelf || []) out[bookRoom(b)]++;
  return out;
}
