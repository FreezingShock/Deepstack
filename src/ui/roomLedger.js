/* The Rooms book (Room Ledger, TR2/TR3): replaces the Sets spine. The first spread lists every room with its fire; then
   each room has a page (its fire, words, today's Daily, its Lexicon and its sets, with Enter) followed by its set pages.
   On phones this is how you change rooms; on wide screens the side doors do it too (roomHome.js). */
import {toSpreads} from './bookpages.js';
import {ROOMS, HALL, rgbOf} from '../core/rooms.js';
import {currentRoom, roomData} from '../core/roomStore.js';
import {roomList, loadRoomLists} from '../core/roomPool.js';
import {SETS, setStatus, bonusFt, MIN_SCORE} from '../sets/sets.js';
import {setPageHTML} from '../sets/pages.js';
import {roomMetLabel} from '../core/roomDepth.js';
import {BOOK_TIMING} from './bookOpenFx.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/** Pure page builder. ctx: {today, lexicon(L), words(id) -> count or 0}. Returns {leaves, at: {room: leafIndex}}. */
export function roomLeaves(S, {today = '', lexicon = () => '', words = () => 0, met = () => ''} = {}) {
  const cur = currentRoom(S), st = setStatus(S), got = (S.sets && S.sets.got) || {};
  const ofRoom = id => st.map((s, i) => ({s, i})).filter(x => x.s.room === id);
  const tally = id => ofRoom(id).reduce((a, {s}) => [a[0] + (s.complete ? 1 : 0), a[1] + 1], [0, 0]);
  const done = st.filter(s => s.complete).length, bonus = bonusFt(S);
  const at = {}, leaves = [];
  const shelfWords = new Set(((S && S.shelf) || []).filter(b => b && !b.skipped).map(b => b.w)).size;
  /* RA5: every row says how much of the room you have met ("47 of 118 met") and its swatch fills to match, as on the
     door plates; until a room's word list has loaded it falls back to the sets tally. */
  const toc = ROOMS.map(r => {
    const [d, n] = tally(r.id), m = r.id === HALL ? '' : met(r.id), mm = /(\d+) of (\d+)/.exec(m);
    const f = mm && +mm[2] ? Math.min(1, +mm[1] / +mm[2]).toFixed(3) : 0;
    const right = r.id === HALL ? `${shelfWords} ${shelfWords === 1 ? 'word' : 'words'} met` : m || `${d}/${n} sets`;
    const sf = n ? (d / n).toFixed(3) : 0, tip = `${right}${r.id === HALL ? '' : `, ${d} of ${n} sets complete`}`;
    return `<li class="${r.id === cur ? 'here' : ''}" data-room="${r.id}" style="--c:${rgbOf(r)}" title="${esc(tip)}"><span><i class="rl-dot${r.id === HALL ? ' nosets' : ''}" style="--f:${r.id === HALL ? (shelfWords ? 1 : 0) : f};--s:${sf}" aria-hidden="true"></i>${esc(r.name)}${r.id === cur ? ' (here)' : ''}</span><b>${esc(right)}</b></li>`;
  }).join('');
  leaves.push(`<h1>Room ledger</h1><div class="kicker">${ROOMS.length} rooms · ${ROOMS.length} fires</div>
   <p class="note">Every room keeps its own words, its own Daily, its own Lexicon and its own sets. Your shelf and stats come with you.</p>
   <h2>Rooms</h2><ul class="toc rl-toc">${toc}</ul>
   <p class="note">${done} of ${SETS.length} sets complete${bonus ? ` · +${bonus} ft bonus depth` : ''}. A set word answered at ${MIN_SCORE}/100 or better counts in any room.</p>`);
  const page = r => {
    const data = roomData(S, r.id), rt = data.rating || {}, played = !!(data.daily && data.daily[today]);
    const sets = ofRoom(r.id), n = words(r.id);
    const facts = [r.id === HALL ? 'Every word in the game' : met(r.id) || (n ? `${n} words on the shelves` : ''), played ? 'Today’s Daily: done' : 'Today’s Daily: open',
      rt.placed ? `Lexicon ${esc(lexicon(rt.L))}` : 'Unlimited: not yet ranked'].filter(Boolean);
    return `<div class="setpage rl-room" style="--c:${rgbOf(r)}"><div class="kicker">${esc(r.topic)}${r.id === HALL ? '' : ' room'} · ${esc(r.salt)} fire</div><h1>${esc(r.name)}</h1>
     <p class="note">${esc(r.blurb)}</p><div class="rl-fire" aria-hidden="true"></div>
     <div class="rl-facts">${facts.map(f => `<span>${f}</span>`).join('')}</div>
     ${sets.length ? `<h2>Sets</h2><ul class="rl-sets">${sets.map(({s}) => `<li class="${s.complete ? 'done' : ''}"><span>${esc(s.name)}</span><b>${s.n}/${s.total}</b></li>`).join('')}</ul>`
       : `<p class="note">No sets here: they live in the topic rooms, and every set word still counts when it comes up in this room.</p>`}
     ${r.id === cur ? `<p class="rl-here">You are here.</p>` : `<div class="pg-actions rl-enter"><button class="bs-start bs-primary pen-ink" data-room="${r.id}">Enter ${esc(r.name)}</button></div>`}</div>`;
  };
  at[HALL] = leaves.length; leaves.push(page(ROOMS[0]));
  for (const r of ROOMS.slice(1)) {
    if (leaves.length % 2) leaves.push(''); // each room opens on a left page
    at[r.id] = leaves.length; leaves.push(page(r));
    for (const {s, i} of ofRoom(r.id)) leaves.push(setPageHTML(s, i, got).replace('<div class="kicker">Set</div>', `<div class="kicker">${esc(r.short)} · set</div>`));
  }
  return {leaves, at};
}

/** Registry entry for home.js BOOK_PAGES. go(id) walks to the room once the book has closed. */
export function roomsBook(S, {go = () => {}, today = () => '', lexicon = () => ''} = {}) {
  let spreads = [], at = {}, refreshing = false;
  const words = id => (roomList(id) || []).length;
  if (typeof setTimeout === 'function') setTimeout(() => loadRoomLists(), 3000); // word counts for the room pages
  const book = {
    label: 'Room ledger',
    spreads() { const r = roomLeaves(S, {today: today(), lexicon, words, met: id => roomMetLabel(S, id)}); at = r.at; spreads = toSpreads(r.leaves); return spreads; },
    onPaint(sp, api) {
      if (!roomList('science') && !refreshing) { refreshing = true; loadRoomLists().then(() => { if (roomList('science')) api.setSpreads(book.spreads(), api.index); }).catch(() => {}); }
      sp.querySelectorAll('.rl-toc li[data-room]').forEach(li => { li.onclick = () => { const p = at[li.dataset.room] || 0, j = Math.floor(p / 2); api.setSpreads(spreads, j, undefined, p % 2 ? 'r' : 'l'); }; });
      sp.querySelectorAll('.rl-enter [data-room]').forEach(b => {
        b.onclick = () => { const id = b.dataset.room; api.close(); setTimeout(() => go(id), BOOK_TIMING.shutHold + BOOK_TIMING.flyBack + 60); };
      });
    },
  };
  return book;
}
