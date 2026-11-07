/* The toast for newly earned stamps (TA5, restyled as an inked slip): a stamp is pressed onto an aged slip of paper, one
   section per stamp, with the room's progress as a row of pips. The slip lands open, folds to an inked tab after a few
   seconds (so the page under it, a duel result or a margin note, stays readable), and a tap opens it again. Stamps that
   land while the slip is up join it, so nothing is replaced. The markup builders and the stacking rule are pure and
   tested; the DOM part only shows them. Styles live in stamps.css. */
import {esc} from './bookpages.js';
import {ROOMS, rgbOf} from '../core/rooms.js';

const ROOM_GLYPH = {first: '✦', quarter: '¼', half: '½', mastered: '★', week: '7', perfect: '✓'};
const LIBRARY_GLYPH = {doors: '⌂', shelves: '❀', week: '7', hundred: '100', seal: '✪', theme: '❦', nemesis: '⚑'};
const LIBRARY_RGB = '205,172,103';
export const FOLD_MS = 5200;   // the slip stays open this long, then folds to the tab
export const HIDE_MS = 12000;  // the tab goes after this
const FIRST_MS = 180, STEP_MS = 120; // each new stamp presses on a little after the one before it

const keyOf = id => String(id).split('.')[1] || '';
const glyphFor = s => (s.room ? ROOM_GLYPH : LIBRARY_GLYPH)[keyOf(s.id)] || '';

/** The progress row under a stamp: pips for the room's (or the library's) stamps, lit for each one earned. {n, total} or none. */
function progressHTML(of) {
  if (!of || !(of.total > 0)) return '';
  const pips = Array.from({length: of.total}, (_, k) => `<i${k < of.n ? ' class="on"' : ''}></i>`).join('');
  return `<span class="stp-prog"><span class="stp-pips" aria-hidden="true">${pips}</span><span class="stp-count">${of.n} of ${of.total}</span></span>`;
}

/** The slip's markup for a list of stamps [{id, room, name, hint, of?}] (as recordStamps returns them). `from` is the first
 *  entry still to land: the ones before it are already on the slip and sit still. */
export function stampToastHTML(list, from = 0) {
  const entries = list.map((s, i) => {
    const r = s.room ? ROOMS.find(x => x.id === s.room) : null;
    const where = r ? r.short : 'The library';
    const color = r ? rgbOf(r) : LIBRARY_RGB;
    const seen = i < from ? ' data-seen' : '';
    const delay = Math.max(0, i - from) * STEP_MS + FIRST_MS;
    return `<div class="stp-entry"${seen} style="--c:${color};--d:${delay}ms">`
      + `<span class="stp-mark${r ? '' : ' lib'}" role="img" aria-label="${esc(s.name)} stamp"><i>${esc(glyphFor(s))}</i></span>`
      + `<div class="stp-text"><b class="stp-name">${esc(s.name)}</b><small class="stp-where">${esc(where)}</small><em class="stp-hint">${esc(s.hint)}</em>${progressHTML(s.of)}</div></div>`;
  }).join('');
  const head = list.length > 1 ? `${list.length} stamps earned` : 'Stamp earned';
  return `<div class="stp-head"><span>${esc(head)}</span></div>${entries}<div class="stp-foot"><span>Kept in the Almanac</span><span>Rooms › Stamps</span></div>`;
}

/** The whole inside of the toast: the tab (its count) and the slip. Shared by the live toast and the CI guard. */
export function stampToastInner(list, from = 0) {
  const n = list.length;
  return `<button type="button" class="stp-tab" aria-expanded="false" aria-label="${n} stamp${n > 1 ? 's' : ''} earned, show"><span>${n}</span></button>`
    + `<div class="stp-plaque">${stampToastHTML(list, from)}</div>`;
}

/** The stacking rule: a new batch joins a slip that is up (and the new ones are the only ones that press on), otherwise it
 *  starts a fresh slip. Returns the whole list and the index of the first new entry. */
export function stackStamps(current, incoming, showing) {
  const cur = showing && Array.isArray(current) ? current : [];
  return {all: cur.concat(incoming), from: cur.length};
}

let el = null, slip = [], foldT = 0, hideT = 0;

/** Shows the slip for the new stamps (nothing when the list is empty). */
export function toastStamps(list) {
  if (!list || !list.length || typeof document === 'undefined') return;
  if (!el) {
    el = document.createElement('div');
    el.id = 'stamptoast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    el.onclick = e => {
      if (e.target.closest && e.target.closest('.stp-tab')) return openSlip(true);
      if (el.classList.contains('open')) foldSlip();
    };
    el.onkeydown = e => { if (e.key === 'Escape' && el.classList.contains('open')) foldSlip(); };
  }
  const showing = el.classList.contains('on');
  const {all, from} = stackStamps(slip, list, showing);
  slip = all;
  el.innerHTML = stampToastInner(all, from);
  if (!showing) { el.classList.remove('open'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  openSlip(false);
  arm();
}

function setAria(open) {
  const tab = el.querySelector('.stp-tab');
  if (tab) tab.setAttribute('aria-expanded', String(open));
  el.tabIndex = open ? 0 : -1;
}
/** Opens the slip. A tap focuses it (so Escape folds it); the automatic landing does not steal focus from the game. */
function openSlip(byTap) {
  el.classList.add('open');
  setAria(true);
  if (byTap) { el.focus({preventScroll: true}); arm(); }
}
function foldSlip() {
  el.classList.remove('open');
  setAria(false);
}
/** (Re)starts the timers: the slip folds to the tab, and the tab goes. */
function arm() {
  clearTimeout(foldT); clearTimeout(hideT);
  foldT = setTimeout(foldSlip, FOLD_MS);
  hideT = setTimeout(() => { foldSlip(); el.classList.remove('on'); slip = []; }, HIDE_MS);
}
