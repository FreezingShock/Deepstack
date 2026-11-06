// "Also accepted": under the true word on a result card, a handwritten line of other words that would have counted.
// Reads the judge's own relation data, so it only lists words the judge really forgives. Shown after the answer, never before.
import {relOf, stemOf} from '../scorer/relations.js';
import {relEntry} from '../scorer/lexicon.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
/** Cards for answers this far along (or beyond) show the line; lower scores stay quiet. */
export const MIN_SCORE = 30;

/** Up to `max` single-word synonyms of the word; a word the player wrote comes first and is flagged. */
export function alsoAccepted(b, rel, max = 4) {
  if (!b || b.skipped || !b.answer || !(b.score >= MIN_SCORE)) return [];
  const r = rel ? relOf(b.w, rel) : relEntry(b.w); if (!r) return []; // the page holds only the entries it asked for (lexicon.js)
  const w = b.w.toLowerCase(), typed = new Set(b.answer.toLowerCase().split(/[^a-z]+/).filter(Boolean).map(stemOf));
  const seen = new Set(), out = [];
  for (const x of [...(r.s || []), ...(r.c || [])]) {
    if (/[^a-z]/.test(x) || x.slice(0, 4) === w.slice(0, 4) || seen.has(x)) continue; // plain words only; kin of the word teach nothing
    seen.add(x); out.push({word: x, yours: typed.has(stemOf(x))});
  }
  out.sort((p, q) => q.yours - p.yours);
  return out.slice(0, max);
}

export function alsoAcceptedHTML(b, rel) {
  const l = alsoAccepted(b, rel);
  if (!l.length) return '';
  return `<p class="also"><small>Also accepted</small> ${l.map(x => x.yours ? `<u>${esc(x.word)}</u>` : esc(x.word)).join(', ')}</p>`;
}
