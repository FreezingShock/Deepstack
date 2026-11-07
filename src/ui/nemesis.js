/* The Nemesis poster on the Almanac's Closeness leaf: a wanted poster for this week's rematch word, with its state (open to
   face, captured, or lost and wanted again). Pure string builder (no DOM); styles in nemesis.css under .bk-spread.menu .nm.
   The button carries class nm-go; bookMenusLoad.js starts the duel (BOOK_ACTS.nemesis, set in app/home.js) after the book closes. */
import {esc} from './bookpages.js';
import {ROOMS} from '../core/rooms.js';
import {TIERS} from '../core/tiers.js';
import {weekStartOf} from '../core/weekly.js';
import {pinNemesis, duelState, nemesisOf, BEAT_SCORE} from '../core/nemesis.js';

const fmtWeek = k => new Date(k + 'T00:00:00Z').toLocaleDateString(undefined, {month: 'short', day: 'numeric', timeZone: 'UTC'});
const roomShort = id => ((ROOMS.find(r => r.id === id) || {}).name) || 'the library';

/** The poster for `today`'s week. Pins the week's word on first look (so the same word stays all week). Empty pool or no answers: a quiet note. */
export function nemesisPoster(S, today, pool) {
  const wk = weekStartOf(today);
  pinNemesis(S, wk, pool);
  const r = nemesisOf(S, wk), st = duelState(S, wk);
  if (!r) return `<section class="nm nm-none" aria-label="Nemesis"><h2>Wanted</h2><p class="empty hand">Nothing is wanted this week. Answer a few words, and the one you miss most is posted here.</p></section>`;
  const tries = r.n === 1 ? 'try' : 'tries';
  const meta = `<p class="nm-meta">Missed <b>${r.n}</b> ${tries} · closeness <b>${r.avg}</b> · ${esc(roomShort(r.room))}</p>`;
  const duel = r.duel ? (TIERS[r.duel.tier] || TIERS[0]) : null;
  let act = '';
  if (st === 'open') act = `<button class="nm-go pen-ink" type="button">Face it this week</button><p class="nm-note">One swing a week. Folio (${BEAT_SCORE}+) takes it.</p>`;
  else if (st === 'captured') act = `<p class="nm-seal">Captured at ${r.duel.score} · ${esc(duel.name)}</p><p class="nm-note">Off the wall for good.</p>`;
  else act = `<p class="nm-note">Lost at ${r.duel.score}. It comes back next Monday until you beat it.</p>`;
  return `<section class="nm nm-${st}" aria-label="Wanted: ${esc(r.w)}"><div class="nm-top"><span>Wanted</span><span>Week of ${esc(fmtWeek(wk))}</span></div>
   <h3 class="nm-w">${esc(r.w)}</h3>${r.pos ? `<p class="nm-pos">${esc(r.pos)}</p>` : ''}<p class="nm-def">${esc(r.def)}</p>${meta}${act}</section>`;
}
