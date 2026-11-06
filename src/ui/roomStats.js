/* Stats per room (TR8): two Almanac pages comparing the rooms. Each room keeps its own Daily, streak and Lexicon
   (src/core/roomStore.js), so the pages before these are the room you stand in; these set every room side by side.
   Pure string builder (no DOM), styles in roomHome.css under .rs. */
import {esc} from './bookpages.js';
import {ROOMS, rgbOf} from '../core/rooms.js';
import {currentRoom, roomData} from '../core/roomStore.js';
import {roomCounts} from '../core/shelfRooms.js';
import {setStatus} from '../sets/sets.js';

/** One row of numbers per room, in ring order. */
export function roomRows(S, {today, computeStats, lexicon = L => Math.round(L * 10)}) {
  const books = roomCounts(S.shelf), st = setStatus(S), cur = currentRoom(S);
  return ROOMS.map(r => {
    const d = roomData(S, r.id), rt = d.rating || {};
    const s = computeStats({daily: d.daily || {}, streak: d.streak, bestDepth: 0}, today);
    const sets = st.filter(x => x.room === r.id);
    return {r, here: r.id === cur, streak: s.streak, best: s.bestStreak, runs: s.runs, deepest: s.deepest, books: books[r.id],
      L: rt.placed ? rt.L : null, lex: rt.placed ? lexicon(rt.L) : null, sets: sets.filter(x => x.complete).length, setsOf: sets.length};
  });
}

export function roomStatsLeaves(S, ctx) {
  const rows = roomRows(S, ctx);
  const name = (x, here = false) => `<span class="rs-name"><i class="rl-dot" style="--c:${rgbOf(x.r)}"></i>${esc(x.r.short)}${x.here && here ? ' <em>(here)</em>' : ''}</span>`;
  const played = rows.filter(x => x.runs || x.lex !== null);
  const top = rows.filter(x => x.lex !== null).sort((a, b) => b.L - a.L)[0];
  const left = `<div class="alm rs"><h1>The Rooms</h1><div class="kicker">${played.length} of ${rows.length} rooms visited \u00b7 you are in ${esc((rows.find(x => x.here) || rows[0]).r.short)}</div>
   <p class="note">Every room keeps its own Daily and streak. The pages before this one are for the room you stand in.</p>
   <table class="rs-t"><thead><tr><th>Room</th><th title="Daily streak">Streak</th><th title="Dailies played">Dailies</th><th title="Deepest Daily">Deepest</th><th title="Books on your shelf">Books</th></tr></thead>
   <tbody>${rows.map(x => `<tr class="${x.here ? 'here' : ''}"><td>${name(x)}</td><td>${x.streak}</td><td>${x.runs}</td><td>${x.deepest ? x.deepest + ' ft' : '–'}</td><td>${x.books}</td></tr>`).join('')}</tbody></table></div>`;
  const right = `<div class="alm rs"><h1>Side by side</h1><div class="kicker">${top ? `Strongest: ${esc(top.r.name)}` : 'No room ranked yet'}</div>
   <h2>Lexicon and sets</h2><ul class="rs-bars">${rows.map(x => `<li class="${x.here ? 'here' : ''}" style="--c:${rgbOf(x.r)}">${name(x, false)}<span class="rs-bar">${x.lex !== null ? `<i style="width:${Math.round(x.L / 9.8 * 100)}%"></i>` : ''}</span><b>${x.lex !== null ? x.lex : 'unranked'}</b><small>${x.setsOf ? `${x.sets}/${x.setsOf} sets` : ''}</small></li>`).join('')}</ul>
   <p class="note">Sets are collected in their own rooms; any set word counts wherever you answer it.</p></div>`;
  return [left, right];
}
