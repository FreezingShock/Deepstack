/* The review shelf's pages (a second view of the Shelf book). Pure string builders: no DOM, no storage, so the test
   can read every page. reviewWire.js makes them live; bookMenus.js swaps between the shelf and this view. */
import {esc, chunk} from './bookpages.js';
import {reviewItems, REVIEW_BELOW} from '../core/reviewShelf.js';
import {TIERS} from '../core/tiers.js';
import {bookRoom} from '../core/shelfRooms.js';
import {ROOMS, rgbOf} from '../core/rooms.js';

export const CONTENTS_PER_PAGE = 7; // contents rows on one page: a page holds about this many before it scrolls

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** The Shelf / To review switch, drawn with the shelf's filter chips. */
export function viewTabs(view, shelfCount, reviewN) {
  return `<div class="chips sv-tabs" role="group" aria-label="Shelf view">` +
    `<button class="fchip sv-tab" type="button" data-view="shelf" aria-pressed="${view === 'shelf'}">Shelf <small>${shelfCount}</small></button>` +
    `<button class="fchip sv-tab" type="button" data-view="review" aria-pressed="${view === 'review'}">To review <small>${reviewN}</small></button></div>`;
}

const tierOfBook = b => TIERS[Number.isInteger(b.tier) ? b.tier : 0] || TIERS[0];

function contentsRow(it, leaf) {
  const t = tierOfBook(it.last);
  return `<li class="rv-row-item" style="--t:${t.spine}"><button type="button" class="rv-jump" data-leaf="${leaf}" aria-label="${esc(it.w)}, ${esc(t.name)}, ${it.last.score|0} out of 100">` +
    `<i class="rv-dot" aria-hidden="true"></i><span class="rv-w">${esc(it.w)}</span><span class="rv-s">${esc(t.name)} · ${it.last.score|0}</span></button></li>`;
}

function entryPage(it, i, n) {
  const b = it.last, t = tierOfBook(b);
  const wrote = b.answer ? esc(b.answer) : '<i>Skipped. The word stayed closed.</i>';
  const ideas = (b.fb && Array.isArray(b.fb.m) ? b.fb.m : []).slice(0, 4);
  const meta = it.retry
    ? `Re-tried ${plural(it.retry.tries, 'time', 'times')} · best ${it.retry.best}`
    : (it.n > 1 ? `Missed ${plural(it.n, 'time', 'times')}` : 'Not re-tried yet');
  return `<section class="rv-entry" data-key="${esc(it.key)}" data-leaf-n="${i}" style="--t:${t.spine}">` +
    `<div class="kicker">To review · ${i} of ${n}</div>` +
    `<h1 class="rv-word">${esc(it.w)}</h1>` +
    `<div class="rv-pos">${esc(b.pos || '')}</div>` +
    `<div class="rv-score"><i class="rv-dot" aria-hidden="true"></i>${esc(t.name)} · ${b.score | 0}/100</div>` +
    `<dl class="rv-facts">` +
      `<dt>You wrote</dt><dd class="rv-wrote">${wrote}</dd>` +
      `<dt>What it means</dt><dd class="rv-def">${esc(b.def || '')}</dd>` +
      (ideas.length ? `<dt>Ideas you missed</dt><dd><ul class="rv-ideas">${ideas.map(m => `<li>${esc(m)}</li>`).join('')}</ul></dd>` : '') +
    `</dl>` +
    `<div class="rv-actions"><button type="button" class="rv-try">Try again</button>` +
      `<button type="button" class="rv-back" data-leaf="1">Contents</button><span class="rv-meta">${esc(meta)}</span></div>` +
    `<form class="rv-form" hidden>` +
      `<label class="rv-label" for="rv-in-${i}">Write it from memory, in your own words</label>` +
      `<textarea id="rv-in-${i}" class="rv-in" rows="2" maxlength="300" placeholder="In your own words…" aria-label="Your explanation of ${esc(it.w)}"></textarea>` +
      `<div class="rv-row"><button type="submit" class="rv-go">Check my answer</button><button type="button" class="rv-close">Not now</button></div>` +
      `<p class="rv-result" aria-live="polite"></p>` +
    `</form></section>`;
}

