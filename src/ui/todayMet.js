/* RA8: the Today card's "N of M met" line. The room's word list loads a moment after the home paints, so fill the
   line in once it is there (the Reading Room's count needs no list and is rendered with the card). */
import {loadRoomLists} from '../core/roomPool.js';
import {roomMetLabel} from '../core/roomDepth.js';
import {currentRoom} from '../core/roomStore.js';

export function fillTodayMet(S, doc = document) {
  const el = doc.querySelector('.cb-met');
  if (!el || !el.hidden) return;
  loadRoomLists().then(() => { const m = roomMetLabel(S, currentRoom(S)); if (m && el.isConnected) { el.textContent = m; el.hidden = false; } }).catch(() => {});
}
