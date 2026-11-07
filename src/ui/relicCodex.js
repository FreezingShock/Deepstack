import {fmtNum} from '../core/numFmt.js';
/* The Almanac's relic codex and descent history: two spreads after the curio pages. Every relic is a catalogue entry
   (greyed until a descent carries it; its first carry is written with the day, room and depth), and the history lists
   the recent Unlimited descents with their doors, relics and ending, plus the deepest descent kept in each room.
   Pure string builders over core/descentLog.js and core/descent.js (no DOM); styles in relicCodex.css under .rc / .dh.
   Loaded only from bookMenusLoad.js, so none of it is in the entry bundle. */
import {esc} from './bookpages.js';
import {RELICS, PATHS} from '../core/descent.js';
import {ROOMS, rgbOf, roomById} from '../core/rooms.js';
import {descentStore} from '../core/descentLog.js';

export const RECENT_SHOWN = 5;

/* One line drawing per relic, on a 48-unit grid. Strokes take currentColor, so the lost plate can grey them out. */
const ART = {
  index: '<path d="M11 13h26v24H11z"/><path d="M15 21h18M15 26h18M15 31h11"/><circle class="rc-fill" cx="24" cy="12" r="2.6"/>',
  wick: '<path d="M24 19v-6"/><path d="M18 23h12v15H18z"/><path class="rc-fill" d="M24 5c4 4.5 4.5 8.5 0 11-4.5-2.5-4-6.5 0-11z"/><path d="M12 38h24"/>',
  folio: '<path d="M14 7h20v34l-10-7-10 7z"/><text class="rc-x" x="24" y="25" text-anchor="middle">×2</text>'
};
export const relicArt = id => `<svg class="rc-art" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ART[id] || ''}</svg>`;

export const dayLabel = k => (/^\d{4}-\d{2}-\d{2}$/.test(k || '') ? new Date(k + 'T00:00:00Z').toLocaleDateString(undefined, {month: 'short', day: 'numeric', timeZone: 'UTC'}) : '');
const roomShort = id => roomById(id).short;
const roomChip = id => {
  const r = roomById(id);
  return `<span class="rc-room" style="--c:${rgbOf(r)}">${esc(r.short)}</span>`;
};
const doorLetters = ids => ids.map(id => (PATHS.find(p => p.id === id) || {}).letter).filter(Boolean).join(' · ');
const relicNames = ids => ids.map(id => (RELICS.find(r => r.id === id) || {}).name).filter(Boolean);

/** One relic as a catalogue entry. A relic not yet carried shows its plate greyed, its name and what it does, not its flavour line. */
function relicEntry(r, i, rec) {
  const found = !!rec;
  const prov = found
    ? `<p class="rc-prov">First carried ${esc(dayLabel(rec.day))} in ${roomChip(rec.room)}, at ${fmtNum(rec.ft)} ft.</p>`
    : '<p class="rc-prov">Not found yet. The curio shop offers it at a landing, two relics at a time.</p>';
  return `<article class="rc-entry ${found ? 'found' : 'lost'}" aria-label="${esc(r.name)}, ${found ? 'found' : 'not found yet'}">
   <div class="rc-plate">${relicArt(r.id)}<span class="rc-no">No. ${i + 1}</span></div>
   <div class="rc-body"><h3 class="rc-name">${esc(r.name)}</h3><p class="rc-fx">${esc(r.fx)}</p>${found ? `<p class="rc-line">${esc(r.line)}</p>` : ''}${prov}</div>
  </article>`;
}

/** The relic codex: two leaves, one spread. Left: the first two relics; right: the third and how relics work. */
export function relicCodexLeaves(S) {
  const st = descentStore(S);
  const found = RELICS.filter(r => st.relics[r.id]).length;
  const entries = RELICS.map((r, i) => relicEntry(r, i, st.relics[r.id]));
  const left = `<div class="alm rcx"><h1>The Relic Codex</h1><div class="kicker">${found === 0 ? 'None found yet' : `${found} of ${RELICS.length} found`}</div>${entries.slice(0, 2).join('')}</div>`;
  const right = `<div class="alm rcx"><h2>Kept for one descent</h2>${entries.slice(2).join('')}
   <p class="note">Relics are offered two at a time in the curio shop, and each lasts the descent it was kept for. A run that ends on a failed word takes them with it. The codex keeps the first day, room and depth you carried each one.</p></div>`;
  return [left, right];
}

/** One kept run, newest first: its depth, room, day, doors (letters), relics and how it ended. */
function runRow(run) {
  const ended = run.ended ? `Ended at word ${run.endedAt} of ${run.of}` : 'Held to the last word';
  const spare = run.spent ? ` · Spare breath used ${run.spent === 1 ? 'once' : run.spent + ' times'}` : '';
  const relics = relicNames(run.relics);
  return `<li class="dh-run ${run.ended ? 'fail' : 'held'}">
   <div class="dh-top"><b>${fmtNum(run.ft)} ft</b>${roomChip(run.room)}<time>${esc(dayLabel(run.day))}</time></div>
   <div class="dh-meta"><span>Doors ${esc(doorLetters(run.doors) || 'none')}</span><span>${esc(relics.length ? relics.join(' · ') : 'Nothing carried')}</span></div>
   <div class="dh-out">${esc(ended + spare)}</div>
  </li>`;
}

/** The descent history: two leaves, one spread. Left: personal bests per room; right: the recent runs. */
export function descentHistoryLeaves(S) {
  const st = descentStore(S);
  const runs = st.runs.slice().reverse();
  const rows = ROOMS.map(r => {
    const b = st.best[r.id];
    return `<tr class="${b ? '' : 'none'}"><td>${roomChip(r.id)}</td><td>${b ? fmtNum(b.ft) + ' ft' : '–'}</td><td>${b ? esc(dayLabel(b.day)) : ''}</td></tr>`;
  }).join('');
  const left = `<div class="alm rcx dh"><h1>Descents</h1><div class="kicker">${runs.length} ${runs.length === 1 ? 'run' : 'runs'} kept</div>
   <h2>Personal bests</h2>
   <table class="dh-t"><thead><tr><th>Room</th><th>Deepest</th><th>Day</th></tr></thead><tbody>${rows}</tbody></table>
   <p class="note">The deepest descent in each room, kept per room.</p></div>`;
  const list = runs.length
    ? `<ol class="dh-runs" aria-label="Recent descents">${runs.slice(0, RECENT_SHOWN).map(runRow).join('')}</ol>`
    : '<p class="empty hand">No descents yet.</p><p class="note">Reach a landing in an Unlimited run and each finished descent is written here, with its doors, relics and ending.</p>';
  const right = `<div class="alm rcx dh"><h2>Recent runs</h2>${list}
   <p class="note">Doors: A Hard room, B Rest alcove, C Curio shop.</p></div>`;
  return [left, right];
}
