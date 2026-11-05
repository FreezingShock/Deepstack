// The "Coach" strip a Practice card carries: what counted, what was missing, the ideas worth naming.
import {coachNotes} from '../core/practice.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function coachHTML(b, w) {
  const n = coachNotes(b, w);
  const row = (cls, head, items) => items.length ? `<div class="pcrow ${cls}"><small>${head}</small><span>${items.map(esc).join(' · ')}</span></div>` : '';
  return `<div class="pcoach" aria-label="Practice notes"><small class="pck">Practice notes</small><p class="pch">${esc(n.headline)}</p>
   ${row('got', 'Counted', n.caught)}${row('lost', 'Missing', n.missed)}${n.ideas.length && !n.missed.length ? row('idea', 'Ideas to name', n.ideas) : ''}</div>`;
}

/** Slips the coach strip into an open result card, above the score row. */
export function addCoach(layer, b, w) {
  const inner = layer && layer.querySelector('.inner'), at = inner && inner.querySelector('.chips');
  if (at) at.insertAdjacentHTML('beforebegin', coachHTML(b, w));
}
