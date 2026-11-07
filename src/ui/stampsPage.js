/* The Almanac's Stamps page (TA5, placement A): the Rooms book gets two leaves after the Rooms pages. Each topic room has a row
   with its six seals (earned in colour, unearned dashed), then a row for the library's four in gilt. Pure string builder: no
   DOM, styles in stamps.css. Data comes from src/core/stamps.js. */
import {esc} from './bookpages.js';
import {TOPIC_ROOMS, stampRows, stampTally} from '../core/stamps.js';
import {rgbOf} from '../core/rooms.js';

const ROOM_GLYPH = {first: '✦', quarter: '¼', half: '½', mastered: '★', week: '7', perfect: '✓'};
const LIBRARY_GLYPH = {doors: '⌂', shelves: '❀', week: '7', hundred: '100'};
const day = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});

/** One seal. `room` is a room id (its colour is set from the room) or null for the library's gilt seals. */
function seal(s, room) {
  const glyph = (room ? ROOM_GLYPH : LIBRARY_GLYPH)[s.key] || '';
  const when = s.earned ? (s.day ? `Earned ${day(s.day)}` : 'Earned') : 'Not yet';
  const label = `${s.name}. ${s.hint} ${when}.`;
  return `<span class="stp-seal ${s.earned ? 'on' : 'off'}${room ? '' : ' lib'}"${room ? ` style="--c:${room.rgb}"` : ''} role="img" aria-label="${esc(label)}" title="${esc(label)}"><i aria-hidden="true">${s.earned ? esc(glyph) : '·'}</i></span>`;
}

/** One row: a name, how many of its seals are earned, and the seals. `room` is {rgb} for a topic room, null for the library. */
function row(name, rows, room) {
  const n = rows.filter(x => x.earned).length;
  return `<section class="stp-row"><div class="stp-head"><span class="stp-name">${room ? `<i class="stp-dot" style="--c:${room.rgb}"></i>` : '<i class="stp-dot" style="--c:205,172,103"></i>'}${esc(name)}</span><b class="stp-n${n === rows.length ? ' all' : ''}">${n} of ${rows.length}</b></div>
   <div class="stp-set">${rows.map(s => seal(s, room)).join('')}</div></section>`;
}

/** The Stamps page as two leaves (a phone shows one page at a time, so the rooms are split across both). */
export function stampsLeaves(S) {
  const t = stampTally(S);
  const room = r => ({...r, rgb: rgbOf(r)});
  const rooms = TOPIC_ROOMS.map(r => row(r.short, stampRows(S, r.id), room(r)));
  const lib = row('The library', stampRows(S, null), null);
  const head = `<h1>Stamps</h1><div class="kicker stp-kick">${t.earned} of ${t.total} earned</div>`;
  const first = `<div class="alm stp-page">${head}
   <p class="note">Earned once, and kept. Each room has six. The last four are for the whole library.</p>${rooms.slice(0, 3).join('')}</div>`;
  const second = `<div class="alm stp-page">${rooms.slice(3).join('')}${lib}
   <p class="note">Each seal is labelled with how it is earned.</p></div>`;
  return [first, second];
}
