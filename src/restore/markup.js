/* Restoration markup and pure helpers (no DOM, no CSS import) so tests can check what the bench would show. ui.js paints these. */
import {roomById} from '../core/rooms.js';
import {smudgedShown, pageComplete, pageDamage} from './pages.js';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export const roomName = id => roomById(id).name;


/** One passage. A faded entry shows the headword and ink blots until it is restored; a smudged one shows its definition and the headword with gaps. */
export function passageHTML(p, i, fresh = false) {
  const label = p.kind === 'smudged' ? 'Smudged entry' : 'Faded entry';
  const pos = p.pos ? `<span class="rs-pos">${esc(p.pos)}</span>` : '';
  if (p.done) {
    const cls = `rs-p ${p.kind} done${p.restored ? ' restored' : ' left'}${fresh && p.restored ? ' fresh' : ''}`;
    const word = p.kind === 'smudged' && !p.restored ? smudgedShown(p).join('') : p.w;
    return `<section class="${cls}" data-i="${i}"><div class="rs-label">${label}${p.restored ? '' : ' · left as it was'}</div>
      <h3 class="rs-head">${esc(word)}${pos}</h3>
      ${p.restored ? `<p class="rs-def">${esc(p.def)}</p>` : `<p class="rs-lost">${p.kind === 'smudged' ? 'The word stays smudged.' : 'The rest of this entry has run.'}</p>`}
    </section>`;
  }
  if (p.kind === 'smudged') {
    const shown = smudgedShown(p).map(c => (c === '_' ? '<span class="gap">_</span>' : esc(c))).join('');
    const left = (p.hidden || []).length - (p.hints || 0);
    return `<section class="rs-p smudged" data-i="${i}">
      <div class="rs-label">${label}</div>
      <p class="rs-def clear">${esc(p.def)}</p>
      <div class="rs-smear"><span class="rs-word" role="img" aria-label="Headword with missing letters: ${esc(smudgedShown(p).join(''))}">${shown}</span></div>
      <form class="rs-form" data-i="${i}" data-kind="smudged">
        <input class="rs-in one" type="text" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="The missing word" placeholder="The missing word\u2026">
        <div class="rs-row">
          <button class="rs-btn rs-primary" type="submit">Write the word</button>
          <button class="rs-btn" type="button" data-act="letter" data-i="${i}"${left > 0 ? '' : ' disabled'}>A letter${left > 0 ? ` (${left} left)` : ''}</button>
          <button class="rs-btn quiet" type="button" data-act="leave" data-i="${i}">Leave it</button>
        </div>
      </form>
      <p class="rs-msg" aria-live="polite"></p>
    </section>`;
  }
  return `<section class="rs-p faded" data-i="${i}">
      <div class="rs-label">${label}</div>
      <h3 class="rs-head">${esc(p.w)}${pos}</h3>
      <div class="rs-blot" aria-hidden="true"><i style="--w:88%"></i><i style="--w:62%"></i><i style="--w:76%"></i></div>
      <p class="rs-ask">The definition has run. Write what this word means, in your own words.</p>
      <form class="rs-form" data-i="${i}" data-kind="faded">
        <textarea class="rs-in" rows="2" maxlength="300" aria-label="What ${esc(p.w)} means" placeholder="In your own words…"></textarea>
        <div class="rs-row">
          <button class="rs-btn rs-primary" type="submit">Set the ink</button>
          <button class="rs-btn quiet" type="button" data-act="leave" data-i="${i}">Leave it faded</button>
        </div>
      </form>
      <p class="rs-msg" aria-live="polite">${p.tries ? 'Only faint ink came back. Say more about what it means.' : ''}</p>
    </section>`;
}

export const footHTML = pg => {
  const n = pg.passages.filter(p => p.restored).length;
  return pageComplete(pg)
    ? `<p class="rs-msg done">${n === pg.passages.length ? 'Every entry is back in ink.' : `${n} of ${pg.passages.length} entries came back.`} The page is pinned to the wall.</p>
       <button class="rs-btn rs-primary" type="button" data-act="next">Print the next damaged page</button>`
    : `<p class="rs-progress">${n} of ${pg.passages.length} entries restored</p>`;
};

/** The sheet: a vellum page with a water stain whose strength is the damage left on it. */
export function sheetHTML(pg, freshI = -1) {
  return `<div class="rs-sheet${pageComplete(pg) ? ' done' : ''}" data-page="${esc(pg.id)}" style="--damage:${pageDamage(pg).toFixed(3)}">
    <div class="rs-stain" aria-hidden="true"></div>
    <div class="rs-pages">${pg.passages.map((p, i) => passageHTML(p, i, i === freshI)).join('')}</div>
    <div class="rs-foot">${footHTML(pg)}</div>
  </div>`;
}

/** One frame on the wall: the page's entries, with any left unrestored shown as lost. */
export function frameHTML(pg) {
  const rows = pg.passages.map(p => `<p class="rs-line${p.restored ? '' : ' lost'}"><b>${esc(p.w)}</b> ${p.restored ? esc(p.def) : `<em>${p.kind === 'smudged' ? 'The word stayed smudged.' : 'The rest of this entry has run.'}</em>`}</p>`).join('');
  return `<figure class="rs-frame"><figcaption><span>${esc(roomName(pg.room))}</span><span>Page ${pg.seed}${pg.at ? ' · ' + esc(pg.at) : ''}</span></figcaption><div class="rs-paper">${rows}</div></figure>`;
}

export function wallHTML(list) {
  if (!list.length) return `<div class="rs-empty"><p>The wall is bare. Restore a page and it hangs here.</p><button class="rs-btn rs-primary" type="button" data-act="bench">Back to the bench</button></div>`;
  return `<div class="rs-wall">${list.map(frameHTML).join('')}</div>`;
}

