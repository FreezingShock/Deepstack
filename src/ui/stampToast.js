/* The toast for a newly earned stamp (TA5): a small banner in the wax-seal look, a few seconds long, one line per stamp.
   Called with the list recordStamps() returns (src/core/stamps.js). The markup builder is pure and tested; the DOM part only
   shows it. Reduced motion: the banner fades but never moves (stamps.css). */
import {esc} from './bookpages.js';
import {ROOMS, rgbOf} from '../core/rooms.js';

const ROOM_GLYPH = {first: '✦', quarter: '¼', half: '½', mastered: '★', week: '7', perfect: '✓'};
const LIBRARY_GLYPH = {doors: '⌂', shelves: '❀', week: '7', hundred: '100'};

/** The toast's inner markup for a list of new stamps: [{id, room, name, hint}] as recordStamps returns them. */
export function stampToastHTML(list) {
  const key = id => id.split('.')[1];
  return list.map(s => {
    const r = s.room ? ROOMS.find(x => x.id === s.room) : null;
    const glyph = (r ? ROOM_GLYPH : LIBRARY_GLYPH)[key(s.id)] || '';
    const where = r ? r.short : 'The library';
    const style = r ? ` style="--c:${rgbOf(r)}"` : ' style="--c:205,172,103"';
    return `<div class="stp-tr"><span class="stp-seal on${r ? '' : ' lib'}"${style} aria-hidden="true"><i>${esc(glyph)}</i></span><span><b>Stamp earned: ${esc(s.name)}</b><small>${esc(where)} · ${esc(s.hint)}</small></span></div>`;
  }).join('');
}

let el = null, timer = 0;
/** Shows the toast for the new stamps (nothing when the list is empty). Replaces any toast still showing. */
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
  el.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('on'), 4600);
}
