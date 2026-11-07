/* The weekly themed challenge inside the Daily book: a cover section ("This week's theme") and a leaf after the calendar that
   lists the week's seven words, one per day. Pure string builders (no DOM); styles in weekly.css. Days follow the Daily's rules:
   today's word stays sealed until it is answered, a past day that was not answered shows its word as missed. Data comes from
   src/core/weekly.js. The buttons use data-act="weekly", which the Daily book hands to BOOK_ACTS.weekly (app/home.js). */
import {esc} from './bookpages.js';
import {shortDate} from '../core/dates.js';
import {weekRows, weeklyDraft, WEEK_DAYS} from '../core/weekly.js';
import {TIERS} from '../core/tiers.js';

const tierName = t => (TIERS[t] || TIERS[0]).name;
const tierColor = t => (TIERS[t] || TIERS[0]).spine;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Pips for the week: one per day, filled in tier ink when answered, a hollow ring when missed, a dashed one when still open. */
function pips(rows) {
  return `<span class="wk-pips" aria-hidden="true">${rows.map(r => {
    if (r.state === 'played') return `<i class="on" style="--tc:${tierColor(r.rec.tier)}"></i>`;
    if (r.state === 'missed') return '<i class="miss"></i>';
    if (r.state === 'today') return '<i class="now"></i>';
    return '<i></i>';
  }).join('')}</span>`;
}

/** The cover's entry to the weekly theme: one short section that turns to the weekly leaves (`spread` is their spread index in the
 *  Daily book). The cover is already full on a phone, so this stays to two lines. Empty when the library has no words for the week. */
export function weeklyCoverSection(S, today, pool, spread = 1) {
  const wk = weekRows(S, today, pool);
  if (!wk.theme) return '';
  return `<section class="dly-sec wk-cover" aria-label="${esc(wk.theme.title)}"><h2>${esc(wk.theme.title)}</h2>
   <p class="dly-line"><b>${wk.played}</b> of ${WEEK_DAYS} days answered this week.</p>
   <button class="dly-go pen-ink" data-spread="${spread}">Open the week</button></section>`;
}

/** One day of the week: its word and definition in full (no cut-off), its room, and its score or state. */
function dayRow(r, i) {
  const dn = `<span class="wk-dn">${DAY_NAMES[i]}<small>${esc(shortDate(r.key).split(' ').slice(1).join(' '))}</small></span>`;
  if (r.state === 'played') return `<li class="wk-day played">${dn}<div class="wk-main"><div class="wk-top"><span class="w">${esc(r.w)}</span>${r.pos ? `<small>${esc(r.pos)}</small>` : ''}<span class="room">${esc(r.room)}</span><span class="wk-st"><i class="dot" style="background:${tierColor(r.rec.tier)}"></i><b>${r.rec.score}</b> <span>${esc(tierName(r.rec.tier))}</span></span></div><div class="d">${esc(r.def)}</div></div></li>`;
  if (r.state === 'missed') return `<li class="wk-day missed">${dn}<div class="wk-main"><div class="wk-top"><span class="w">${esc(r.w)}</span>${r.pos ? `<small>${esc(r.pos)}</small>` : ''}<span class="room">${esc(r.room)}</span><span class="wk-st"><span>Missed</span></span></div><div class="d">${esc(r.def)}</div></div></li>`;
  const sealed = r.state === 'today' ? 'Open today' : 'Sealed';
  return `<li class="wk-day ${r.state}">${dn}<div class="wk-main"><div class="wk-top"><span class="w">· · · · ·</span><span class="wk-st"><span>${sealed}</span></span></div><div class="d">${r.state === 'today' ? 'Sealed until you answer it.' : 'Waiting for its day.'}</div></div></li>`;
}

/** The weekly theme as two leaves: Monday to Wednesday with the theme and the week's pips, then Thursday to Sunday with the
 *  button and a note. Each day keeps its full definition, so nothing is cut off. */
export function weeklyLeaves(S, today, pool) {
  const wk = weekRows(S, today, pool);
  if (!wk.theme) return [
    `<div class="dly wk"><h1>Themed week</h1><p class="dly-empty">This week has no theme yet. Its words are drawn from the library, so one will show once the list has enough.</p></div>`,
    `<div class="dly wk"><p class="dly-empty">Nothing to answer this week yet.</p></div>`];
  const {theme, rows} = wk;
  const todayRow = rows.find(r => r.today);
  const answered = !!(todayRow && todayRow.state === 'played');
  const drafting = !answered && weeklyDraft(S, today) != null; // an answer was started and not sent: a reload resumes it
  const first = `<div class="dly wk"><div class="kicker">Themed week · ${esc(shortDate(rows[0].key))} to ${esc(shortDate(rows[6].key))}</div>
   <h1>${esc(theme.title)}</h1><p class="wk-motto">${esc(theme.motto)}</p>
   <p class="wk-prog"><span><b>${wk.played}</b> of ${WEEK_DAYS} days answered</span>${pips(rows)}</p>
   <button class="dly-act pen-ink" data-act="weekly">${answered ? 'See today’s word' : drafting ? 'Continue today’s word' : 'Descend into today’s word'}</button>
   <ol class="wk-days">${rows.slice(0, 3).map((r, i) => dayRow(r, i)).join('')}</ol></div>`;
  const second = `<div class="dly wk"><div class="kicker">${esc(theme.title)} · continued</div>
   <ol class="wk-days">${rows.slice(3).map((r, i) => dayRow(r, i + 3)).join('')}</ol>
   <p class="wk-note">Monday is the gentlest word of the week and Sunday the hardest. A day you miss stays open to read.</p></div>`;
  return [first, second];
}
