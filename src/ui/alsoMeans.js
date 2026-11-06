// "Also means": under the main definition on a book, the word's other meanings and what its closest synonyms mean.
// Reads senses.json (the same data the judge accepts these meanings from), loaded on first use; nothing shows until it is there.
import {sensesOf, loadSenses} from '../scorer/senses.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);

/** Rows to show: other senses first (max 2), then up to 2 synonym meanings; the main definition is never repeated. */
export function meaningRows(b, sen) {
  const s = sensesOf(b?.w, sen); if (!s || b.skipped) return [];
  const main = String(b.def || '').toLowerCase();
  const alt = (s.alt || []).filter(a => a[1].toLowerCase() !== main).slice(0, 2).map(([pos, g]) => ({k: pos, g}));
  // A synonym that is only a piece of another listed synonym ("club" inside "nightclub") is a different word's sense: skip it.
  const all = s.rs && b.room ? [] : (s.syn || []); // rs: the synonyms were built for the main list's sense, not this room's
  const part = w => all.some(([o]) => o !== w && o.length > w.length && (o.endsWith(w) || o.startsWith(w)));
  const syn = all.filter(([w]) => !part(w)).slice(0, 2).map(([w, g]) => ({k: w, g, syn: true}));
  return [...alt, ...syn];
}

export function alsoMeansHTML(b, sen) {
  const rows = meaningRows(b, sen);
  if (!rows.length) return '';
  return `<div class="means"><small>Also means</small><ul>${rows.map(r => `<li>${r.syn ? `<i>${esc(r.k)}</i> ` : `<em>${esc(r.k)}</em> `}${esc(lc(r.g))}</li>`).join('')}</ul></div>`;
}

/** Fills the slot once senses.json has loaded (a card opens instantly; the extra meanings appear a beat later). */
export async function fillMeans(root, b) {
  const slot = root.querySelector('.means-slot'); if (!slot) return;
  await loadSenses();
  if (slot.isConnected) slot.outerHTML = alsoMeansHTML(b);
}
