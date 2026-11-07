// Margin note: a tucked page under the result card's meanings with the word's etymology, one usage example and related words.
// It costs nothing until the player turns to it: the card only renders a ribbon tab, and the note's shard
// (public/data/word-notes-<letter>.json, built by scripts/build-word-notes.mjs) is fetched on the first open and kept.
import {dataUrl} from '../core/dataUrl.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One fetch per first letter, shared by every card. A failed fetch is forgotten so the next open tries again.
const shards = new Map();
export const shardKey = w => (/^[a-z]/i.test(w) ? w[0].toLowerCase() : 'other');
export function loadNote(word) {
  const k = shardKey(word);
  if (!shards.has(k)) {
    const p = fetch(dataUrl(`word-notes-${k}.json`))
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => j.words || {})
      .catch(err => { shards.delete(k); throw err; });
    shards.set(k, p);
  }
  return shards.get(k).then(ws => (Object.prototype.hasOwnProperty.call(ws, word) ? ws[word] : null));
}

/** The note's text as HTML. The headword is set in italics wherever the example uses it. */
export function noteHTML(word, n) {
  if (!n) return '<p class="mn-none">No note on this one yet. Wiktionary has no etymology or example for it.</p>';
  const rows = [];
  if (n.e) rows.push(`<div class="mn-row"><small>Etymology</small><p>${esc(n.e)}</p></div>`);
  if (n.x || n.u) {
    const ex = n.x ? esc(n.x).replace(new RegExp(`\\b(${escRe(word)}\\w{0,4})\\b`, 'gi'), '<em>$1</em>') : '';
    rows.push(`<div class="mn-row"><small>Usage${n.u ? ` · ${esc(n.u)}` : ''}</small>${ex ? `<p class="mn-ex">“${ex}”</p>` : ''}</div>`);
  }
  if (n.r?.length) rows.push(`<div class="mn-row"><small>Related</small><ul class="mn-rel">${n.r.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>`);
  rows.push('<p class="mn-src">Source: Wiktionary, CC BY-SA 4.0</p>');
  return rows.join('');
}

/** The ribbon tab and the (closed) page. Goes under the meanings on a result card. */
export function marginNoteHTML(b) {
  if (!b?.w) return '';
  return `<div class="mn" data-word="${esc(b.w)}"><button type="button" class="mn-tab" aria-expanded="false" aria-controls="mnPage">Margin note</button>`
    + `<div class="mn-body" id="mnPage" aria-hidden="true"><div class="mn-in"><div class="mn-page" aria-live="polite"></div></div></div></div>`;
}

// Kept open from one card to the next, but only once the player has seen the meaning. A card that is already read (a shelf card)
// opens with the note at once; a judged card waits for its verdict, which is when the meaning has been shown. Turning back clears it.
let keepOpen = false;

/** Wires the tab on a rendered card. The note is fetched on the first open; nothing loads before that. */
export function wireMarginNote(root, b) {
  const box = root.querySelector('.mn[data-word]');
  if (!box) return;
  const tab = box.querySelector('.mn-tab'), body = box.querySelector('.mn-body'), page = box.querySelector('.mn-page');
  const verdict = root.querySelector('#vd');
  let loaded = false;
  const show = async open => {
    box.classList.toggle('open', open);
    // Turning to the note takes the page: the definition and meanings step aside (see .book.mn-on in wordNotes.css), and the tab turns back.
    box.closest('.book')?.classList.toggle('mn-on', open);
    tab.textContent = open ? 'Back to the word' : 'Margin note';
    tab.setAttribute('aria-expanded', String(open));
    body.setAttribute('aria-hidden', String(!open));
    keepOpen = open;
    if (!open || loaded) return;
    loaded = true;
    page.innerHTML = '<p class="mn-none">Turning to the margin\u2026</p>';
    try {
      const n = await loadNote(b.w);
      if (box.isConnected) page.innerHTML = noteHTML(b.w, n);
    } catch {
      loaded = false;
      if (box.isConnected) page.innerHTML = '<p class="mn-none">The margin note would not load. Try again in a moment.</p>';
    }
  };
  tab.onclick = () => show(!box.classList.contains('open'));
  if (keepOpen) {
    if (!verdict || verdict.classList.contains('on')) show(true);
    else {
      const watch = new MutationObserver(() => {
        if (!box.isConnected || !keepOpen) { watch.disconnect(); return; }
        if (verdict.classList.contains('on')) { watch.disconnect(); show(true); }
      });
      watch.observe(verdict, {attributes: true, attributeFilter: ['class']});
    }
  }
}
