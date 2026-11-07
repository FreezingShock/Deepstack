/* The toast for a newly earned stamp (TA5): a brass plaque in the Almanac's wax-seal look, sectioned into a head, one entry
   per stamp and a foot. It drops in, each seal presses in, and a light crosses it once (stamps.css). Called with the list
   recordStamps() returns (src/core/stamps.js). The markup builder is pure and tested; the DOM part only shows it. */
import {esc} from './bookpages.js';
import {ROOMS, rgbOf} from '../core/rooms.js';

const ROOM_GLYPH = {first: '✦', quarter: '¼', half: '½', mastered: '★', week: '7', perfect: '✓'};
const LIBRARY_GLYPH = {doors: '⌂', shelves: '❀', week: '7', hundred: '100'};

/** The plaque's markup for a list of new stamps: [{id, room, name, hint}] as recordStamps returns them. A head names what
 *  happened, one section per stamp (its seal presses in, staggered), and a foot line says where it is kept. */
export function stampToastHTML(list) {
  const key = id => id.split('.')[1];
  const entries = list.map((s, i) => {
    const r = s.room ? ROOMS.find(x => x.id === s.room) : null;
    const glyph = (r ? ROOM_GLYPH : LIBRARY_GLYPH)[key(s.id)] || '';
    const where = r ? r.short : 'The library';
    const color = r ? rgbOf(r) : '205,172,103';
    return `<div class="stp-entry"><span class="stp-seal on${r ? '' : ' lib'}" style="--c:${color};--d:${180 + i * 160}ms" aria-hidden="true"><i>${esc(glyph)}</i></span>`
      + `<div class="stp-text"><b class="stp-name">${esc(s.name)}</b><small class="stp-where">${esc(where)}</small><em class="stp-hint">${esc(s.hint)}</em></div></div>`;
  }).join('');
  const head = list.length > 1 ? `${list.length} stamps earned` : 'Stamp earned';
  return `<div class="stp-head"><span>${esc(head)}</span></div>${entries}<div class="stp-foot"><span>Kept in the Almanac</span><span>Rooms \u203a Stamps</span></div>`;
}

let el = null, timer = 0;
/** Shows the plaque for the new stamps (nothing when the list is empty). A plaque still showing is replaced and its timer restarted. */
export function toastStamps(list) {
  if (!list || !list.length || typeof document === 'undefined') return;
  if (!el) {
    el = document.createElement('div');
    el.id = 'stamptoast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = stampToastHTML(list);
  const set = document.getElementById('settoast'); // the set toast sits in the same place; stack under it while both show
  el.style.top = set && set.classList.contains('on') ? '112px' : '';
  el.classList.remove('on');
  void el.offsetWidth; // restart the drop and the sheen when a second stamp lands before the first has gone
  el.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('on'), 5000);
}
