/* Topic rooms on the home screen (TR2): the room's fire colour and name, the ring of room lights under the title, and on
   wide screens the two side doors to the rooms before and after this one in the ring (src/core/rooms.js order).
   Phones and narrow windows switch rooms from the Rooms book instead (src/ui/roomLedger.js); there the ring of lights
   opens that book. Called after every home render (src/app/home.js) with go(id, dir) doing the walk (src/app/roomGo.js). */
import {ROOMS, HALL, roomById, neighbours, rgbOf} from '../core/rooms.js';
import {typewrite} from './typewrite.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const DOOR_MIN_W = 1000, DOOR_MIN_GAP = 124;
const ink = r => (r.ink || r.rgb).join(',');

/** Room colours on <html>: the hearth's live fire, the room light and every room-tinted label read these. */
let hallT = 0;
export function paintRoomVars(room, root = document.documentElement, {settle = false} = {}) {
  const r = roomById(room);
  clearTimeout(hallT);
  /* the colours are registered properties (roomHome.css) so they glide; going back to the Reading Room keeps the
     room's tint rules on until the glide has finished, then drops them */
  if (r.id !== HALL) root.dataset.room = r.id;
  else if (settle && root.dataset.room) hallT = setTimeout(() => { delete root.dataset.room; }, 700);
  else delete root.dataset.room;
  root.style.setProperty('--rm-hue', r.hue + 'deg');
  root.style.setProperty('--rm-sat', String(r.sat || 1));
  root.style.setProperty('--rm-rgb', rgbOf(r));
  root.style.setProperty('--rm-ink', ink(r));
}

/** Markup of the ring of room lights: every room in ring order, this one lit. Pure, for tests. */
export function ringHTML(cur) {
  return ROOMS.map(r => `<button type="button" class="rm-dot${r.id === cur ? ' on' : ''}" data-room="${r.id}" style="--c:${rgbOf(r)}" title="${esc(r.name)}${r.id === cur ? ' (you are here)' : ''}" aria-label="${esc(r.name)}${r.id === cur ? ', you are here' : ''}"${r.id === cur ? ' aria-current="true"' : ''}></button>`).join('');
}
/** One side door: the neighbour's fire through the arch, its name on the plate, and which way it lies. */
export function doorHTML(r, side, met = '') {
  const m = /(\d+) of (\d+)/.exec(met), f = m && +m[2] ? Math.min(1, +m[1] / +m[2]).toFixed(3) : 0; // TA7a: the swatch fills with how much of the room you have met
  return `<button type="button" class="rm-door rm-${side}" data-room="${r.id}" style="--c:${rgbOf(r)};--ci:${ink(r)}" aria-label="${side === 'prev' ? 'Previous' : 'Next'} room: ${esc(r.name)}, ${esc(r.topic)}" title="${esc(r.name)} (${side === 'prev' ? '[' : ']'})">
 <span class="rm-plate"><b><span class="rm-sw" style="--f:${f}" aria-hidden="true"></span>${esc(r.name)}</b><small>${esc(r.topic)}</small>${met ? `<small class="rm-met">${esc(met)}</small>` : ''}</span>
 <span class="rm-arch" aria-hidden="true"><i class="rm-fire"></i><i class="rm-lamp"></i><i class="rm-boards"></i><i class="rm-leaf"></i><i class="rm-arrow">${side === 'prev' ? '‹' : '›'}</i></span>
 <span class="rm-spill" aria-hidden="true"></span></button>`;
}

/** The next mount (the home redrawn after a walk to another room) types the room's lines instead of just showing them. */
let typeNext = false;
function patchDoor(el, r, side) {
  const t = document.createElement('div'); t.innerHTML = doorHTML(r, side);
  const n = t.firstElementChild;
  el.classList.remove('go'); el.dataset.room = r.id;
  el.setAttribute('aria-label', n.getAttribute('aria-label')); el.title = n.title;
  el.style.setProperty('--c', rgbOf(r)); el.style.setProperty('--ci', ink(r));
  const a = el.querySelector('.rm-plate'), b = n.querySelector('.rm-plate');
  if (a && b && a.innerHTML !== b.innerHTML) a.innerHTML = b.innerHTML;
}
export const typeOnNextMount = () => { typeNext = true; };

let doors = null, keysOn = false, resizeOn = false, goFn = null, curRoom = HALL;
const homeEl = () => document.getElementById('home');
const homeIdle = () => {
  const h = homeEl();
  return h && !h.hidden && !h.classList.contains('book-opening') && !document.querySelector('.bk-spread') &&
    (document.getElementById('cardlayer') || {}).hidden !== false && !document.body.classList.contains('browsing');
};

