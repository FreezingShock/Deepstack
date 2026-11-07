/* The review shelf's pages (a second view of the Shelf book). Pure string builders: no DOM, no storage, so the test
   can read every page. reviewWire.js makes them live; bookMenus.js swaps between the shelf and this view. */
import {esc, chunk} from './bookpages.js';
import {reviewItems, REVIEW_BELOW} from '../core/reviewShelf.js';
import {TIERS} from '../core/tiers.js';

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

/**
 * The review view as leaves (pages), in book order: the overview, contents pages, then one page per word.
 * `at` maps each word's key to its leaf index so a contents row can jump there.
 */
export function reviewLeaves(S, {items = reviewItems(S), shelfCount = (S && S.shelf ? S.shelf.length : 0)} = {}) {
  const n = items.length, leaves = [], at = {};
  const head = `<h1>To review</h1><div class="kicker">${n ? `${plural(n, 'word', 'words')} to win back` : 'Nothing to win back'}</div>`;
  const intro = `<p class="note">Words you missed, or scored under ${REVIEW_BELOW} on. Read the real meaning, then try the word again from memory. ` +
    `A re-try at ${REVIEW_BELOW} or better wins the word back. Re-tries add no books and no depth.</p>`;
  leaves.push(`${head}${viewTabs('review', shelfCount, n)}${intro}` +
    (n ? '' : `<p class="empty rv-empty">Every word you have missed, you have since met. A word you miss in a Daily or a room lands here.</p>`));
  if (!n) return {leaves, at, items};
  const contents = chunk(items.map((it, i) => ({it, i})), CONTENTS_PER_PAGE);
  const firstEntry = 1 + contents.length;
  items.forEach((it, i) => { at[it.key] = firstEntry + i; });
  contents.forEach((rows, p) => {
    const first = p === 0 ? '<h2>Contents</h2>' : '<h2>Contents, cont.</h2>';
    leaves.push(`${first}<ul class="rv-toc">${rows.map(({it}) => contentsRow(it, at[it.key])).join('')}</ul>`);
  });
  items.forEach((it, i) => leaves.push(entryPage(it, i + 1, n)));
  return {leaves, at, items};
}
