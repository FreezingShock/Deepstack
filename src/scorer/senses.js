// Other meanings of a word and the meanings of its synonyms (public/data/senses.json, built by scripts/build-senses.mjs).
// The judge accepts them too (at a small discount) and the book shows them under the main definition.
import {dataUrl} from '../core/dataUrl.js';
let SEN = null; // word -> {alt:[[pos,gloss]], syn:[[synonym,gloss]]}

export const setSenses = obj => { SEN = obj || null; };
export const sensesOf = (w, sen = SEN) => sen?.[w] || null;

let loading = null;
/** Fetches senses.json once. Resolves false (never throws) when missing, so the judge still works without it. */
export function loadSenses(url = dataUrl('senses.json')) {
  return loading ||= (async () => {
    try {
      const r = await fetch(url);
      if (!r.ok || /html/.test(r.headers.get('content-type') || '')) throw new Error('HTTP ' + r.status);
      setSenses((await r.json()).words); return true;
    } catch (err) { console.warn('Judge senses unavailable:', err); return false; }
  })();
}

/** Extra reference texts: other senses of the word, then its synonyms' meanings (a synonym name leads its gloss so the text stays on topic). */
export function senseTexts(word, sen = SEN) {
  const s = sensesOf(word.w, sen);
  return {alt: (s?.alt || []).map(a => a[1].replace(/\.$/, '')), syn: (s?.syn || []).map(a => a[0] + ': ' + a[1].replace(/\.$/, ''))};
}