function placeDoors() {
  const h = homeEl(); if (!doors || !h) return;
  const b = h.getBoundingClientRect(), gap = Math.min(b.left, innerWidth - b.right);
  const show = innerWidth >= DOOR_MIN_W && gap >= DOOR_MIN_GAP && !h.hidden;
  doors.hidden = !show; if (!show) return;
  const dw = Math.round(Math.min(132, Math.max(84, gap * .5))), dh = Math.round(dw * 1.82);
  const top = Math.round(Math.min(b.bottom - dh - 18, b.top + b.height * .5 - dh * .36));
  doors.style.cssText = `--gap:${Math.round(gap)}px;--dw:${dw}px;--dh:${dh}px;--dt:${Math.max(64, top)}px;--dl:${Math.round((b.left - dw) / 2)}px;--dr:${Math.round((innerWidth - b.right - dw) / 2)}px`;
}

/** Paint the room into a freshly rendered home: colours, title, ring, doors. go(id, dir) walks to another room. */
export function mountRoomHome(home, {room = HALL, go = () => {}, openLedger = () => {}, met = () => ''} = {}) {
  if (!home || typeof document === 'undefined') return;
  const r = roomById(room); curRoom = r.id; goFn = go;
  paintRoomVars(r.id);
  const tl = home.querySelector('.hz-title .tagline');
  if (tl && r.id !== HALL) tl.innerHTML = `<span class="rm-name">${esc(r.name)}</span> <em>· ${esc(r.motto)}</em>${met(r.id) ? ` <small class="rm-met">${esc(met(r.id))}</small>` : ''}`;
  const tag = home.querySelector('.daily-tag');
  if (tag && r.id !== HALL) tag.textContent = `${r.topic} · ${tag.textContent}`;
  if (typeNext) { typeNext = false; typewrite(tl, {delay: 60}); typewrite(tag, {delay: 140}); }
  /* the ring of room lights: where you are among all of them; on phones it opens the Rooms book */
  const title = home.querySelector('.hz-title');
  if (title) {
    const ring = document.createElement('nav'); ring.className = 'rm-ring'; ring.setAttribute('aria-label', 'Rooms');
    ring.innerHTML = ringHTML(r.id);
    ring.addEventListener('click', e => {
      const d = e.target.closest('.rm-dot'); if (!d) return;
      if (!doors || doors.hidden) return openLedger(d.dataset.room);
      if (d.dataset.room !== curRoom) go(d.dataset.room);
    });
    title.appendChild(ring);
  }
  /* side doors live outside #home (it scrolls and would clip them) and hide with it (#210: nothing behind an open book) */
  if (!doors || !doors.isConnected) {
    doors = document.createElement('div'); doors.id = 'rm-doors'; doors.hidden = true;
    doors.addEventListener('click', e => { const d = e.target.closest('.rm-door'); if (d && homeIdle()) { d.classList.add('go'); goFn(d.dataset.room, d.classList.contains('rm-prev') ? -1 : 1); } });
    document.body.appendChild(doors);
  }
  const {prev, next} = neighbours(r.id);
  doors.innerHTML = doorHTML(prev, 'prev', met(prev.id)) + doorHTML(next, 'next', met(next.id));
  placeDoors();
  requestAnimationFrame(placeDoors); // after the hearth has laid the room out
  if (!resizeOn) { resizeOn = true; addEventListener('resize', () => requestAnimationFrame(placeDoors));
    /* the home's own box settles after mount (fonts, entrance, reduced motion): re-place whenever it changes size */
    if (typeof ResizeObserver !== 'undefined' && homeEl()) new ResizeObserver(() => requestAnimationFrame(placeDoors)).observe(homeEl()); }
  if (!keysOn) {
    keysOn = true;
    addEventListener('keydown', e => {
      if ((e.key !== '[' && e.key !== ']') || e.ctrlKey || e.metaKey || e.altKey || !homeIdle()) return;
      if (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
      const n = neighbours(curRoom); e.preventDefault();
      const dr = doors && !doors.hidden && doors.querySelector(e.key === '[' ? '.rm-prev' : '.rm-next'); if (dr) dr.classList.add('go');
      goFn(e.key === '[' ? n.prev.id : n.next.id, e.key === '[' ? -1 : 1);
    });
  }
}