/** The words the room and rarity filters keep. A word is judged by the book it shows (its latest). '' and -1 mean all. */
export function filterReview(items, {room = '', tier = -1} = {}) {
  return items.filter(it => (!room || bookRoom(it.last) === room) && (tier < 0 || (it.last.tier | 0) === tier));
}

/** The room and rarity chips, counted over every word to review (not the filtered set), so each chip shows its size. */
function reviewFilterChips(all, {room, tier}) {
  const rc = {}, tc = {};
  for (const it of all) {
    const r = bookRoom(it.last), t = Number.isInteger(it.last.tier) ? it.last.tier : 0;
    rc[r] = (rc[r] || 0) + 1; tc[t] = (tc[t] || 0) + 1;
  }
  const rooms = ROOMS.filter(r => rc[r.id]), tiers = TIERS.filter(t => tc[t.id]);
  const roomRow = rooms.length < 2 && !room ? '' :
    `<div class="chipgroup"><div class="kicker">Room</div><div class="chips" role="group" aria-label="Room">` +
    `<button class="fchip rv-filter" type="button" data-k="room" data-v="" aria-pressed="${!room}">All</button>` +
    rooms.map(r => `<button class="fchip rv-filter" type="button" data-k="room" data-v="${r.id}" aria-pressed="${room === r.id}"><i class="dot" style="background:rgb(${rgbOf(r)})"></i>${esc(r.short)} <small>${rc[r.id]}</small></button>`).join('') +
    `</div></div>`;
  const tierRow = tiers.length < 2 && tier < 0 ? '' :
    `<div class="chipgroup"><div class="kicker">Rarity</div><div class="chips" role="group" aria-label="Rarity">` +
    `<button class="fchip rv-filter" type="button" data-k="tier" data-v="-1" aria-pressed="${tier < 0}">All</button>` +
    tiers.map(t => `<button class="fchip rv-filter" type="button" data-k="tier" data-v="${t.id}" aria-pressed="${tier === t.id}"><i class="dot" style="background:${t.spine}"></i>${t.name} <small>${tc[t.id]}</small></button>`).join('') +
    `</div></div>`;
  return roomRow + tierRow;
}

/**
 * The review view as leaves (pages), in book order: the overview, contents pages, then one page per word.
 * `room` and `tier` narrow the words (filterReview); the tab count still shows every word waiting.
 * `at` maps each word's key to its leaf index so a contents row can jump there.
 */
export function reviewLeaves(S, {items = reviewItems(S), shelfCount = (S && S.shelf ? S.shelf.length : 0), room = '', tier = -1} = {}) {
  const all = items, shown = filterReview(all, {room, tier}), n = shown.length, leaves = [], at = {};
  const filtered = n !== all.length;
  const kicker = n ? `${filtered ? `${n} of ${plural(all.length, 'word', 'words')}` : plural(n, 'word', 'words')} to win back`
    : all.length ? 'Nothing in this room or rarity' : 'Nothing to win back';
  const head = `<h1>To review</h1><div class="kicker">${kicker}</div>`;
  const intro = `<p class="note">Words you missed, or scored under ${REVIEW_BELOW} on. Read the real meaning, then try the word again from memory. ` +
    `A re-try at ${REVIEW_BELOW} or better wins the word back. Re-tries add no books and no depth.</p>`;
  const empty = all.length
    ? `<p class="empty rv-empty">No word to win back in this room or rarity. Choose All to see the rest.</p>`
    : `<p class="empty rv-empty">Every word you have missed, you have since met. A word you miss in a Daily or a room lands here.</p>`;
  leaves.push(`${head}${viewTabs('review', shelfCount, all.length)}${intro}${reviewFilterChips(all, {room, tier})}` +
    (n ? '' : empty));
  if (!n) return {leaves, at, items: shown};
  const contents = chunk(shown.map((it, i) => ({it, i})), CONTENTS_PER_PAGE);
  const firstEntry = 1 + contents.length;
  shown.forEach((it, i) => { at[it.key] = firstEntry + i; });
  contents.forEach((rows, p) => {
    const first = p === 0 ? '<h2>Contents</h2>' : '<h2>Contents, cont.</h2>';
    leaves.push(`${first}<ul class="rv-toc">${rows.map(({it}) => contentsRow(it, at[it.key])).join('')}</ul>`);
  });
  shown.forEach((it, i) => leaves.push(entryPage(it, i + 1, n)));
  return {leaves, at, items: shown};
}
